import { otpService } from '../src/services/otpService';
import { dbClient } from '../src/db/dbClient';

describe('OTP Authentication Pipeline Unit and Security Tests', () => {
  const getUniqueEmail = (prefix = 'user') => `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
  const getUniquePhone = () => '98' + Math.floor(10000000 + Math.random() * 90000000).toString();

  test('1. Normalize identifiers correctly for email and 10-digit mobile', () => {
    const emailNorm = otpService.normalizeIdentifier('   User.Test@Domain.COM   ');
    expect(emailNorm.identifier).toBe('user.test@domain.com');
    expect(emailNorm.type).toBe('email');

    const phoneNorm1 = otpService.normalizeIdentifier('+91 98765 43210');
    expect(phoneNorm1.identifier).toBe('9876543210');
    expect(phoneNorm1.type).toBe('mobile');

    const phoneNorm2 = otpService.normalizeIdentifier('09876543210');
    expect(phoneNorm2.identifier).toBe('9876543210');
    expect(phoneNorm2.type).toBe('mobile');

    expect(() => otpService.normalizeIdentifier('invalid-email')).toThrow();
    expect(() => otpService.normalizeIdentifier('12345')).toThrow();
  });

  test('2. OTP request stores HMAC hash in DB and never returns raw OTP', async () => {
    const email = getUniqueEmail('req');
    const res = await otpService.sendOtp(email);
    expect(res.success).toBe(true);
    expect(res.identifier).toBe(email.toLowerCase());
    expect(res.type).toBe('email');
    expect(res.resendCooldownSeconds).toBe(30);

    // Ensure raw OTP is NOT returned in response
    expect((res as any).otp).toBeUndefined();
    expect((res as any).demoOtp).toBeUndefined();

    // Verify record in database has a hash, not raw digits
    const record = await dbClient.getOtpByIdentifier(email.toLowerCase());
    expect(record).not.toBeNull();
    expect(record?.otpHash).toBeDefined();
    expect(record?.otpHash.length).toBe(64); // SHA-256 HMAC hex length
    expect(record?.attempts).toBe(0);
  });

  test('3. Enforce 30-second resend cooldown', async () => {
    const email = getUniqueEmail('cooldown');
    await otpService.sendOtp(email);
    
    // Immediate second send should be blocked by cooldown
    await expect(otpService.sendOtp(email)).rejects.toThrow(/Please wait \d+ seconds? before requesting a new code/i);
  });

  test('4. Reject invalid OTP codes and track attempt count', async () => {
    const email = getUniqueEmail('invalid');
    await otpService.sendOtp(email);

    // Attempt 1: wrong code
    await expect(
      otpService.verifyOtp({ identifier: email, otp: '000000' })
    ).rejects.toThrow(/Incorrect verification code\. 4 attempts remaining/i);

    const record1 = await dbClient.getOtpByIdentifier(email.toLowerCase());
    expect(record1?.attempts).toBe(1);

    // Attempt 2: wrong code
    await expect(
      otpService.verifyOtp({ identifier: email, otp: '111111' })
    ).rejects.toThrow(/Incorrect verification code\. 3 attempts remaining/i);

    const record2 = await dbClient.getOtpByIdentifier(email.toLowerCase());
    expect(record2?.attempts).toBe(2);
  });

  test('5. Lock account for 15 minutes after 5 failed attempts', async () => {
    const email = getUniqueEmail('lock');
    await otpService.sendOtp(email);

    for (let i = 1; i <= 4; i++) {
      try {
        await otpService.verifyOtp({ identifier: email, otp: '99999' + i });
      } catch {}
    }

    // 5th failed attempt should lock
    await expect(
      otpService.verifyOtp({ identifier: email, otp: '000000' })
    ).rejects.toThrow(/Too many failed attempts\. Code locked for 15 minutes/i);

    const record = await dbClient.getOtpByIdentifier(email.toLowerCase());
    expect(record?.attempts).toBe(5);
  });

  test('6. Expired OTP is rejected and purged', async () => {
    const email = getUniqueEmail('expired');
    await otpService.sendOtp(email);

    // Manually set expiry in the past
    const record = await dbClient.getOtpByIdentifier(email.toLowerCase());
    if (record) {
      record.expiresAt = new Date(Date.now() - 10000).toISOString();
      await dbClient.saveOtp(record);
    }

    await expect(
      otpService.verifyOtp({ identifier: email, otp: '123456' })
    ).rejects.toThrow(/Verification code has expired/i);

    // Record should be cleaned up
    const after = await dbClient.getOtpByIdentifier(email.toLowerCase());
    expect(after).toBeNull();
  });

  test('7. Successful OTP verification consumes record and issues authenticated session', async () => {
    const email = getUniqueEmail('auth');
    const testSecretOtp = '654321';
    const cleanId = email.toLowerCase();
    const testHash = (otpService as any).hashOtp(cleanId, testSecretOtp);

    await dbClient.saveOtp({
      id: 'otp_test_valid',
      identifier: cleanId,
      type: 'email',
      otpHash: testHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0
    });

    const verifyRes = await otpService.verifyOtp({
      identifier: cleanId,
      otp: testSecretOtp,
      fullName: 'Real Shopper',
      preferredLanguage: 'hi',
      rememberMe: true
    });

    expect(verifyRes.success).toBe(true);
    expect(verifyRes.session).toBeDefined();
    expect(verifyRes.session?.accessToken).toBeDefined();
    expect(verifyRes.session?.user.email).toBe(cleanId);
    expect(verifyRes.refreshToken).toBeDefined();

    // OTP record must be deleted from DB on success
    const consumed = await dbClient.getOtpByIdentifier(cleanId);
    expect(consumed).toBeNull();
  });

  test('8. Rate limit blocks after 5 requests per hour', async () => {
    const floodEmail = getUniqueEmail('flood');
    
    // Simulate 5 logged requests in DB
    for (let i = 0; i < 5; i++) {
      await dbClient.logOtpRequest(floodEmail.toLowerCase());
    }

    await expect(otpService.sendOtp(floodEmail)).rejects.toThrow(/Too many OTP requests for this account/i);
  });
});
