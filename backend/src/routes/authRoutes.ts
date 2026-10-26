import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { otpService } from '../services/otpService';
import { dbClient } from '../db/dbClient';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string, rememberMe = true) => {
  const maxAge = (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;
  res.cookie('voicecart_refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('voicecart_refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
};

// ==========================================
// POST /api/auth/signup
// ==========================================
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, mobile, password, language } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    const { session, refreshToken } = await authService.signup({
      name,
      email,
      mobile,
      password,
      language,
      userAgent,
      ipAddress
    });

    setRefreshTokenCookie(res, refreshToken, true);
    return res.status(201).json(session);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

// ==========================================
// POST /api/auth/login
// ==========================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, email, mobile, password, rememberMe } = req.body;
    const cleanIdentifier = identifier || email || mobile;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    const isRemember = rememberMe !== false;
    const { session, refreshToken } = await authService.login({
      identifier: cleanIdentifier,
      password,
      rememberMe: isRemember,
      userAgent,
      ipAddress
    });

    setRefreshTokenCookie(res, refreshToken, isRemember);
    return res.json(session);
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

// ==========================================
// POST /api/auth/demo-login
// ==========================================
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    // Seed/get demo user and log in
    await authService.seedDemoUser();
    const { session, refreshToken } = await authService.login({
      identifier: 'demo@voicecart.app',
      password: config.demoPassword,
      rememberMe: true,
      userAgent,
      ipAddress
    });

    setRefreshTokenCookie(res, refreshToken, true);
    return res.json(session);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Demo login failed' });
  }
});

// ==========================================
// POST /api/auth/refresh
// ==========================================
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const cookieToken = req.cookies?.voicecart_refresh_token;
    const bodyToken = req.body?.refreshToken;
    const token = cookieToken || bodyToken;

    if (!token) {
      return res.json({ user: null, session: null, message: 'Guest session' });
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    const { session, refreshToken } = await authService.refreshSession(token, userAgent, ipAddress);
    setRefreshTokenCookie(res, refreshToken, true);
    return res.json(session);
  } catch (error: any) {
    clearRefreshTokenCookie(res);
    return res.json({ user: null, session: null, message: 'Guest session' });
  }
});

// ==========================================
// POST /api/auth/logout
// ==========================================
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.voicecart_refresh_token || req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    clearRefreshTokenCookie(res);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    clearRefreshTokenCookie(res);
    return res.json({ success: true, message: 'Logged out' });
  }
});

// ==========================================
// POST /api/auth/logout-all
// ==========================================
router.post('/logout-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.id) {
      await authService.logoutAllDevices(req.user.id);
    }
    clearRefreshTokenCookie(res);
    return res.json({ success: true, message: 'Logged out of all devices successfully' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to log out all devices' });
  }
});

// ==========================================
// POST /api/auth/google
// ==========================================
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { email, name, avatarUrl, googleId } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';

    const { session, refreshToken } = await authService.googleLogin({
      email,
      name,
      avatarUrl,
      googleId,
      userAgent,
      ipAddress
    });

    setRefreshTokenCookie(res, refreshToken, true);
    return res.json(session);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Google authentication failed' });
  }
});

// ==========================================
// POST /api/auth/forgot-password
// ==========================================
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, mobile, identifier } = req.body;
    const clean = identifier || email || mobile;
    if (!clean) {
      return res.status(400).json({ error: 'Please enter your email or mobile number.' });
    }

    const result = await authService.forgotPassword(clean);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to process password reset request.' });
  }
});

// ==========================================
// POST /api/auth/reset-password
// ==========================================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    const result = await authService.resetPassword(token, newPassword);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Password reset failed.' });
  }
});

// ==========================================
// POST /api/auth/otp/send
// ==========================================
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const userId = req.body.userId;

    if (!identifier && !userId) {
      return res.status(400).json({ error: 'Email address, 10-digit mobile number, or account ID is required' });
    }

    const result = await otpService.sendOtp({ identifier, userId }, req.ip);
    return res.json({
      success: true,
      message: result.message,
      identifier: result.identifier,
      maskedIdentifier: result.maskedIdentifier,
      type: result.type,
      resendCooldownSeconds: result.resendCooldownSeconds,
      demoOtp: result.demoOtp
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to send verification code' });
  }
});

// ==========================================
// POST /api/auth/otp/verify
// ==========================================
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const identifier = req.body.identifier || req.body.phone || req.body.email;
    const { otp, fullName, preferredLanguage, rememberMe = true, password } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: 'Identifier and 6-digit verification code are required' });
    }

    const result = await otpService.verifyOtp({
      identifier,
      otp,
      fullName,
      preferredLanguage,
      rememberMe,
      password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken, rememberMe);
    }

    return res.json({
      success: true,
      session: result.session,
      user: result.user,
      isNewUser: result.isNewUser,
      identifier: result.identifier,
      message: result.message
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

// ==========================================
// GET /api/auth/otp/magic-verify (1-Tap Email Link)
// ==========================================
router.get('/otp/magic-verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send('<h3>Invalid verification link</h3>');
    }

    const result = await otpService.verifyMagicToken({
      token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken, true);
    }

    // If client requested JSON (API fetch)
    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        session: result.session,
        user: result.user,
        message: 'Verified successfully'
      });
    }

    // Otherwise render sleek success landing page that stores token and redirects to home
    const sessionJson = JSON.stringify(result.session || {});
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>VoiceCart - Verified</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f2f5; }
          .card { background: white; padding: 32px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; width: 90%; }
          .check { width: 56px; height: 56px; background: #10b981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; }
          h2 { margin: 0 0 8px; color: #1e293b; }
          p { color: #64748b; font-size: 14px; margin: 0 0 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="check">✓</div>
          <h2>Verified Successfully!</h2>
          <p>Redirecting you to VoiceCart...</p>
        </div>
        <script>
          try {
            const sess = ${sessionJson};
            if (sess && sess.accessToken) {
              localStorage.setItem('voicecart_session', JSON.stringify(sess));
            }
          } catch (e) {}
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head><title>VoiceCart - Link Expired</title><style>body { font-family: sans-serif; text-align: center; padding: 60px; background: #f8fafc; }</style></head>
      <body>
        <h2>Verification Link Expired or Invalid</h2>
        <p style="color: #ef4444;">${error.message || 'Please request a new code from the login screen.'}</p>
        <p><a href="/login" style="color: #1877f2; font-weight: bold;">Return to Login</a></p>
      </body>
      </html>
    `);
  }
});

// ==========================================
// GET /api/auth/otp/status (Waiting Tab Poll)
// ==========================================
router.get('/otp/status', async (req: Request, res: Response) => {
  try {
    const identifier = req.query.identifier as string;
    if (!identifier) {
      return res.json({ verified: false });
    }

    const status = await otpService.checkOtpStatus(identifier);
    if (status.verified && status.refreshToken) {
      setRefreshTokenCookie(res, status.refreshToken, true);
    }
    return res.json(status);
  } catch {
    return res.json({ verified: false });
  }
});

// ==========================================
// GET /api/auth/otp/channels
// ==========================================
router.get('/otp/channels', (_req: Request, res: Response) => {
  return res.json({
    channels: otpService.getAvailableChannels()
  });
});

// ==========================================
// GET /api/auth/me (Protected route)
// ==========================================
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ==========================================
// GET /api/auth/debug (Dev-only diagnostic tool)
// ==========================================
router.get('/debug', async (req: Request, res: Response) => {
  if (config.nodeEnv === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const checkEmail = (req.query.email as string)?.trim().toLowerCase();
    const userCount = await dbClient.countUsers();
    let emailExists: boolean | null = null;
    let foundUserPreview: any = null;

    if (checkEmail) {
      const user = await dbClient.findUserByEmail(checkEmail);
      emailExists = Boolean(user);
      if (user) {
        foundUserPreview = {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          hasPassword: Boolean(user.passwordHash),
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        };
      }
    }

    return res.json({
      status: 'healthy',
      database: {
        type: dbClient.dbType,
        location: dbClient.dbLocation
      },
      totalUsers: userCount,
      query: checkEmail ? {
        email: checkEmail,
        exists: emailExists,
        user: foundUserPreview
      } : undefined
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
