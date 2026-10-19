import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../db/dbClient';
import { config } from '../config';
import { emailOtpSender } from './otp/emailOtpSender';
import { smsOtpSender } from './otp/smsOtpSender';
import { authService } from './authService';
import { AuthSessionResponse, UserRecord, OtpRecord } from '../types/user';

export interface RequestOtpResult {
  success: boolean;
  message: string;
  identifier: string;
  maskedIdentifier: string;
  type: 'email' | 'mobile';
  resendCooldownSeconds: number;
  demoOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  session?: AuthSessionResponse;
  refreshToken?: string;
  isNewUser: boolean;
  needsProfile?: boolean;
  identifier: string;
  user?: UserRecord;
  message: string;
}

export class OtpService {
  /**
   * Masks an email or phone number for safe non-sensitive UI display
   */
  public maskIdentifier(identifier: string): string {
    if (!identifier) return '';
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      const [local, domain] = trimmed.split('@');
      if (!local || !domain) return trimmed;
      const visible = local.length > 2 ? local[0] + '***' : local[0] + '***';
      return `${visible}@${domain}`;
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      return `+91 ${last10.slice(0, 2)}****${last10.slice(-2)}`;
    }
    return trimmed;
  }

  /**
   * Normalizes an identifier:
   * - Email: trimmed, lowercase
   * - Mobile: digits only, sliced to 10 digits
   */
  public normalizeIdentifier(input: string): { identifier: string; type: 'email' | 'mobile' } {
    const raw = (input || '').trim();
    if (raw.includes('@')) {
      const email = raw.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address.');
      }
      return { identifier: email, type: 'email' };
    }

    const cleanPhone = raw.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }
    return { identifier: cleanPhone, type: 'mobile' };
  }

  /**
   * Hashes the 6-digit OTP with an HMAC secret
   */
  private hashOtp(identifier: string, otp: string): string {
    return crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${identifier}:${otp}`)
      .digest('hex');
  }

  /**
   * Hashes a magic token
   */
  private hashMagicToken(magicToken: string): string {
    return crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`magic:${magicToken}`)
      .digest('hex');
  }

  /**
   * Constant-time comparison between entered OTP and stored hash
   */
  private verifyOtpHash(identifier: string, enteredOtp: string, storedHash: string): boolean {
    const computedHash = this.hashOtp(identifier, enteredOtp.trim());
    try {
      const bufA = Buffer.from(computedHash, 'hex');
      const bufB = Buffer.from(storedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Request / Send a 6-digit OTP code (Supports direct identifier or recent userId lookup)
   */
  public async sendOtp(
    input: string | { identifier?: string; userId?: string },
    ipAddress?: string
  ): Promise<RequestOtpResult> {
    const rawReq = typeof input === 'string' ? { identifier: input } : input;
    let resolvedIdentifier = rawReq.identifier;

    // If userId provided for 1-tap recent account re-login
    if (!resolvedIdentifier && rawReq.userId) {
      const user = await dbClient.findUserById(rawReq.userId);
      if (!user) {
        throw new Error('Account not found. Please enter your email or mobile number.');
      }
      resolvedIdentifier = user.email || user.mobile || '';
    }

    if (!resolvedIdentifier) {
      throw new Error('Please provide an email address or mobile number.');
    }

    const { identifier, type } = this.normalizeIdentifier(resolvedIdentifier);
    const masked = this.maskIdentifier(identifier);

    // 1. Rate Limiting: Max 5 requests per hour per identifier and per IP
    const recentCounts = await dbClient.getRecentOtpRequestCount(identifier, ipAddress, 60);
    if (recentCounts.identifierCount >= 5) {
      throw new Error('Too many OTP requests for this account. Please wait 1 hour before requesting another code.');
    }
    if (ipAddress && recentCounts.ipCount >= 10) {
      throw new Error('Too many OTP requests from your network. Please try again later.');
    }

    // 2. Check Existing OTP: Lockout & 30-second Resend Cooldown
    const existing = await dbClient.getOtpByIdentifier(identifier);
    const now = Date.now();

    if (existing) {
      // Check 15-minute lock on 5 failed attempts
      if (existing.attempts >= 5) {
        const lockExpiry = new Date(existing.expiresAt).getTime() + 10 * 60 * 1000;
        if (now < lockExpiry) {
          const remainingMinutes = Math.ceil((lockExpiry - now) / 60000);
          throw new Error(`Account locked due to multiple failed attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'}.`);
        }
      }

      // Check 30-second resend cooldown
      const createdAtMs = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
      const timeSinceCreated = now - createdAtMs;
      if (timeSinceCreated < 30 * 1000) {
        const remainingSec = Math.ceil((30 * 1000 - timeSinceCreated) / 1000);
        throw new Error(`Please wait ${remainingSec} second${remainingSec === 1 ? '' : 's'} before requesting a new code.`);
      }
    }

    // 3. Generate random 6-digit cryptographic OTP (100000 - 999999) & single-use magic token for email
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(identifier, rawOtp);
    const rawMagicToken = type === 'email' ? crypto.randomBytes(24).toString('hex') : null;
    const magicTokenHash = rawMagicToken ? this.hashMagicToken(rawMagicToken) : null;
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString(); // 5 minutes

    const otpRecord: OtpRecord = {
      id: 'otp_' + uuidv4().substring(0, 12),
      identifier,
      type,
      otpHash,
      magicTokenHash,
      verifiedSession: null,
      expiresAt,
      attempts: 0,
      ipAddress
    };

    // 4. Save/Replace active OTP in DB and log the request
    await dbClient.saveOtp(otpRecord);
    await dbClient.logOtpRequest(identifier, ipAddress);

    const isDevOrPresenter = Boolean(config.presenterMode || config.nodeEnv === 'development');

    // 5. Dispatch via appropriate channel adapter
    if (type === 'email') {
      const baseUrl = config.appUrl.replace(/\/$/, '');
      const magicLinkUrl = rawMagicToken ? `${baseUrl}/magic-login?token=${rawMagicToken}` : '';
      const sendRes = await emailOtpSender.sendOtp(identifier, rawOtp, { magicLinkUrl });
      if (!sendRes.success && !config.presenterMode && config.nodeEnv !== 'development') {
        throw new Error(sendRes.message || 'Failed to deliver email OTP.');
      }
      return {
        success: true,
        message: sendRes.message || `Verification code sent to ${masked}`,
        identifier,
        maskedIdentifier: masked,
        type: 'email',
        resendCooldownSeconds: 30,
        demoOtp: isDevOrPresenter ? rawOtp : undefined
      };
    } else {
      const sendRes = await smsOtpSender.sendOtp(identifier, rawOtp);
      if (!sendRes.success && !config.presenterMode && config.nodeEnv !== 'development') {
        throw new Error(sendRes.message || 'Mobile OTP is not available right now. Please use email.');
      }
      return {
        success: true,
        message: sendRes.message || `Verification code sent to ${masked}`,
        identifier,
        maskedIdentifier: masked,
        type: 'mobile',
        resendCooldownSeconds: 30,
        demoOtp: isDevOrPresenter ? rawOtp : undefined
      };
    }
  }

  /**
   * Verify a 6-digit OTP code and authenticate/register user
   */
  public async verifyOtp(params: {
    identifier: string;
    otp: string;
    fullName?: string;
    preferredLanguage?: string;
    rememberMe?: boolean;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<VerifyOtpResult> {
    const { identifier, type } = this.normalizeIdentifier(params.identifier);
    const enteredOtp = (params.otp || '').trim();

    if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
      throw new Error('Please enter a valid 6-digit numeric verification code.');
    }

    const record = await dbClient.getOtpByIdentifier(identifier);
    if (!record) {
      throw new Error('No active verification code found for this account. Please request a new code.');
    }

    const now = Date.now();
    const expiresAtMs = new Date(record.expiresAt).getTime();

    // Check expiry
    if (now > expiresAtMs) {
      await dbClient.deleteOtp(identifier);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    // Check lock
    if (record.attempts >= 5) {
      throw new Error('Too many failed attempts. This verification code is locked. Please request a new code.');
    }

    // Compare code in constant time
    const isCorrect = this.verifyOtpHash(identifier, enteredOtp, record.otpHash);
    if (!isCorrect) {
      const newAttempts = await dbClient.incrementOtpAttempts(identifier);
      const remaining = Math.max(0, 5 - newAttempts);
      if (remaining === 0) {
        throw new Error('Too many failed attempts. Code locked for 15 minutes. Please request a new code.');
      }
      throw new Error(`Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }

    // Code is valid! Consume and delete from DB immediately
    await dbClient.deleteOtp(identifier);

    // Find or create user
    let user = type === 'email'
      ? await dbClient.findUserByEmail(identifier)
      : await dbClient.findUserByMobile(identifier);

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const userId = 'usr_' + (type === 'email' ? 'em_' : 'ph_') + uuidv4().replace(/-/g, '').substring(0, 12);
      const defaultName = params.fullName?.trim() || (type === 'email' ? identifier.split('@')[0] : `User ${identifier.slice(-4)}`);

      user = await dbClient.createUser({
        id: userId,
        name: defaultName,
        email: type === 'email' ? identifier : `${identifier}@voicecart.in`,
        mobile: type === 'mobile' ? identifier : null,
        language: params.preferredLanguage || 'en',
        emailVerified: true
      });
    } else {
      if (params.fullName && params.fullName.trim() && user.name.startsWith('User ')) {
        user.name = params.fullName.trim();
        await dbClient.updateUser(user.id, { name: user.name });
      }
      if (params.preferredLanguage && params.preferredLanguage !== user.language) {
        user.language = params.preferredLanguage;
        await dbClient.updateUser(user.id, { language: user.language });
      }
    }

    await dbClient.updateUserLastLogin(user.id);

    // Record login activity
    await dbClient.recordLoginActivity({
      id: 'act_' + uuidv4().substring(0, 12),
      userId: user.id,
      timestamp: new Date().toISOString(),
      ip: params.ipAddress || '127.0.0.1',
      browser: params.userAgent || 'Web Browser',
      device: 'Desktop / Mobile',
      location: 'India',
      isCurrentDevice: true
    });

    // Generate standard session tokens (15m access token + 30d refresh token)
    const { token: accessToken, expiresIn } = authService.generateAccessToken(user);
    const refreshToken = await authService.createRefreshToken(user.id, params.rememberMe ?? true, params.userAgent, params.ipAddress);

    return {
      success: true,
      session: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          language: user.language,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        accessToken,
        expiresIn
      },
      refreshToken,
      isNewUser,
      identifier,
      user,
      message: isNewUser ? 'Account created and verified successfully.' : 'Signed in successfully.'
    };
  }

  /**
   * Verifies a 1-tap email magic link token
   */
  public async verifyMagicToken(params: {
    token: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<VerifyOtpResult> {
    const rawToken = (params.token || '').trim();
    if (!rawToken) {
      throw new Error('Invalid or missing verification link.');
    }

    const tokenHash = this.hashMagicToken(rawToken);
    const record = await dbClient.findOtpByMagicTokenHash(tokenHash);
    if (!record) {
      throw new Error('This verification link is invalid or has already been used.');
    }

    const now = Date.now();
    const expiresAtMs = new Date(record.expiresAt).getTime();
    if (now > expiresAtMs) {
      await dbClient.deleteOtp(record.identifier);
      throw new Error('This verification link has expired. Please request a new code.');
    }

    // Lookup or create user
    const identifier = record.identifier;
    let user = await dbClient.findUserByEmail(identifier);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const userId = 'usr_em_' + uuidv4().replace(/-/g, '').substring(0, 12);
      user = await dbClient.createUser({
        id: userId,
        name: identifier.split('@')[0],
        email: identifier,
        mobile: null,
        language: 'en',
        emailVerified: true
      });
    }

    await dbClient.updateUserLastLogin(user.id);

    const { token: accessToken, expiresIn } = authService.generateAccessToken(user);
    const refreshToken = await authService.createRefreshToken(user.id, true, params.userAgent, params.ipAddress);

    const sessionPayload: AuthSessionResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        language: user.language,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      accessToken,
      expiresIn
    };

    // Store verified session in DB so waiting browser tab can auto-sync and log in!
    await dbClient.setOtpVerifiedSession(identifier, JSON.stringify({ session: sessionPayload, refreshToken }));

    return {
      success: true,
      session: sessionPayload,
      refreshToken,
      isNewUser,
      identifier,
      user,
      message: 'Signed in via verification link.'
    };
  }

  /**
   * Checks if an active OTP has been verified externally (via email 1-tap link)
   */
  public async checkOtpStatus(identifierInput: string): Promise<{ verified: boolean; session?: AuthSessionResponse; refreshToken?: string }> {
    try {
      const { identifier } = this.normalizeIdentifier(identifierInput);
      const record = await dbClient.getOtpByIdentifier(identifier);
      if (!record || !record.verifiedSession) {
        return { verified: false };
      }

      const parsed = JSON.parse(record.verifiedSession);
      // Consume and clean up
      await dbClient.deleteOtp(identifier);

      return {
        verified: true,
        session: parsed.session,
        refreshToken: parsed.refreshToken
      };
    } catch {
      return { verified: false };
    }
  }

  /**
   * Returns which OTP delivery channels are available (names only, no secrets)
   */
  public getAvailableChannels(): { email: boolean; sms: boolean } {
    return {
      email: emailOtpSender.isAvailable(),
      sms: smsOtpSender.isAvailable()
    };
  }
}

export const otpService = new OtpService();
