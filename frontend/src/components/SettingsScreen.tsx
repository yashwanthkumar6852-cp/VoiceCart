import React from 'react';
import { Settings, ShieldCheck, CheckCircle2, AlertTriangle, Globe, Sliders, Server, Moon, Sun, Palette } from 'lucide-react';
import { RankingPreference, StoreStatus } from '../types';
import { translations, SupportedLanguage } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { voiceStore } from '../voice/voiceStore';

interface Props {
  storeStatuses: StoreStatus[];
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  preference: RankingPreference;
  onPreferenceChange: (pref: RankingPreference) => void;
}

export const SettingsScreen: React.FC<Props> = ({
  storeStatuses,
  language,
  onLanguageChange,
  preference,
  onPreferenceChange
}) => {
  const t = translations[language] || translations.en;
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Theme & Appearance Selector */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Palette size={20} color="var(--primary)" />
          <span>{t.themeTitle}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {/* Dark Mode Card */}
          <button
            onClick={() => setTheme('dark')}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: theme === 'dark' ? 'rgba(99, 102, 241, 0.18)' : 'var(--bg-subtle)',
              border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: theme === 'dark' ? '0 0 15px var(--primary-glow)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                <Moon size={18} color="#818cf8" />
                <span>{t.darkMode}</span>
              </div>
              {theme === 'dark' && <CheckCircle2 size={16} color="var(--primary)" />}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Obsidian Cyber with luminous neon accents
            </div>
          </button>

          {/* Light Mode Card */}
          <button
            onClick={() => setTheme('light')}
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: theme === 'light' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-subtle)',
              border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: theme === 'light' ? '0 0 15px var(--primary-glow)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                <Sun size={18} color="#f59e0b" />
                <span>{t.lightMode}</span>
              </div>
              {theme === 'light' && <CheckCircle2 size={16} color="var(--primary)" />}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Clean Frost Glass with high-contrast clarity
            </div>
          </button>
        </div>
      </div>

      {/* 2. Live API Status Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Server size={20} color="var(--primary)" />
          <span>{t.providerStatus}</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {storeStatuses.map((status) => (
            <div
              key={status.store}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: status.isAvailable ? '#10b981' : '#f43f5e'
                    }}
                  />
                  {status.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {status.message || (status.isAvailable ? 'Live credentials active' : 'Credentials unconfigured in .env')}
                </div>
              </div>

              <div>
                {status.isAvailable ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.78rem', fontWeight: 700 }}>
                    <CheckCircle2 size={14} /> LIVE READY
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600 }}>
                    <AlertTriangle size={14} /> {status.store === 'meesho' ? 'PARTNER FEED' : 'OFFLINE'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Voice & Language Settings */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Globe size={20} color="var(--secondary)" />
          <span>{t.speechLanguage}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { code: 'auto', label: 'Auto-detect Speech', native: '✨ Auto-Detect' },
            { code: 'en', label: 'English (India)', native: 'English' },
            { code: 'hi', label: 'Hindi (भारत)', native: 'हिन्दी' },
            { code: 'kn', label: 'Kannada (ಕರ್ನಾಟಕ)', native: 'ಕನ್ನಡ' }
          ].map((item) => (
            <button
              key={item.code}
              onClick={() => onLanguageChange(item.code as any)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: language === item.code ? 'rgba(99, 102, 241, 0.25)' : 'var(--bg-subtle)',
                border: language === item.code ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: item.code === 'kn' ? "'Noto Sans Kannada', sans-serif" : 'inherit'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.native}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Default Ranking Preference */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Sliders size={20} color="var(--accent-gold)" />
          <span>{t.rankingAlgorithm}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { key: 'balanced', title: language === 'kn' ? 'ಸಮತೋಲಿತ (ಸ್ಮಾರ್ಟ್)' : language === 'hi' ? 'संतुलित (स्मार्ट)' : 'Balanced (Smart)', desc: 'Price 35%, Rating 25%, Quality 20%' },
            { key: 'cheapest', title: language === 'kn' ? 'ಕಡಿಮೆ ಬೆಲೆ' : language === 'hi' ? 'सबसे कम कीमत' : 'Lowest Price', desc: 'Price 60% priority score' },
            { key: 'best_rated', title: language === 'kn' ? 'ಉತ್ತಮ ರೇಟಿಂಗ್' : language === 'hi' ? 'उच्चतम रेटिंग' : 'Highest Rated', desc: 'Rating 45% Bayesian score' },
            { key: 'fastest', title: language === 'kn' ? 'ವೇಗದ ಡೆಲಿವರಿ' : language === 'hi' ? 'सबसे तेज़ डिलीवरी' : 'Fastest Delivery', desc: '1-2 day speed priority' }
          ].map((pref) => (
            <button
              key={pref.key}
              onClick={() => onPreferenceChange(pref.key as any)}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: preference === pref.key ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-subtle)',
                border: preference === pref.key ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{pref.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '3px' }}>{pref.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Search & Voice Command Debug Panel Toggle */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Sliders size={20} color="#818cf8" />
              <span>Search & Voice Debug Panel</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Shows real-time query translation, strict JSON spec extraction, source query counts, relevance filter drops, and ranked top 3 recommendations.
            </p>
          </div>
          <button
            onClick={() => {
              const current = voiceStore.getState().showDebugPanel;
              voiceStore.setShowDebugPanel(!current);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: voiceStore.getState().showDebugPanel ? '#10b981' : 'var(--bg-subtle)',
              border: voiceStore.getState().showDebugPanel ? '1px solid #10b981' : '1px solid var(--border-color)',
              color: voiceStore.getState().showDebugPanel ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {voiceStore.getState().showDebugPanel ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {/* 6. Affiliate Disclosure */}
      <div
        className="glass-panel"
        style={{
          padding: '18px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'rgba(16, 185, 129, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
          <ShieldCheck size={18} />
          <span>{t.affiliateDisclosureTitle}</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t.affiliateDisclosureText}
        </p>
      </div>
    </div>
  );
};
