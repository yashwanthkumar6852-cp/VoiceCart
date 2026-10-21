import React from 'react';
import { ArrowRight, Tag } from 'lucide-react';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  onShopNow: () => void;
  language?: SupportedLanguage;
}

export const DashboardPromoBanner: React.FC<Props> = ({ onShopNow, language = 'en' }) => {
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 50%, #10b981 100%)',
        padding: '24px 32px',
        color: '#ffffff',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Blur Circles */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '30%',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      {/* Left Text Block */}
      <div style={{ flex: '1 1 280px', zIndex: 2 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(244, 63, 94, 0.9)',
            color: '#ffffff',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.4px',
            marginBottom: '8px'
          }}
        >
          <Tag size={12} />
          <span>{t.specialOfferTitle}</span>
        </div>

        <h3
          style={{
            fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)',
            fontWeight: 800,
            margin: '0 0 6px 0',
            lineHeight: 1.25
          }}
        >
          {t.specialOfferSub}
        </h3>

        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
          Amazon India • Flipkart • Meesho Live
        </div>
      </div>

      {/* Middle/Right: Product icons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1 1 200px',
          justifyContent: 'center',
          zIndex: 2
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(6px)',
            padding: '8px 14px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>💻</span>
          <span style={{ fontSize: '1.4rem' }}>📱</span>
          <span style={{ fontSize: '1.4rem' }}>🎧</span>
          <span style={{ fontSize: '1.4rem' }}>👟</span>
        </div>
      </div>

      {/* Right CTA Button */}
      <div style={{ zIndex: 2 }}>
        <button
          type="button"
          onClick={onShopNow}
          style={{
            background: '#ffffff',
            color: '#0f766e',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span>{t.shopNow}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
