import React, { useState } from 'react';
import {
  Mic,
  Scale,
  Sparkles,
  Zap,
  ChevronRight,
  Volume2
} from 'lucide-react';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  onSearchPrompt: (query: string) => void;
  onStartVoice: () => void;
  language?: SupportedLanguage;
}

export const DashboardHeroBanner: React.FC<Props> = ({
  onSearchPrompt,
  onStartVoice,
  language = 'en'
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const heroSlides = [
    {
      pill: t.heroVoicePill,
      title: t.heroVoiceTitle,
      subtitle: t.heroVoiceSub,
      prompt: language === 'kn' ? '2000 ಒಳಗೆ boAt earbuds ತೋರಿಸು' : language === 'hi' ? '2000 के अंदर boAt ईयरबड्स दिखाओ' : 'Show me boAt earbuds under 2000',
      promptQuery: 'boAt earbuds'
    },
    {
      pill: t.crossStoreComparison,
      title: t.heroTitle,
      subtitle: t.heroSubtitle,
      prompt: language === 'kn' ? 'iPhone 15 ಬೆಲೆ ಹೋಲಿಕೆ' : language === 'hi' ? 'iPhone 15 कीमतें तुलना करो' : 'Compare iPhone 15 prices',
      promptQuery: 'iPhone 15'
    },
    {
      pill: t.heroTag,
      title: t.realTimeData,
      subtitle: t.secureRouteNotice,
      prompt: language === 'kn' ? '1500 ಒಳಗೆ ಸ್ಮಾರ್ಟ್‌ವಾಚ್' : language === 'hi' ? '1500 के अंदर स्मार्टवॉच' : 'Smartwatches under 1500',
      promptQuery: 'smartwatch'
    }
  ];

  const current = heroSlides[activeSlide];

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e3a8a 75%, #0891b2 100%)',
        color: '#ffffff',
        padding: '30px 34px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px -15px rgba(30, 27, 75, 0.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        border: '1px solid var(--hero-border, rgba(99, 102, 241, 0.35))'
      }}
    >
      {/* Decorative ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '25%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.25)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50px',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(129, 140, 248, 0.2)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Left Column: Hero Copy & Feature Pills */}
      <div style={{ flex: '1 1 360px', zIndex: 2 }}>
        {/* Category / Topic Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.4px',
            marginBottom: '14px'
          }}
        >
          <Sparkles size={14} color="#38bdf8" />
          <span>{current.pill}</span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2.1rem)',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 10px 0',
            letterSpacing: '-0.5px'
          }}
        >
          {current.title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '0.92rem',
            color: 'rgba(255, 255, 255, 0.88)',
            lineHeight: 1.5,
            margin: '0 0 20px 0',
            maxWidth: '520px'
          }}
        >
          {current.subtitle}
        </p>

        {/* Action Button & Try Prompt Pill */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onStartVoice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 22px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              color: '#1e1b4b',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Mic size={18} color="#4f46e5" />
            <span>{t.voiceSearchNow}</span>
          </button>

          <div
            onClick={() => onSearchPrompt(current.promptQuery)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '8px 14px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.95)'
            }}
            title="Click to search this query"
          >
            <Volume2 size={14} color="#38bdf8" />
            <span>{t.trySaying} &ldquo;{current.prompt}&rdquo;</span>
            <ChevronRight size={14} color="rgba(255, 255, 255, 0.7)" />
          </div>
        </div>
      </div>

      {/* Right Column: Visual Voice Floating Widget */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          zIndex: 2
        }}
      >
        <div
          onClick={onStartVoice}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 35px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.3)',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          title={t.tapToSpeak}
        >
          <Mic size={40} color="#ffffff" />
        </div>

        {/* Slide Indicators */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              style={{
                width: activeSlide === i ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                background: activeSlide === i ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
