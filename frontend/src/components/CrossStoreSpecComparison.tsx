import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  Share2,
  RefreshCw,
  Award,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Product, StoreName } from '../types';
import { api } from '../services/api';
import { formatIndianPrice } from '../utils/productNormalizer';
import { ProductImage } from './ProductImage';

interface StoreSpecMatch {
  match: 'EXACT' | 'CLOSEST' | 'NOT_FOUND' | 'UNAVAILABLE';
  confidence: number;
  product: Product | null;
  candidates: Product[];
  errorMessage?: string;
}

interface NormalizedSpecRow {
  group: string;
  key: string;
  label: string;
  unit?: string;
  values: {
    amazon?: string;
    flipkart?: string;
    meesho?: string;
  };
  bestStore: StoreName | null;
  differs: boolean;
}

interface SpecComparisonResult {
  query: string;
  productKey: string;
  referenceProduct?: Product | null;
  stores: {
    amazon: StoreSpecMatch;
    flipkart: StoreSpecMatch;
    meesho: StoreSpecMatch;
  };
  normalizedSpecs: NormalizedSpecRow[];
  winners: {
    price?: { store: StoreName; value: number; label: string };
    rating?: { store: StoreName; value: number; label: string };
    delivery?: { store: StoreName; value: number; label: string };
    specsCount?: { store: StoreName; value: number; label: string };
  };
  summary: string[];
  sources: {
    amazon: string;
    flipkart: string;
    meesho: string;
  };
  fetchedAt: string;
}

interface CrossStoreSpecComparisonProps {
  productKey?: string;
  store?: StoreName;
  productId?: string;
  sessionId?: string;
  query?: string;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onNavigateRoute?: (route: string) => void;
  showToast?: (msg: string) => void;
}

export const CrossStoreSpecComparison: React.FC<CrossStoreSpecComparisonProps> = ({
  productKey,
  store,
  productId,
  sessionId,
  query,
  onAddToCart,
  onNavigateRoute,
  showToast
}) => {
  const [data, setData] = useState<SpecComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [hideMissing, setHideMissing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedCandidates, setSelectedCandidates] = useState<Partial<Record<StoreName, string>>>({});
  const [mobileActiveTab, setMobileActiveTab] = useState<'all' | 'amazon' | 'flipkart' | 'meesho'>('all');

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanQuery = (query || '').replace(/^\++|\++$/g, '').trim();
      const res = await api.getSpecComparison({
        productKey: productKey || cleanQuery,
        store,
        productId,
        sessionId,
        query: cleanQuery || productKey,
        overrideProductIds: selectedCandidates
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load specification comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [productKey, store, productId, sessionId, query, JSON.stringify(selectedCandidates)]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    if (!data) return;
    const allG: Record<string, boolean> = {};
    for (const row of data.normalizedSpecs) {
      allG[row.group] = true;
    }
    setCollapsedGroups(allG);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Compare Specs: ${data?.query || 'Product'} on VoiceCart`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      if (showToast) showToast('Comparison link copied to clipboard!');
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!data?.normalizedSpecs) return [];

    return data.normalizedSpecs.filter((row) => {
      if (onlyDifferences && !row.differs) return false;

      if (hideMissing) {
        const hasAll = row.values.amazon && row.values.flipkart && row.values.meesho;
        if (!hasAll) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inLabel = row.label.toLowerCase().includes(q);
        const inGroup = row.group.toLowerCase().includes(q);
        const inValues = Object.values(row.values).some((v) => v?.toLowerCase().includes(q));
        if (!inLabel && !inGroup && !inValues) return false;
      }

      return true;
    });
  }, [data, onlyDifferences, hideMissing, searchTerm]);

  // Group filtered rows
  const groupedRows = useMemo(() => {
    const map: Record<string, NormalizedSpecRow[]> = {};
    for (const row of filteredRows) {
      if (!map[row.group]) map[row.group] = [];
      map[row.group].push(row);
    }
    return map;
  }, [filteredRows]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <RefreshCw size={36} color="var(--primary, #2874f0)" className="mic-active-pulse" style={{ margin: '0 auto 16px' }} />
        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
          Comparing Specifications Across Stores...
        </h4>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Aligning real verified specifications from Amazon India, Flipkart & Meesho
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 12px' }} />
        <h4 style={{ color: '#ef4444', fontWeight: 700 }}>Comparison Unavailable</h4>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</p>
        <button
          type="button"
          onClick={fetchComparison}
          style={{
            padding: '8px 18px',
            background: 'var(--primary, #2874f0)',
            border: 'none',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Retry Comparison
        </button>
      </div>
    );
  }

  const storesList: ('amazon' | 'flipkart' | 'meesho')[] = ['amazon', 'flipkart', 'meesho'];

  return (
    <div
      className="spec-comparison-container"
      style={{
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        border: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
        padding: '24px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* 1. Header Title & Subtitle */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={20} color="var(--primary, #2874f0)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
              Comparing: {data.referenceProduct?.title || data.query || 'Product'}
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Side-by-side spec alignment, live pricing and stock verified across Amazon India, Flipkart & Meesho.
          </p>
        </div>

        {/* Action Buttons: PDF, Share, Refresh */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDownloadPdf}
            title="Download PDF"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-pill, #f8fafc)',
              color: 'var(--text-main, #334155)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> PDF
          </button>
          <button
            type="button"
            onClick={handleShare}
            title="Share Link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-pill, #f8fafc)',
              color: 'var(--text-main, #334155)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Share2 size={14} /> Share
          </button>
          <button
            type="button"
            onClick={fetchComparison}
            title="Refresh Data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: 'var(--bg-pill, #f8fafc)',
              color: 'var(--text-main, #334155)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Reference Product Summary Banner */}
      {data.referenceProduct && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <ProductImage
              src={data.referenceProduct.imageUrl}
              images={data.referenceProduct.images}
              thumbnail={(data.referenceProduct as any).thumbnail}
              serpapi_thumbnail={(data.referenceProduct as any).serpapi_thumbnail}
              alt={data.referenceProduct.title}
              store={data.referenceProduct.store}
              productId={data.referenceProduct.productId}
              variantText={data.referenceProduct.variantText}
              isPriority={true}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Reference Product</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {data.referenceProduct.title}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green, #10b981)' }}>
              {formatIndianPrice(data.referenceProduct.price)}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
              on {data.referenceProduct.store}
            </div>
          </div>
        </div>
      )}

      {/* 3. Summary Highlights Card */}
      {data.summary && data.summary.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(40, 116, 240, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Award size={18} color="#4f46e5" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#312e81' }}>
              Comparison Highlights & Winners
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#3730a3' }}>
            {data.summary.map((line, idx) => (
              <li key={idx}>
                <strong>{line}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Toolbar: Differences toggle, Missing toggle, Spec search, Expand/Collapse */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--bg-subtle, #f8fafc)',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          {/* Show only differences */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #334155)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={onlyDifferences}
              onChange={(e) => setOnlyDifferences(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: 'var(--primary, #2874f0)' }}
            />
            <span>Show only differences</span>
          </label>

          {/* Hide missing rows */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main, #334155)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideMissing}
              onChange={(e) => setHideMissing(e.target.checked)}
              style={{ width: '15px', height: '15px', accentColor: 'var(--primary, #2874f0)' }}
            />
            <span>Hide missing rows</span>
          </label>

          {/* Expand / Collapse All */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={expandAll}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Expand all
            </button>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <button
              type="button"
              onClick={collapseAll}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* Spec Search Box */}
        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            placeholder="Search specs (RAM, 50MP...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              background: '#fff',
              outline: 'none'
            }}
          />
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '9px' }} />
        </div>
      </div>

      {/* 4. Comparison Table (Responsive with Sticky Columns) */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table
          style={{
            width: '100%',
            minWidth: '780px',
            borderCollapse: 'collapse',
            fontSize: '0.85rem'
          }}
        >
          {/* Table Header: 3 Store Columns */}
          <thead>
            <tr>
              <th
                style={{
                  width: '25%',
                  textAlign: 'left',
                  padding: '16px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  borderBottom: '2px solid var(--border-color, #cbd5e1)',
                  fontWeight: 700,
                  color: 'var(--text-muted, #64748b)'
                }}
              >
                Attributes & Specs
              </th>

              {storesList.map((st) => {
                const match = data.stores[st];
                const prod = match.product;
                const isWinnerPrice = data.winners.price?.store === st;
                const isWinnerRating = data.winners.rating?.store === st;
                const isWinnerDelivery = data.winners.delivery?.store === st;

                return (
                  <th
                    key={st}
                    style={{
                      width: '25%',
                      textAlign: 'left',
                      padding: '16px',
                      background: 'var(--bg-subtle, #f8fafc)',
                      borderBottom: '2px solid var(--border-color, #cbd5e1)',
                      verticalAlign: 'top'
                    }}
                  >
                    {/* Store Title & Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: st === 'amazon' ? 'rgba(255, 153, 0, 0.15)' : st === 'flipkart' ? 'rgba(40, 116, 240, 0.15)' : 'rgba(244, 51, 151, 0.15)',
                          color: st === 'amazon' ? '#c2410c' : st === 'flipkart' ? '#1d4ed8' : '#be185d',
                          border: `1px solid ${st === 'amazon' ? '#fb923c' : st === 'flipkart' ? '#60a5fa' : '#f472b6'}`
                        }}
                      >
                        {st.toUpperCase()}
                      </span>

                      {/* Confidence pill */}
                      {match.match === 'EXACT' ? (
                        <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                          Exact match ✓
                        </span>
                      ) : match.match === 'CLOSEST' ? (
                        <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>
                          Closest match ({match.confidence}%)
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>
                          Exact product unavailable
                        </span>
                      )}
                    </div>

                    {prod ? (
                      <div>
                        {/* Thumbnail & Title */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ width: '54px', height: '54px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <ProductImage
                              src={prod.imageUrl}
                              images={prod.images}
                              thumbnail={(prod as any).thumbnail}
                              serpapi_thumbnail={(prod as any).serpapi_thumbnail}
                              alt={prod.title}
                              store={prod.store}
                              productId={prod.productId}
                              variantText={prod.variantText}
                              isPriority={true}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                          <a
                            href={`/product/${prod.store}/${prod.productId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onNavigateRoute) onNavigateRoute(`/product/${prod.store}/${prod.productId}`);
                            }}
                            style={{
                              color: 'var(--link-color, #1d4ed8)',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              lineHeight: 1.3,
                              textDecoration: 'none',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {prod.title}
                          </a>
                        </div>

                        {/* Price & MRP */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                            {formatIndianPrice(prod.price)}
                          </span>
                          {prod.mrp > prod.price && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                              {formatIndianPrice(prod.mrp)}
                            </span>
                          )}
                          {prod.discountPct > 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                              {prod.discountPct}% off
                            </span>
                          )}
                        </div>

                        {/* Winner Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {isWinnerPrice && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>
                              🏆 Lowest Price
                            </span>
                          )}
                          {isWinnerRating && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309' }}>
                              ⭐ Best Rated
                            </span>
                          )}
                          {isWinnerDelivery && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#e0e7ff', color: '#4338ca' }}>
                              ⚡ Fastest Delivery
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onAddToCart && onAddToCart(prod, 1)}
                            style={{
                              flex: 1,
                              padding: '5px 8px',
                              background: 'var(--primary, #2874f0)',
                              border: 'none',
                              borderRadius: '5px',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <ShoppingCart size={12} /> Add
                          </button>
                          <a
                            href={prod.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 8px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              color: '#334155',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <ExternalLink size={12} /> Store
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '24px 8px', textAlign: 'center', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>
                          Exact product unavailable
                        </p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          on {st.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Collapsible Spec Groups */}
          <tbody>
            {Object.entries(groupedRows).map(([groupName, rows]) => {
              const isCollapsed = Boolean(collapsedGroups[groupName]);

              return (
                <React.Fragment key={groupName}>
                  {/* Group Header Row */}
                  <tr
                    onClick={() => toggleGroup(groupName)}
                    style={{
                      background: 'var(--bg-subtle, #f1f5f9)',
                      cursor: 'pointer',
                      borderTop: '2px solid var(--border-color, #e2e8f0)',
                      borderBottom: '1px solid var(--border-color, #e2e8f0)'
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: '10px 16px',
                        fontWeight: 700,
                        color: 'var(--text-main, #1e293b)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{groupName}</span>
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </td>
                  </tr>

                  {/* Spec Rows */}
                  {!isCollapsed &&
                    rows.map((row) => (
                      <tr
                        key={row.key}
                        style={{
                          borderBottom: '1px solid var(--border-color, #f1f5f9)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Spec Name / Label */}
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: 600,
                            color: 'var(--text-muted, #475569)',
                            background: 'var(--bg-subtle, #fafafa)',
                            borderRight: '1px solid var(--border-color, #f1f5f9)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{row.label}</span>
                            {row.differs && (
                              <span
                                title="Stores list different values for this attribute"
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  background: '#f59e0b',
                                  display: 'inline-block'
                                }}
                              />
                            )}
                          </div>
                        </td>

                        {/* Store Values */}
                        {storesList.map((st) => {
                          const val = row.values[st];
                          const isBest = row.bestStore === st;

                          return (
                            <td
                              key={st}
                              style={{
                                padding: '12px 16px',
                                color: val ? 'var(--text-main, #1e293b)' : '#94a3b8',
                                fontStyle: val ? 'normal' : 'italic',
                                background: isBest
                                  ? 'rgba(22, 163, 74, 0.08)'
                                  : 'transparent',
                                borderRight: '1px solid var(--border-color, #f1f5f9)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{val || `Not provided by ${st}`}</span>
                                {isBest && (
                                  <span
                                    title="Best verified value"
                                    style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      color: '#16a34a',
                                      background: '#dcfce7',
                                      padding: '1px 5px',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    Best
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Footer Store Data Attribution & Disclaimer */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <span><strong>Amazon:</strong> {data.sources.amazon}</span>
          <span><strong>Flipkart:</strong> {data.sources.flipkart}</span>
          <span><strong>Meesho:</strong> {data.sources.meesho}</span>
        </div>
        <p style={{ margin: 0, fontStyle: 'italic' }}>
          * Note: Specifications are collected from public store data and may differ from the store's own page. Please verify before buying.
        </p>
      </div>
    </div>
  );
};
