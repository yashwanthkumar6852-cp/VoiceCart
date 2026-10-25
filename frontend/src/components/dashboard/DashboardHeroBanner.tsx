import React, { useState } from 'react';
import { Mic, ArrowRight } from 'lucide-react';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  onSearchPrompt: (query: string) => void;
  onStartVoice: () => void;
  language?: SupportedLanguage;
}

export const DashboardHeroBanner: React.FC<Props> = ({
  onSearchPrompt,
  onStartVoice
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #090e1a 0%, #0c1838 35%, #18224d 70%, #0d1527 100%)',
        color: '#ffffff',
        padding: '32px 36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 45px -15px rgba(10, 15, 30, 0.45)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        minHeight: '290px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Decorative starry / radial glow background */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '35%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.18)',
          filter: 'blur(55px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50px',
          right: '5%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'rgba(129, 140, 248, 0.2)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Left Column: Copy & Action */}
        <div style={{ flex: '1 1 340px', maxWidth: '440px' }}>
          {/* Top Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#e0e7ff',
              letterSpacing: '0.3px',
              marginBottom: '16px'
            }}
          >
            <span>Smart Shopping with Voice</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 14px 0',
              letterSpacing: '-0.5px'
            }}
          >
            Your Voice,<br />
            <span style={{ color: '#38bdf8' }}>Our Search</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.5,
              margin: '0 0 22px 0'
            }}
          >
            Compare products across Amazon, Flipkart &amp; Meesho and get the <strong style={{ color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '3px' }}>best deals</strong> — all by voice!
          </p>

          {/* Start Shopping Button */}
          <button
            type="button"
            onClick={onStartVoice}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 24px',
              borderRadius: '24px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Mic size={17} color="#ffffff" />
            <span>Start Shopping</span>
          </button>
        </div>

        {/* Right Column: Floating Store Tags, Annotations, and Product Collage */}
        <div
          style={{
            flex: '1 1 380px',
            position: 'relative',
            minHeight: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Floating Store Pills */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '10%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 4
            }}
          >
            <div
              style={{
                background: '#ffffff',
                color: '#111827',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ color: '#ff9900' }}>amazon</span>
            </div>
            <div
              style={{
                background: '#ffffff',
                color: '#2874f0',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
              }}
            >
              Flipkart <span style={{ color: '#eab308' }}>★</span>
            </div>
            <div
              style={{
                background: '#ffffff',
                color: '#f43397',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
              }}
            >
              meesho
            </div>
          </div>

          {/* Hand-drawn style note with curved arrow on the top right */}
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '2px',
              fontSize: '0.72rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: "'Caveat', cursive, sans-serif",
              lineHeight: 1.25,
              textAlign: 'right',
              zIndex: 4
            }}
          >
            <div>Best price</div>
            <div>Best quality</div>
            <div>All in one place</div>
            <svg width="34" height="26" viewBox="0 0 34 26" style={{ marginTop: '2px', display: 'inline-block' }}>
              <path
                d="M24,2 Q10,12 8,22 M8,22 L14,18 M8,22 L5,15"
                stroke="#ffffff"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Realistic Product Showcase Collage */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '6px',
              paddingTop: '28px',
              width: '100%'
            }}
          >
            {/* 1. iPhone 15 */}
            <img
              src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80"
              alt="iPhone 15"
              style={{
                width: '74px',
                height: '115px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transform: 'rotate(-4deg)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />

            {/* 2. Open Laptop */}
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80"
              alt="Laptop"
              style={{
                width: '150px',
                height: '115px',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.25)',
                zIndex: 3
              }}
            />

            {/* 3. Sony Headphones */}
            <img
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80"
              alt="Headphones"
              style={{
                width: '78px',
                height: '105px',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transform: 'rotate(5deg)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />

            {/* 4. Smartwatch */}
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&auto=format&fit=crop&q=80"
              alt="Smartwatch"
              style={{
                width: '58px',
                height: '85px',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                transform: 'rotate(8deg)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Slide Indicator Dots at Bottom */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '16px',
          position: 'relative',
          zIndex: 2
        }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            onClick={() => setActiveSlide(idx)}
            style={{
              width: activeSlide === idx ? '22px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: activeSlide === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};
