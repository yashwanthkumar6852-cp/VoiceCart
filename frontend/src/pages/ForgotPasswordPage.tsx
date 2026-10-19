import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const ForgotPasswordPage: React.FC<Props> = ({ onNavigate, language }) => {
  const { resetPassword, isDemoMode } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [demoResetNotice, setDemoResetNotice] = useState<string | null>(null);
  const isPresenter = typeof window !== 'undefined' && (
    localStorage.getItem('voicecart_presenter_mode') === 'true' ||
    new URLSearchParams(window.location.search).get('presenter') === '1'
  );

  const handleSearchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setDemoResetNotice(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter your email or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(cleanInput);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        if (res.resetUrl) {
          const urlObj = new URL(res.resetUrl);
          const token = urlObj.searchParams.get('token');
          setDemoResetNotice(token || 'verified');
        }
        setSuccessMsg(`Password reset instructions sent for ${cleanInput}.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error finding account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main, #f0f2f5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        fontFamily: language === 'kn' ? "'Noto Sans Kannada', sans-serif" : "'Inter', sans-serif"
      }}
    >
      {/* Top Header */}
      <div
        style={{
          maxWidth: '1040px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '20px'
        }}
      >
        <div
          onClick={() => onNavigate('/')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1877f2, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1877f2', margin: 0 }}>
            Voice<span style={{ color: '#06b6d4' }}>Cart</span>
          </h1>
        </div>

        <button
          onClick={() => onNavigate('/login')}
          style={{
            padding: '8px 16px',
            background: '#1877f2',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Log In
        </button>
      </div>

      {/* Centered Facebook-Style "Find Your Account" Card */}
      <div style={{ maxWidth: '500px', width: '100%', margin: '40px auto' }}>
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--border-color, #e4e6eb)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color, #dadde1)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main, #1c1e21)' }}>
              Find your VoiceCart account
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #65676b)', margin: 0 }}>
              Please enter your email address or 10-digit mobile number to search for your account and reset your password.
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {isPresenter && demoResetNotice && (
              <div
                style={{
                  background: 'rgba(24, 119, 242, 0.1)',
                  border: '1px solid rgba(24, 119, 242, 0.3)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: '#1877f2', fontWeight: 700 }}>
                  Presenter Token: {demoResetNotice}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #65676b)', margin: 0 }}>
                  Click below to proceed to the password reset screen:
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate(`/reset-password?token=${demoResetNotice}&identifier=${encodeURIComponent(identifier)}`)}
                  style={{
                    padding: '8px 14px',
                    background: '#1877f2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                >
                  Set New Password Now
                </button>
              </div>
            )}

            <form onSubmit={handleSearchAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email address or 10-digit mobile number"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #ccd0d5)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-main, #1c1e21)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color, #dadde1)',
                  marginTop: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  style={{
                    padding: '10px 18px',
                    background: 'var(--bg-subtle, #e4e6eb)',
                    color: 'var(--text-main, #4b4f56)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 22px',
                    background: '#1877f2',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {loading ? <RefreshCw size={16} className="mic-active-pulse" /> : 'Search'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted, #8a8d91)', padding: '16px 0' }}>
        VoiceCart India © 2026 • Secure Password Recovery
      </footer>
    </div>
  );
};
