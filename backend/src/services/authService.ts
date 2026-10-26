import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../db/dbClient';
import { config } from '../config';
import { UserRecord, RefreshTokenRecord, PasswordResetRecord, AuthSessionResponse } from '../types/user';

interface LoginAttemptRecord {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}

export class AuthService {
  private loginAttempts: Map<string, LoginAttemptRecord> = new Map();

  constructor() {
    this.seedDemoUser();
  }

  public normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  public normalizeMobile(mobile: string): string {
    return mobile ? mobile.replace(/\D/g, '').slice(-10) : '';
  }

  public isMobile(identifier: string): boolean {
    const clean = identifier.replace(/\D/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(clean);
  }

  public isEmail(identifier: string): boolean {
    return identifier.includes('@');
  }

  public async seedDemoUser(): Promise<UserRecord> {
    const demoEmail = 'demo@voicecart.app';
    let user = await dbClient.findUserByEmail(demoEmail);

    if (!user) {
      const passwordHash = await bcrypt.hash(config.demoPassword, 12);
      user = await dbClient.createUser({
        id: 'usr_demo_4f8e21ab',
        name: 'Demo Shopper',
        email: demoEmail,
        mobile: '9876543210',
        passwordHash,
        language: 'en',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        emailVerified: true,
        preferences: {
          currency: 'INR',
          theme: 'system',
          notifications: true
        }
      });
      console.log(`✅ Demo user seeded: ${demoEmail} (password: ${config.demoPassword})`);
    }

    return user;
  }

  // Check rate limit and account lockout
  private checkRateLimit(identifier: string): { isLocked: boolean; waitMinutes?: number } {
    const key = identifier.toLowerCase();
    const record = this.loginAttempts.get(key);
    if (!record) return { isLocked: false };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingMs = record.lockedUntil - now;
      const waitMinutes = Math.ceil(remainingMs / 60000);
      return { isLocked: true, waitMinutes };
    }

    // Reset attempts if 15 minutes have passed since last attempt
    if (now - record.lastAttempt > 15 * 60 * 1000) {
      this.loginAttempts.delete(key);
      return { isLocked: false };
    }

    return { isLocked: false };
  }

  private registerFailedAttempt(identifier: string): void {
    const key = identifier.toLowerCase();
    const now = Date.now();
    const record = this.loginAttempts.get(key) || { attempts: 0, lastAttempt: now };

    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= 5) {
      record.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
    }

    this.loginAttempts.set(key, record);
  }

  private resetFailedAttempts(identifier: string): void {
    this.loginAttempts.delete(identifier.toLowerCase());
  }

  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public generateAccessToken(user: UserRecord): { token: string; expiresIn: number } {
    const payload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      role: 'authenticated'
    };

    // 15 minutes = 900 seconds
    const expiresIn = 15 * 60;
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn });
    return { token, expiresIn };
  }

  public async createRefreshToken(userId: string, rememberMe = true, userAgent?: string, ipAddress?: string): Promise<string> {
    const rawToken = uuidv4() + '-' + crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    // 30 days for Remember Me, 24 hours for standard session
    const durationDays = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const record: RefreshTokenRecord = {
      id: 'tok_' + uuidv4().substring(0, 16),
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date().toISOString(),
      userAgent,
      ipAddress,
      isRevoked: false
    };

    await dbClient.saveRefreshToken(record);
    return rawToken;
  }

  // ==========================================
  // SIGNUP
  // ==========================================
  public async signup(params: {
    name: string;
    email?: string;
    mobile?: string;
    password?: string;
    language?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ session: AuthSessionResponse; refreshToken: string }> {
    const { name, email, mobile, password, language, userAgent, ipAddress } = params;

    if (!name || !name.trim()) {
      throw new Error('Name is required');
    }

    const normalizedEmail = email ? this.normalizeEmail(email) : '';
    const normalizedMobile = mobile ? this.normalizeMobile(mobile) : '';

    if (!normalizedEmail && !normalizedMobile) {
      throw new Error('Email address or mobile number is required');
    }

    // Duplicate check
    if (normalizedEmail) {
      const existing = await dbClient.findUserByEmail(normalizedEmail);
      if (existing) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
    }

    if (normalizedMobile) {
      const existing = await dbClient.findUserByMobile(normalizedMobile);
      if (existing) {
        throw new Error('An account with this mobile number already exists. Please sign in instead.');
      }
    }

    let passwordHash: string | null = null;
    if (password) {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }
      passwordHash = await bcrypt.hash(password, 12);
    }

    const userId = 'usr_' + uuidv4().replace(/-/g, '').substring(0, 16);
    const user = await dbClient.createUser({
      id: userId,
      name: name.trim(),
      email: normalizedEmail || `${normalizedMobile}@voicecart.in`,
      mobile: normalizedMobile || null,
      passwordHash,
      language: language || 'en',
      emailVerified: true
    });

    // Record login activity
    await dbClient.recordLoginActivity({
      id: 'act_' + uuidv4().substring(0, 12),
      userId: user.id,
      timestamp: new Date().toISOString(),
      ip: ipAddress || '127.0.0.1',
      browser: userAgent || 'Browser',
      device: 'Desktop / Mobile',
      location: 'India',
      isCurrentDevice: true
    });

    const { token: accessToken, expiresIn } = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, true, userAgent, ipAddress);

    return {
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
      refreshToken
    };
  }

  // ==========================================
  // LOGIN
  // ==========================================
  public async login(params: {
    identifier: string;
    password?: string;
    rememberMe?: boolean;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ session: AuthSessionResponse; refreshToken: string }> {
    const { identifier, password, rememberMe = true, userAgent, ipAddress } = params;

    if (!identifier || !identifier.trim()) {
      throw new Error('Please enter your email or mobile number.');
    }

    const cleanInput = identifier.trim();
    const rateCheck = this.checkRateLimit(cleanInput);
    if (rateCheck.isLocked) {
      throw new Error(`Too many failed login attempts. Please wait ${rateCheck.waitMinutes} minute(s) before trying again.`);
    }

    let user: UserRecord | null = null;
    if (this.isEmail(cleanInput)) {
      user = await dbClient.findUserByEmail(this.normalizeEmail(cleanInput));
    } else if (this.isMobile(cleanInput)) {
      user = await dbClient.findUserByMobile(this.normalizeMobile(cleanInput));
    } else {
      user = await dbClient.findUserByEmail(this.normalizeEmail(cleanInput));
    }

    if (!user) {
      this.registerFailedAttempt(cleanInput);
      if (config.authGenericErrors) {
        throw new Error('Incorrect email or password. Please check your credentials and try again.');
      }
      throw new Error('No account found with this email or mobile number. Create one?');
    }

    if (!password) {
      throw new Error('Please enter your password.');
    }

    if (!user.passwordHash) {
      if (password && password.length >= 6) {
        // Auto-set password for phone user so they can log in seamlessly
        const newHash = await bcrypt.hash(password, 12);
        await dbClient.updateUserPassword(user.id, newHash);
        user.passwordHash = newHash;
        console.log(`🔑 [AUTH] Auto-linked initial password for user ${cleanInput}`);
      } else {
        throw new Error('This account was created with Google or Phone OTP. Please log in using that method.');
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      this.registerFailedAttempt(cleanInput);
      if (config.authGenericErrors) {
        throw new Error('Incorrect email or password. Please check your credentials and try again.');
      }
      throw new Error('Wrong password. Try again or reset it.');
    }

    if (!user.emailVerified) {
      throw new Error('Please confirm your email before logging in.');
    }

    // Success: reset rate limit & update last login
    this.resetFailedAttempts(cleanInput);
    await dbClient.updateUserLastLogin(user.id);

    // Record login activity
    await dbClient.recordLoginActivity({
      id: 'act_' + uuidv4().substring(0, 12),
      userId: user.id,
      timestamp: new Date().toISOString(),
      ip: ipAddress || '127.0.0.1',
      browser: userAgent || 'Browser',
      device: 'Desktop / Mobile',
      location: 'India',
      isCurrentDevice: true
    });

    const { token: accessToken, expiresIn } = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, rememberMe, userAgent, ipAddress);

    return {
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
      refreshToken
    };
  }

  // ==========================================
  // REFRESH TOKEN (Rotation)
  // ==========================================
  public async refreshSession(rawRefreshToken: string, userAgent?: string, ipAddress?: string): Promise<{ session: AuthSessionResponse; refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new Error('Refresh token is required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await dbClient.findRefreshToken(tokenHash);

    if (!storedToken || storedToken.isRevoked) {
      throw new Error('Invalid or revoked refresh token');
    }

    if (new Date(storedToken.expiresAt).getTime() < Date.now()) {
      await dbClient.revokeRefreshToken(tokenHash);
      throw new Error('Refresh token has expired. Please log in again.');
    }

    const user = await dbClient.findUserById(storedToken.userId);
    if (!user) {
      throw new Error('User associated with token not found');
    }

    // Token Rotation: revoke old token and issue fresh pair
    await dbClient.revokeRefreshToken(tokenHash);
    const newRefreshToken = await this.createRefreshToken(user.id, true, userAgent, ipAddress);
    const { token: accessToken, expiresIn } = this.generateAccessToken(user);

    return {
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
      refreshToken: newRefreshToken
    };
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  public async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await dbClient.revokeRefreshToken(tokenHash);
    }
  }

  public async logoutAllDevices(userId: string): Promise<void> {
    if (userId) {
      await dbClient.revokeAllUserRefreshTokens(userId);
    }
  }

  // ==========================================
  // FORGOT & RESET PASSWORD
  // ==========================================
  public async forgotPassword(emailOrMobile: string): Promise<{ success: boolean; resetToken?: string; resetUrl?: string; message: string }> {
    const clean = emailOrMobile.trim();
    let user: UserRecord | null = null;

    if (this.isEmail(clean)) {
      user = await dbClient.findUserByEmail(this.normalizeEmail(clean));
    } else if (this.isMobile(clean)) {
      user = await dbClient.findUserByMobile(this.normalizeMobile(clean));
    }

    if (!user) {
      // In demo mode, give clear feedback
      if (!config.authGenericErrors) {
        throw new Error('No account found with this email or mobile number.');
      }
      return { success: true, message: 'If an account exists, a reset link has been dispatched.' };
    }

    const rawToken = uuidv4() + '-' + crypto.randomBytes(16).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await dbClient.createPasswordReset({
      id: 'rst_' + uuidv4().substring(0, 12),
      userId: user.id,
      tokenHash,
      expiresAt,
      createdAt: new Date().toISOString()
    });

    const resetUrl = `${config.appUrl}/reset-password?token=${rawToken}`;
    console.log(`\n🔑 [PASSWORD RESET] Link generated for ${user.email}:\n👉 ${resetUrl}\n`);

    return {
      success: true,
      resetToken: rawToken,
      resetUrl,
      message: `Password reset link generated for ${user.email}.`
    };
  }

  public async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!token) throw new Error('Reset token is required');
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const tokenHash = this.hashToken(token);
    const resetRecord = await dbClient.findPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new Error('Invalid or already used password reset token.');
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      throw new Error('Password reset token has expired. Please request a new one.');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await dbClient.updateUserPassword(resetRecord.userId, newPasswordHash);
    await dbClient.markPasswordResetUsed(tokenHash);

    // Invalidate all active sessions for security
    await dbClient.revokeAllUserRefreshTokens(resetRecord.userId);

    return { success: true, message: 'Password has been updated successfully. Please log in with your new password.' };
  }

  // ==========================================
  // GOOGLE AUTH
  // ==========================================
  public async googleLogin(payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ session: AuthSessionResponse; refreshToken: string }> {
    const { email, name, avatarUrl, userAgent, ipAddress } = payload;
    const normalizedEmail = this.normalizeEmail(email);

    if (!normalizedEmail) {
      throw new Error('Google authentication requires a valid email address');
    }

    let user = await dbClient.findUserByEmail(normalizedEmail);
    if (!user) {
      const userId = 'usr_g_' + uuidv4().replace(/-/g, '').substring(0, 14);
      user = await dbClient.createUser({
        id: userId,
        name: name?.trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        avatarUrl: avatarUrl || null,
        language: 'en',
        emailVerified: true
      });
    }

    await dbClient.updateUserLastLogin(user.id);

    const { token: accessToken, expiresIn } = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, true, userAgent, ipAddress);

    return {
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
      refreshToken
    };
  }

  // ==========================================
  // PHONE OTP LOGIN
  // ==========================================
  public async loginWithPhoneUser(phoneUser: { id: string; phone: string; fullName: string; email?: string }): Promise<{ session: AuthSessionResponse; refreshToken: string }> {
    const cleanPhone = this.normalizeMobile(phoneUser.phone);
    let user = await dbClient.findUserByMobile(cleanPhone);

    if (!user) {
      user = await dbClient.createUser({
        id: phoneUser.id,
        name: phoneUser.fullName || `User ${cleanPhone.slice(-4)}`,
        email: phoneUser.email ? this.normalizeEmail(phoneUser.email) : `${cleanPhone}@voicecart.in`,
        mobile: cleanPhone,
        language: 'en',
        emailVerified: true
      });
    }

    await dbClient.updateUserLastLogin(user.id);
    const { token: accessToken, expiresIn } = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, true);

    return {
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
      refreshToken
    };
  }
}

export const authService = new AuthService();
