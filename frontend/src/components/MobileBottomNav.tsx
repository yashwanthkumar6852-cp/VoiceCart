import React from 'react';
import { Home, Compass, ShoppingBag, User, Mic, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations';
import { TabType } from './Navbar';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNavigateRoute: (route: string) => void;
  cartCount: number;
  onStartVoice: () => void;
  isMicListening?: boolean;
  language: SupportedLanguage;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  cartCount,
  onStartVoice,
  isMicListening = false,
  language
}) => {
  const labels = {
    en: { home: 'Home', deals: 'Deals', voice: 'Voice', cart: 'Cart', account: 'Account' },
    hi: { home: 'होम', deals: 'ऑफ़र', voice: 'बोलें', cart: 'कार्ट', account: 'खाता' },
    kn: { home: 'ಮುಖಪುಟ', deals: 'ಆಫರ್‌ಗಳು', voice: 'ಮಾತನಾಡಿ', cart: 'ಕಾರ್ಟ್', account: 'ಖಾತೆ' }
  }[language === 'hi' || language === 'kn' ? language : 'en'];

  return (
    <nav
      className="mobile-bottom-nav-bar"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        background: 'var(--nav-bg, #0a1226)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.35)',
        display: 'none', // Controlled by CSS media queries
        padding: '6px 12px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: '520px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {/* 1. Home Tab */}
        <button
          type="button"
          onClick={() => {
            onNavigateRoute('/');
            onTabChange('home');
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'home' ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: '56px',
            transition: 'all 0.15s ease'
          }}
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'home' ? 700 : 500 }}>
            {labels.home}
          </span>
        </button>

        {/* 2. Deals / Explore Tab */}
        <button
          type="button"
          onClick={() => {
            onNavigateRoute('/deals');
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: window.location.pathname.startsWith('/deals') ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: '56px',
            transition: 'all 0.15s ease'
          }}
        >
          <Compass size={20} strokeWidth={window.location.pathname.startsWith('/deals') ? 2.5 : 2} />
          <span style={{ fontSize: '0.68rem', fontWeight: window.location.pathname.startsWith('/deals') ? 700 : 500 }}>
            {labels.deals}
          </span>
        </button>

        {/* 3. Center Elevated Voice Assistant Mic Button */}
        <div style={{ position: 'relative', top: '-14px', zIndex: 1200 }}>
          <button
            type="button"
            onClick={onStartVoice}
            title="Tap to speak"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: isMicListening
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: isMicListening ? '3px solid #fecaca' : '3px solid #ffffff',
              boxShadow: isMicListening
                ? '0 0 24px rgba(239, 68, 68, 0.75), 0 4px 14px rgba(0,0,0,0.4)'
                : '0 0 20px rgba(59, 130, 246, 0.55), 0 4px 14px rgba(0,0,0,0.4)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <Mic size={24} className={isMicListening ? 'mic-active-pulse' : ''} />
          </button>
          <span
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: isMicListening ? '#ef4444' : 'var(--primary, #60a5fa)',
              marginTop: '2px'
            }}
          >
            {labels.voice}
          </span>
        </div>

        {/* 4. Cart Tab with Badge */}
        <button
          type="button"
          onClick={() => {
            onTabChange('cart');
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: activeTab === 'cart' ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: '56px',
            position: 'relative',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={20} strokeWidth={activeTab === 'cart' ? 2.5 : 2} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.5)'
                }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: activeTab === 'cart' ? 700 : 500 }}>
            {labels.cart}
          </span>
        </button>

        {/* 5. Account / Orders Tab */}
        <button
          type="button"
          onClick={() => {
            onNavigateRoute('/account');
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            background: 'transparent',
            border: 'none',
            color: window.location.pathname.startsWith('/account') || activeTab === 'orders' ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
            cursor: 'pointer',
            padding: '4px 8px',
            minWidth: '56px',
            transition: 'all 0.15s ease'
          }}
        >
          <User size={20} strokeWidth={window.location.pathname.startsWith('/account') || activeTab === 'orders' ? 2.5 : 2} />
          <span style={{ fontSize: '0.68rem', fontWeight: window.location.pathname.startsWith('/account') || activeTab === 'orders' ? 700 : 500 }}>
            {labels.account}
          </span>
        </button>
      </div>
    </nav>
  );
};
