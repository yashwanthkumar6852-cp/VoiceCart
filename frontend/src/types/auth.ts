import type { Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type OAuthProvider = 'google' | 'github';

export type PendingAuthAction =
  | { type: 'ADD_TO_CART'; payload: { product: any; quantity?: number } }
  | { type: 'BUY_NOW'; payload: { product: any } }
  | { type: 'OPEN_CART' }
  | { type: 'OPEN_ORDERS' }
  | { type: 'OPEN_PAYMENT' }
  | { type: 'NAVIGATE_ROUTE'; payload: { route: string } }
  | { type: 'VOICE_COMMAND'; payload: { transcript: string; command: any } };

export type AuthReadyState = 'loading' | 'guest' | 'authenticated';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  authState: AuthReadyState;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  pendingAction: PendingAuthAction | null;
  setPendingAction: (action: PendingAuthAction | null) => void;
  executePendingAction: () => Promise<void>;
  sendOtp: (req: string | { identifier?: string; userId?: string }) => Promise<{ success: boolean; message?: string; identifier?: string; maskedIdentifier?: string; resendCooldownSeconds?: number; demoOtp?: string; error?: string | null }>;
  verifyOtp: (identifier: string, otp: string, fullName?: string, preferredLanguage?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string | null; isNewUser?: boolean }>;
  checkOtpStatus: (identifier: string) => Promise<{ verified: boolean }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    fullName?: string;
    username?: string;
  }) => Promise<{ error: string | null; requiresVerification: boolean }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null; resetUrl?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  }) => Promise<{ error: string | null; profile: UserProfile | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  toggleDemoMode: (enabled?: boolean) => void;
}

export interface AuthErrorResponse {
  message: string;
  isRateLimit?: boolean;
  status?: number;
}
