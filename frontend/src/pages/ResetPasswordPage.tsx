import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
}

export const ResetPasswordPage: React.FC<Props> = ({ onNavigate, language }) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg('Password must contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
        setTimeout(() => onNavigate('/login'), 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
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
      </div>

      <div style={{ maxWidth: '440px', width: '100%', margin: '40px auto' }}>
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--border-color, #e4e6eb)',
            padding: '24px'
          }}
        >
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main, #1c1e21)' }}>
            Choose a new password
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #65676b)', marginBottom: '20px' }}>
            Create a new password that is at least 8 characters long and contains letters and numbers.
          </p>

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

          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 14px',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #ccd0d5)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-main, #1c1e21)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #8a8d91)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'var(--bg-subtle, #e4e6eb)',
                  color: 'var(--text-main, #4b4f56)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
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
                  flex: 1.5,
                  padding: '12px',
                  background: '#1877f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {loading ? <RefreshCw size={16} className="mic-active-pulse" /> : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted, #8a8d91)', padding: '16px 0' }}>
        VoiceCart India © 2026
      </footer>
    </div>
  );
};
