import React from 'react';

export interface VoiceCartLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textColor?: string;
  variant?: 'app-icon' | 'mark-only' | 'horizontal';
  onClick?: () => void;
}

export const VoiceCartLogo: React.FC<VoiceCartLogoProps> = ({
  size = 40,
  className = '',
  showText = false,
  textColor = '#ffffff',
  variant = 'mark-only',
  onClick
}) => {
  const isAppIcon = variant === 'app-icon';

  return (
    <div
      className={`voicecart-logo-container ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.25,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(37, 99, 235, 0.35))' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="vcGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <linearGradient id="vcGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          <linearGradient id="vcGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Squircle container if app-icon variant */}
        {isAppIcon ? (
          <>
            <rect width="100" height="100" rx="24" fill="url(#vcGradBg)" />
            <rect
              x="1.5"
              y="1.5"
              width="97"
              height="97"
              rx="22.5"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="3"
            />
          </>
        ) : null}

        {/* Group with proper scaling/centering */}
        <g transform={isAppIcon ? 'translate(8, 6) scale(0.84)' : 'translate(0, 0)'}>
          {/* Sonic Soundwaves radiating from Cart */}
          <path
            d="M 50 18 A 20 20 0 0 1 68 32"
            stroke="url(#vcGradGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 32 32 A 20 20 0 0 1 50 18"
            stroke="url(#vcGradGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 50 10 A 30 30 0 0 1 76 30"
            stroke="url(#vcGradGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.65"
            fill="none"
          />
          <path
            d="M 24 30 A 30 30 0 0 1 50 10"
            stroke="url(#vcGradGlow)"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.65"
            fill="none"
          />

          {/* AI Microphone Capsule inside Cart */}
          <rect
            x="44"
            y="26"
            width="12"
            height="22"
            rx="6"
            fill="url(#vcGradPrimary)"
          />
          <path
            d="M 40 37 C 40 44 44 49 50 49 C 56 49 60 44 60 37"
            stroke="url(#vcGradPrimary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 50 49 L 50 54 M 45 54 L 55 54"
            stroke="url(#vcGradPrimary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Sleek Modern Shopping Cart Frame */}
          <path
            d="M 16 38 H 25 L 34 68 H 76 L 86 38 H 30"
            stroke="url(#vcGradPrimary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Cart Wheels */}
          <circle cx="38" cy="80" r="5.5" fill="url(#vcGradPrimary)" />
          <circle cx="72" cy="80" r="5.5" fill="url(#vcGradPrimary)" />
          <circle cx="38" cy="80" r="2.5" fill="#ffffff" />
          <circle cx="72" cy="80" r="2.5" fill="#ffffff" />
        </g>
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <div
            style={{
              fontSize: size * 0.44,
              fontWeight: 900,
              letterSpacing: '-0.4px',
              color: textColor
            }}
          >
            Voice<span style={{ color: '#38bdf8' }}>Cart</span>
          </div>
          <div
            style={{
              fontSize: size * 0.2,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: '#94a3b8'
            }}
          >
            AI Shopping
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCartLogo;
