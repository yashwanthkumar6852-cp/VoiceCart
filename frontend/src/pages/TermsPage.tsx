import React from 'react';
import { Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';

interface Props {
  onNavigate: (path: string) => void;
  language: SupportedLanguage;
}

export const TermsPage: React.FC<Props> = ({ onNavigate, language }) => {
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
              <ShieldCheck size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #1c1e21)' }}>
              VoiceCart Terms of Service
            </h1>
          </div>

          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Last updated: October 2026. Welcome to VoiceCart India. By accessing our live price comparison engine and voice assistant, you agree to these Terms.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '24px', color: 'var(--text-main, #1c1e21)' }}>
            1. Service Overview
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            VoiceCart aggregates public product prices, delivery speeds, and customer ratings from Amazon India, Flipkart, and Meesho to provide real-time recommendations and voice shopping capabilities in English, Hindi, and Kannada.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '20px', color: 'var(--text-main, #1c1e21)' }}>
            2. User Accounts & Security
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Users must be at least 13 years old to register an account. You are responsible for safeguarding your credentials and verifying one-time passwords (OTP). VoiceCart will never ask for your password or OTP over voice.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '20px', color: 'var(--text-main, #1c1e21)' }}>
            3. Pricing & Order Processing
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Product listings and availability are provided through live scraping and direct partner feeds. While we strive for 100% real-time accuracy, official store prices at the time of order confirmation govern all transactions.
          </p>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '20px', color: 'var(--text-main, #1c1e21)' }}>
            4. Payments & Simulation Notice
          </h3>
          <p style={{ color: 'var(--text-secondary, #65676b)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Payments in this build are simulated; no money is charged. Orders placed via VoiceCart Instant Checkout are tracked for fulfillment estimation.
          </p>
        </div>
      </div>
    </div>
  );
};
