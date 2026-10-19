export interface UserRecord {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  passwordHash?: string | null;
  language: string;
  avatarUrl?: string | null;
  preferences?: Record<string, any>;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
    mobile?: string | null;
    language: string;
    avatarUrl?: string | null;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string;
  };
  accessToken: string;
  expiresIn: number;
}

export interface OtpRecord {
  id: string;
  identifier: string;
  type: 'email' | 'mobile';
  otpHash: string;
  magicTokenHash?: string | null;
  verifiedSession?: string | null;
  expiresAt: string;
  attempts: number;
  createdAt?: string;
  ipAddress?: string;
}

export interface OtpRequestLog {
  id: string;
  identifier: string;
  ipAddress?: string;
  createdAt: string;
}

