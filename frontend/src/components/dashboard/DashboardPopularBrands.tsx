import React from 'react';
import { Crown, ArrowRight } from 'lucide-react';

interface Props {
  onSelectBrand?: (brand: string) => void;
  onViewAll?: () => void;
}

export const DashboardPopularBrands: React.FC<Props> = ({
  onSelectBrand,
  onViewAll
}) => {
  const brands = [
    {
      id: 'amazon',
      name: 'amazon',
      render: (
        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ff9900', letterSpacing: '-0.3px' }}>
          amazon
        </span>
      )
    },
    {
      id: 'flipkart',
      name: 'Flipkart',
      render: (
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2874f0' }}>
          Flipkart <span style={{ color: '#eab308' }}>★</span>
        </span>
      )
    },
    {
      id: 'meesho',
      name: 'meesho',
      render: (
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f43397' }}>
          meesho
        </span>
      )
    },
    {
      id: 'samsung',
      name: 'SAMSUNG',
      render: (
        <span style={{ fontWeight: 900, fontSize: '0.92rem', color: '#1428a0', letterSpacing: '0.5px' }}>
          SAMSUNG
        </span>
      )
    },
    {
      id: 'mi',
      name: 'mi',
      render: (
        <div
          style={{
            background: '#ff6700',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.82rem',
            padding: '2px 7px',
            borderRadius: '6px',
            lineHeight: 1.1
          }}
        >
          mi
        </div>
      )
    },
    {
      id: 'boat',
      name: 'boAt',
      render: (
        <span style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--text-main)' }}>
          bo<span style={{ color: '#dc2626' }}>A</span>t
        </span>
      )
    },
    {
      id: 'nike',
      name: 'Nike',
      render: (
        <svg width="34" height="14" viewBox="0 0 34 14" fill="currentColor">
          <path d="M0.5,10.2 C5.5,12.5 12,13.8 17.5,10.2 C24.5,5.6 33,0 33,0 C33,0 23.5,8.2 16.5,12.2 C11.5,15.1 4.5,13.8 0.5,10.2 Z" />
        </svg>
      )
    },
    {
      id: 'asus',
      name: 'ASUS',
      render: (
        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#00539b', letterSpacing: '1px' }}>
          ASUS
        </span>
      )
    }
  ];

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crown size={18} color="#f59e0b" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Popular Brands
          </h2>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px'
          }}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 8 Brand Cards Grid */}
      <div
        className="popular-brands-strip-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gap: '12px',
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}
      >
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => {
              if (onSelectBrand) onSelectBrand(brand.name);
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              minHeight: '48px',
              minWidth: '85px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              e.currentTarget.style.borderColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {brand.render}
          </button>
        ))}
      </div>
    </div>
  );
};
