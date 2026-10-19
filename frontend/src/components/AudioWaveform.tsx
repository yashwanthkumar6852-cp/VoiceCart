import React from 'react';

interface Props {
  isActive: boolean;
  color?: string;
}

export const AudioWaveform: React.FC<Props> = ({ isActive, color = '#6366f1' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}>
      {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9, 0.3].map((delay, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            width: '3.5px',
            backgroundColor: color,
            borderRadius: '4px',
            height: isActive ? '24px' : '4px',
            transition: 'height 0.2s ease',
            animation: isActive ? `wave-bar 1.2s infinite ease-in-out ${delay}s` : 'none',
            boxShadow: isActive ? `0 0 8px ${color}` : 'none'
          }}
        />
      ))}
    </div>
  );
};
