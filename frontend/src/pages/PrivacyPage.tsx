import React from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
}

export const PrivacyPage: React.FC<Props> = ({ onNavigate, language }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main, #f0f2f5)',
        padding: '32px 16px',
        fontFamily: language === 'kn' ? "'Noto Sans Kannada', sans-serif" : "'Inter', sans-serif"
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => onNavigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#1877f2',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={18} /> Back to VoiceCart Home
        </button>

        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid var(--border-color, #e4e6eb)',
            padding: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1877f2, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #1c1e21)' }}>
              VoiceCart Privacy Policy
            </h1>
          </div>

          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Your privacy is of utmost importance to us. This Privacy Policy outlines how VoiceCart protects and handles your personal data.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', color: 'var(--text-main, #1c1e21)' }}>
            1. Information We Collect
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            We collect information provided directly by you during login and signup (name, email address, mobile number) to maintain your shopping cart, order tracking, and preferences across sessions.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '20px', color: 'var(--text-main, #1c1e21)' }}>
            2. Voice Recognition Data
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Voice transcripts are processed in real-time solely to extract shopping intents (product search, comparisons, cart commands). We do not record or retain voice audio or biometric identifiers.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '20px', color: 'var(--text-main, #1c1e21)' }}>
            3. Data Isolation & Security
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            All user records, carts, and order histories are cryptographically partitioned and protected by authentication tokens. We do not sell or monetize personal shopping history to third parties.
          </p>
        </div>
      </div>
    </div>
  );
};
