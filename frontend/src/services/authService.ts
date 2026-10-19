import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, OAuthProvider } from '../types/auth';
import type { Session, User } from '@supabase/supabase-js';

// Error mapping helper translating Supabase technical errors to user-friendly messages
export function mapSupabaseError(error: any): { message: string; isRateLimit: boolean } {
  if (!error) return { message: 'An unknown error occurred.', isRateLimit: false };

  const message = (error.message || error.error_description || '').toLowerCase();
  const status = error.status || error.code || 0;

  // Rate Limiting (HTTP 429)
  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return {
      message: 'Too many attempts. For your security, please wait a moment before trying again.',
      isRateLimit: true,
    };
  }

  // Invalid login credentials
  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('invalid grant')
  ) {
    return {
      message: 'Incorrect email or password. Please check your credentials and try again.',
      isRateLimit: false,
    };
  }

  // User already exists
  if (
    message.includes('user already registered') ||
    message.includes('already exists') ||
    message.includes('duplicate key')
  ) {
    return {
      message: 'An account with this email already exists. Please sign in instead.',
      isRateLimit: false,
    };
  }

  // Email not verified
  if (message.includes('email not confirmed') || message.includes('email address not confirmed')) {
    return {
      message: 'Please verify your email address first. Check your inbox for the confirmation link.',
      isRateLimit: false,
    };
  }

  // Weak password
  if (message.includes('password should be') || message.includes('weak password')) {
    return {
      message: 'Please choose a stronger password that meets the security requirements.',
      isRateLimit: false,
    };
  }

  // Network / Connection error
  if (message.includes('fetch failed') || message.includes('network') || message.includes('failed to fetch')) {
    return {
      message: 'Unable to connect to authentication server. Please check your internet connection.',
      isRateLimit: false,
    };
  }

  // OAuth Provider Not Enabled
  if (
    message.includes('provider is not enabled') ||
    message.includes('unsupported provider')
  ) {
    return {
      message: 'This OAuth provider is not enabled in your Supabase project yet.',
      isRateLimit: false,
    };
  }

  // Fallback to error message or default
  return {
    message: error.message || 'Authentication operation failed. Please try again.',
    isRateLimit: false,
  };
}

export const authService = {
  /**
   * Sign in with Email and Password
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; user: User | null; error: string | null; isRateLimit?: boolean }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { session: null, user: null, error: mapped.message, isRateLimit: mapped.isRateLimit };
      }

      return { session: data.session, user: data.user, error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { session: null, user: null, error: mapped.message, isRateLimit: mapped.isRateLimit };
    }
  },

  /**
   * Sign up new user with metadata (full_name, username)
   */
  async signUp(params: {
    email: string;
    password: string;
    fullName?: string;
    username?: string;
  }): Promise<{ user: User | null; session: Session | null; error: string | null; requiresVerification: boolean; isRateLimit?: boolean }> {
    try {
      const { email, password, fullName, username } = params;
      const redirectTo = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || '',
            username: username || email.split('@')[0],
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { user: null, session: null, error: mapped.message, requiresVerification: false, isRateLimit: mapped.isRateLimit };
      }

      // If user session is null, Supabase requires email verification
      const requiresVerification = !data.session;

      return {
        user: data.user,
        session: data.session,
        error: null,
        requiresVerification,
      };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { user: null, session: null, error: mapped.message, requiresVerification: false, isRateLimit: mapped.isRateLimit };
    }
  },

  /**
   * Initiate OAuth sign-in flow (Google, GitHub)
   */
  async signInWithOAuth(provider: OAuthProvider): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { error: mapped.message };
      }

      return { error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { error: mapped.message };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        const mapped = mapSupabaseError(error);
        return { error: mapped.message };
      }
      return { error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { error: mapped.message };
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ error: string | null; isRateLimit?: boolean }> {
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { error: mapped.message, isRateLimit: mapped.isRateLimit };
      }

      return { error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { error: mapped.message, isRateLimit: mapped.isRateLimit };
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { error: mapped.message };
      }

      return { error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { error: mapped.message };
    }
  },

  /**
   * Resend signup verification email
   */
  async resendVerificationEmail(email: string): Promise<{ error: string | null; isRateLimit?: boolean }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        const mapped = mapSupabaseError(error);
        return { error: mapped.message, isRateLimit: mapped.isRateLimit };
      }

      return { error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { error: mapped.message, isRateLimit: mapped.isRateLimit };
    }
  },

  /**
   * Get current active session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Fetch user profile from Supabase PostgreSQL profiles table
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      return data as UserProfile;
    } catch {
      return null;
    }
  },

  /**
   * Update user profile in Supabase PostgreSQL profiles table
   */
  async updateUserProfile(
    userId: string,
    updates: { full_name?: string; username?: string; avatar_url?: string }
  ): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        const mapped = mapSupabaseError(error);
        return { profile: null, error: mapped.message };
      }

      // Also update user metadata in auth.users
      await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          username: updates.username,
        },
      });

      return { profile: data as UserProfile, error: null };
    } catch (err: any) {
      const mapped = mapSupabaseError(err);
      return { profile: null, error: mapped.message };
    }
  },
};
