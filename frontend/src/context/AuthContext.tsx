import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken } from '../services/api';
import type { AuthContextType, UserProfile, OAuthProvider, PendingAuthAction, AuthReadyState } from '../types/auth';
import { recentAccountsManager, maskIdentifier } from '../services/recentAccounts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authState, setAuthState] = useState<AuthReadyState>('loading');
  const [pendingAction, setPendingAction] = useState<PendingAuthAction | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Restore session on mount via refresh endpoint (HttpOnly cookie or access token)
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const data = await api.refreshSession();
        if (isMounted && data?.user) {
          const u = data.user;
          setUser(u);
          setSession({ access_token: data.accessToken, user: u });
          setProfile({
            id: u.id,
            email: u.email || '',
            phone: u.mobile || null,
            full_name: u.name || null,
            username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
            avatar_url: u.avatarUrl || null,
            created_at: u.createdAt || new Date().toISOString(),
            updated_at: u.lastLoginAt || new Date().toISOString()
          });
          setIsDemoMode(u.email === 'demo@voicecart.app');
          setAuthState('authenticated');
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
          setSession(null);
          setAuthState('guest');
        }
      } catch {
        // No active cookie session found, user remains guest
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setSession(null);
          setAuthState('guest');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (identifier: string, password: string, rememberMe = true) => {
    try {
      const data = await api.login({ identifier, password, rememberMe });
      if (data?.user) {
        const u = data.user;
        setUser(u);
        setSession({ access_token: data.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
        setIsDemoMode(u.email === 'demo@voicecart.app');
        setAuthState('authenticated');

        if (rememberMe) {
          recentAccountsManager.saveRecentAccount({
            userId: u.id,
            displayName: u.name || 'Shopper',
            avatarInitial: (u.name || 'U')[0].toUpperCase(),
            maskedIdentifier: maskIdentifier(identifier),
            method: identifier.includes('@') ? 'email' : 'mobile'
          });
        }

        // Merge guest cart
        try {
          await api.mergeGuestCart();
        } catch {
          // ignore
        }
        return { error: null };
      }
      return { error: 'Login failed. Please check your credentials.' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Incorrect email or password.';
      return { error: errorMsg };
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    fullName?: string;
    username?: string;
  }) => {
    try {
      const data = await api.signup({
        name: params.fullName || params.username || params.email.split('@')[0],
        email: params.email,
        password: params.password,
        language: 'en'
      });

      if (data?.user) {
        const u = data.user;
        setUser(u);
        setSession({ access_token: data.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });

        // Merge guest cart
        try {
          await api.mergeGuestCart();
        } catch {
          // ignore
        }
        return { error: null, requiresVerification: false };
      }
      return { error: 'Registration failed.', requiresVerification: false };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Signup failed.';
      return { error: errorMsg, requiresVerification: false };
    }
  };

  const toggleDemoMode = async (enabled?: boolean) => {
    if (enabled === false && user?.email === 'demo@voicecart.app') {
      await signOut();
      return;
    }

    try {
      const data = await api.demoLogin();
      if (data?.user) {
        const u = data.user;
        setUser(u);
        setSession({ access_token: data.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || 'Demo Shopper',
          username: 'demo_shopper',
          avatar_url: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
        setIsDemoMode(true);
        setAuthState('authenticated');

        try {
          await api.mergeGuestCart();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    try {
      const data = await api.googleLogin({
        email: 'google_user@voicecart.app',
        name: 'Google User',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      });

      if (data?.user) {
        const u = data.user;
        setUser(u);
        setSession({ access_token: data.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
        setAuthState('authenticated');

        try {
          await api.mergeGuestCart();
        } catch {
          // ignore
        }
        return { error: null };
      }
      return { error: 'OAuth authentication failed' };
    } catch (err: any) {
      return { error: err.response?.data?.error || err.message || 'OAuth failed' };
    }
  };

  const signOut = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsDemoMode(false);
    setAuthState('guest');
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    try {
      const res = await api.forgotPassword(email);
      return { error: null, resetUrl: res.resetUrl };
    } catch (err: any) {
      return { error: err.response?.data?.error || err.message || 'Failed to request reset.' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    // If URL has token, parse it
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || '';

    try {
      const res = await api.resetPassword(token, newPassword);
      return { error: null, message: res.message };
    } catch (err: any) {
      return { error: err.response?.data?.error || err.message || 'Failed to update password.' };
    }
  };

  const updateProfile = async (updates: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  }) => {
    if (!user) return { error: 'User is not logged in', profile: null };

    try {
      const res = await api.updateAccountProfile({
        name: updates.full_name,
        avatarUrl: updates.avatar_url
      });
      const updatedProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        phone: user.mobile || null,
        full_name: updates.full_name || profile?.full_name || null,
        username: updates.username || profile?.username || null,
        avatar_url: updates.avatar_url || profile?.avatar_url || null,
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(updatedProfile);
      return { error: null, profile: updatedProfile };
    } catch (err: any) {
      return { error: err.response?.data?.error || err.message, profile: null };
    }
  };

  const resendVerificationEmail = async (_email: string) => {
    return { error: null };
  };

  const refreshProfile = async () => {
    try {
      const data = await api.refreshSession();
      if (data?.user) {
        const u = data.user;
        setUser(u);
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
      }
    } catch {
      // ignore
    }
  };

  const sendOtp = async (req: string | { identifier?: string; userId?: string }): Promise<{ success: boolean; message?: string; identifier?: string; maskedIdentifier?: string; resendCooldownSeconds?: number; demoOtp?: string; error?: string | null }> => {
    try {
      const res = await api.sendOtp(req);
      return { success: true, message: res.message, identifier: res.identifier, maskedIdentifier: res.maskedIdentifier, resendCooldownSeconds: res.resendCooldownSeconds, demoOtp: res.demoOtp, error: null };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to send verification code.';
      return { success: false, error: msg };
    }
  };

  const verifyOtp = async (
    identifier: string,
    otp: string,
    fullName?: string,
    preferredLanguage?: string,
    rememberMe = true,
    password?: string
  ): Promise<{ success: boolean; error?: string | null; isNewUser?: boolean }> => {
    try {
      const res = await api.verifyOtp({ identifier, otp, fullName, preferredLanguage, rememberMe, password });
      if (res.success && res.session?.user) {
        const u = res.session.user;
        setUser(u);
        setSession({ access_token: res.session.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || (identifier.includes('@') ? identifier : `${identifier}@voicecart.in`),
          phone: u.mobile || (!identifier.includes('@') ? identifier : null),
          full_name: u.name || fullName || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || `user_${u.id.slice(-4)}`,
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
        setAuthState('authenticated');

        // If remember me is enabled, save recent account chip (non-sensitive only)
        if (rememberMe) {
          recentAccountsManager.saveRecentAccount({
            userId: u.id,
            displayName: u.name || fullName || 'Shopper',
            avatarInitial: (u.name || fullName || 'U')[0].toUpperCase(),
            maskedIdentifier: maskIdentifier(identifier),
            method: identifier.includes('@') ? 'email' : 'mobile'
          });
        }

        try {
          await api.mergeGuestCart();
        } catch {
          // ignore
        }

        return { success: true, error: null, isNewUser: res.isNewUser };
      }
      return { success: false, error: res.message || 'Verification failed. Please try again.' };
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Invalid or expired verification code.';
      return { success: false, error: msg };
    }
  };

  const checkOtpStatus = async (identifier: string): Promise<{ verified: boolean }> => {
    try {
      const res = await api.checkOtpStatus(identifier);
      if (res.verified && res.session?.user) {
        const u = res.session.user;
        setUser(u);
        setSession({ access_token: res.session.accessToken, user: u });
        setProfile({
          id: u.id,
          email: u.email || '',
          phone: u.mobile || null,
          full_name: u.name || null,
          username: u.name?.toLowerCase().replace(/\s+/g, '_') || u.email?.split('@')[0] || 'user',
          avatar_url: u.avatarUrl || null,
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: u.lastLoginAt || new Date().toISOString()
        });
        setAuthState('authenticated');

        recentAccountsManager.saveRecentAccount({
          userId: u.id,
          displayName: u.name || 'Shopper',
          avatarInitial: (u.name || 'U')[0].toUpperCase(),
          maskedIdentifier: maskIdentifier(u.email || u.mobile || identifier),
          method: (u.email || identifier).includes('@') ? 'email' : 'mobile'
        });

        try {
          await api.mergeGuestCart();
        } catch {}
        return { verified: true };
      }
      return { verified: false };
    } catch {
      return { verified: false };
    }
  };

  const executePendingAction = async () => {
    setPendingAction(null);
  };

  const isEmailVerified = Boolean(
    isDemoMode ||
    user?.email_verified ||
    user?.emailVerified
  );

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    authState,
    isAuthReady: authState !== 'loading',
    isAuthenticated: Boolean(user),
    isEmailVerified,
    isConfigured: true,
    isDemoMode,
    pendingAction,
    setPendingAction,
    executePendingAction,
    sendOtp,
    verifyOtp,
    checkOtpStatus,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    resendVerificationEmail,
    refreshProfile,
    toggleDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
