import React from 'react';
import { ChevronRight } from 'lucide-react';
import { CrossStoreSpecComparison } from '../components/CrossStoreSpecComparison';
import { Product } from '../types';

interface CrossStoreComparisonPageProps {
  productKey?: string;
  onNavigateRoute: (route: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  language?: string;
  showToast?: (msg: string) => void;
}

export const CrossStoreComparisonPage: React.FC<CrossStoreComparisonPageProps> = ({
  productKey,
  onNavigateRoute,
  onAddToCart,
  language = 'en',
  showToast
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        padding: '24px 16px 80px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Top Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          fontSize: '0.82rem',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer', fontWeight: 500 }}
          >
            Home
          </button>
          <ChevronRight size={14} color="#94a3b8" />
          <span>Compare Specifications</span>
          {productKey && (
            <>
              <ChevronRight size={14} color="#94a3b8" />
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{productKey.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.78rem',
            color: '#475569',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          ← Back
        </button>
      </div>

      <CrossStoreSpecComparison
        productKey={productKey}
        onAddToCart={onAddToCart}
        onNavigateRoute={onNavigateRoute}
        showToast={showToast}
      />
    </div>
  );
};
