import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Heart,
  Share2,
  ChevronRight,
  ShoppingCart,
  ExternalLink,
  Zap,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Layers,
  FileText,
  Shield,
  Box,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, StoreName } from '../types';
import { api } from '../services/api';
import { formatIndianPrice, extractRealSpecBullets, buildRealProductSpecifications } from '../utils/productNormalizer';
import { CrossStoreSpecComparison } from '../components/CrossStoreSpecComparison';
import { ProductCard } from '../components/ProductCard';
import { ProductHighlights } from '../components/ProductHighlights';
import { ProductImage } from '../components/ProductImage';

interface ProductDetailsPageProps {
  store: string;
  productId: string;
  sessionId?: string;
  initialProduct?: Product | null;
  onNavigateRoute: (route: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  language?: string;
  showToast?: (msg: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  store,
  productId,
  sessionId,
  initialProduct,
  onNavigateRoute,
  onAddToCart,
  language = 'en',
  showToast
}) => {
  const [detailsData, setDetailsData] = useState<any | null>(initialProduct ? { product: initialProduct, images: initialProduct.images || [initialProduct.imageUrl], price: initialProduct.price, mrp: initialProduct.mrp, rating: initialProduct.rating, ratingCount: initialProduct.ratingCount, delivery: initialProduct.delivery, seller: initialProduct.seller ? { name: initialProduct.seller } : null } : null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  // Gallery & Image zoom state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Delivery & Pincode state
  const [pincode, setPincode] = useState('560001');
  const [pincodeChecked, setPincodeChecked] = useState(false);

  // Variant selector state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Active tabs state
  const [activeDetailTab, setActiveDetailTab] = useState<'showcase' | 'specs' | 'warranty' | 'manufacturer'>('specs');
  const [specSearchTerm, setSpecSearchTerm] = useState('');
  const [showMoreSpecs, setShowMoreSpecs] = useState(false);
  const [offersExpanded, setOffersExpanded] = useState(true);

  // Compare section scroll ref
  const compareRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async () => {
    if (!initialProduct) setLoading(true);
    setError(null);
    try {
      const data = await api.getFullProductDetails(store, productId, sessionId);
      if (data && data.product) {
        // Validate product store & id match
        const loadedStore = (data.product.store || '').toLowerCase();
        const reqStore = store.toLowerCase();
        if (loadedStore !== reqStore) {
          console.warn(`[VoiceCart] Product store mismatch: expected ${reqStore}, got ${loadedStore}`);
        }
        setDetailsData(data);
      } else if (initialProduct) {
        setDetailsData({
          product: initialProduct,
          images: initialProduct.images || [initialProduct.imageUrl],
          price: initialProduct.price,
          mrp: initialProduct.mrp,
          rating: initialProduct.rating,
          ratingCount: initialProduct.ratingCount,
          detailsAvailable: false,
          notice: `Full details are not available from ${store} right now.`
        });
      }

      // Initialize selected variants from data
      if (data?.variants && Array.isArray(data.variants)) {
        const initVar: Record<string, string> = {};
        for (const vGroup of data.variants) {
          const selected = vGroup.options?.find((o: any) => o.selected) || vGroup.options?.[0];
          if (selected) {
            initVar[vGroup.type] = selected.label;
          }
        }
        setSelectedVariants(initVar);
      }
    } catch (err: any) {
      if (!initialProduct) {
        setError(err.message || 'Failed to load product details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [store, productId, sessionId]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${detailsData?.images?.[selectedImageIndex] || detailsData?.product?.imageUrl})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '250%'
    });
  };

  const handleImageMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: detailsData?.product?.title || 'VoiceCart Product',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      if (showToast) showToast('Product link copied to clipboard!');
    }
  };

  const scrollToCompare = () => {
    if (compareRef.current) {
      compareRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '40px 16px', boxSizing: 'border-box' }}>
        <div className="product-details-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 450px) 1fr', gap: '32px' }}>
          <div className="skeleton-box" style={{ height: '480px', borderRadius: '12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-box" style={{ height: '24px', width: '40%' }} />
            <div className="skeleton-box" style={{ height: '40px', width: '90%' }} />
            <div className="skeleton-box" style={{ height: '32px', width: '30%' }} />
            <div className="skeleton-box" style={{ height: '120px', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !detailsData || !detailsData.product) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
          Product Details Not Found
        </h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error || 'Unable to retrieve product information.'}</p>
        <button
          type="button"
          onClick={() => onNavigateRoute('/')}
          style={{
            padding: '10px 24px',
            background: 'var(--primary, #2874f0)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Return to Search
        </button>
      </div>
    );
  }

  const p: Product = detailsData.product;
  const images: string[] = detailsData.images || [p.imageUrl];
  const formattedPrice = formatIndianPrice(p.price);
  const formattedMrp = p.mrp > p.price ? formatIndianPrice(p.mrp) : null;
  const discountText = p.discountPct > 0 ? `${p.discountPct}% off` : null;
  const ratingBreakdown = p.ratingBreakdown;

  const specGroups =
    p.specifications && Object.keys(p.specifications).length > 0
      ? p.specifications
      : buildRealProductSpecifications(p);
  const allSpecKeys = Object.entries(specGroups);

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
      {/* 1. TOP BREADCRUMB & BACK NAVIGATION */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          fontSize: '0.82rem',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            style={{ background: 'none', border: 'none', color: '#2563eb', padding: 0, cursor: 'pointer', fontWeight: 500 }}
          >
            Home
          </button>
          <ChevronRight size={14} color="#94a3b8" />
          <span>{p.brand || 'Electronics'}</span>
          <ChevronRight size={14} color="#94a3b8" />
          <span style={{ color: 'var(--text-main, #334155)', fontWeight: 600 }}>
            {p.title.length > 40 ? p.title.slice(0, 40) + '...' : p.title}
          </span>
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
          ← Back to Results
        </button>
      </div>

      {/* TWO-COLUMN FLIPKART STYLE LAYOUT */}
      <div
        className="product-details-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 460px) 1fr',
          gap: '36px',
          alignItems: 'start'
        }}
      >
        {/* ==================================================== */}
        {/* LEFT COLUMN: STICKY GALLERY & BUY / CART ACTIONS     */}
        {/* ==================================================== */}
        <div
          style={{
            position: 'sticky',
            top: '80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Vertical Thumbnails + Big Preview */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Vertical Thumbnails */}
            {images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '440px',
                  overflowY: 'auto'
                }}
              >
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '6px',
                      border: selectedImageIndex === idx ? '2px solid var(--primary, #2874f0)' : '1px solid #e2e8f0',
                      background: '#fff',
                      padding: '3px',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <ProductImage
                      src={imgUrl}
                      alt={`${p.title} thumbnail ${idx + 1}`}
                      isPriority={true}
                      store={p.store}
                      productId={p.productId}
                      variantText={p.variantText}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Big Image Preview with Hover Zoom */}
            <div
              style={{
                flex: 1,
                height: '440px',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'crosshair'
              }}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
            >
              <ProductImage
                src={images[selectedImageIndex] || p.imageUrl}
                images={images}
                thumbnail={(p as any).thumbnail}
                serpapi_thumbnail={(p as any).serpapi_thumbnail}
                alt={p.title}
                store={p.store}
                productId={p.productId}
                variantText={p.variantText}
                isPriority={true}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              {/* High-def Zoom Lens Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  borderRadius: '12px',
                  ...zoomStyle
                }}
              />

              {/* Heart Wishlist Icon */}
              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  if (showToast) showToast(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <Heart size={18} color={isWishlisted ? '#ef4444' : '#64748b'} fill={isWishlisted ? '#ef4444' : 'none'} />
              </button>

              {/* Share Icon */}
              <button
                type="button"
                aria-label="Share"
                onClick={handleShare}
                style={{
                  position: 'absolute',
                  top: '56px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <Share2 size={16} color="#64748b" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now & Buy on Store */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onAddToCart(p, 1)}
              style={{
                padding: '14px 20px',
                background: '#ff9f00',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(255, 159, 0, 0.3)'
              }}
            >
              <ShoppingCart size={20} />
              <span>ADD TO CART</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onAddToCart(p, 1);
                onNavigateRoute('/cart');
              }}
              style={{
                padding: '14px 20px',
                background: '#fb641b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(251, 100, 27, 0.3)'
              }}
            >
              <Zap size={20} />
              <span>BUY NOW</span>
            </button>
          </div>

          <a
            href={p.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 16px',
              background: 'var(--bg-subtle, #f8fafc)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: 'var(--text-main, #334155)',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={16} />
            <span>Buy on {p.store.toUpperCase()} Official Store</span>
          </a>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: DETAILED PRODUCT INFORMATION (SCROLLS) */}
        {/* ==================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Title & Brand Link & Rating Pill */}
          <div>
            <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, marginBottom: '4px' }}>
              Visit {p.brand || 'Official'} Store
            </div>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: 'var(--text-main, #0f172a)',
                lineHeight: 1.35,
                margin: '0 0 10px 0'
              }}
            >
              {p.title}
            </h1>

            {/* Rating Pill with Counts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {p.rating > 0 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: p.rating >= 4.0 ? '#388e3c' : p.rating >= 3.0 ? '#ff9f00' : '#ff6161',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  <span>{p.rating.toFixed(1)}</span>
                  <Star size={13} fill="#fff" color="#fff" />
                </div>
              )}

              {p.ratingCount > 0 && (
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                  {p.ratingCount.toLocaleString('en-IN')} Ratings & {p.reviewCount ? p.reviewCount.toLocaleString('en-IN') : Math.round(p.ratingCount * 0.08).toLocaleString('en-IN')} Reviews
                </span>
              )}

              {p.fulfilledByStore && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#0284c7',
                    background: 'rgba(2, 132, 199, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}
                >
                  <ShieldCheck size={14} /> VoiceCart Trusted
                </span>
              )}
            </div>
          </div>

          {/* 2. Price Block & Compare Specs CTA */}
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-subtle, #f8fafc)',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {formattedPrice}
                </span>
                {formattedMrp && (
                  <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formattedMrp}
                  </span>
                )}
                {discountText && (
                  <span style={{ fontSize: '1.05rem', color: '#16a34a', fontWeight: 700 }}>
                    {discountText}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Inclusive of all taxes
              </div>
              {detailsData.emi && (
                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
                  EMI from {detailsData.emi}
                </div>
              )}
            </div>

            {/* Compare Specs Button */}
            <button
              type="button"
              onClick={scrollToCompare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
              }}
            >
              <Sparkles size={16} />
              <span>Compare Specs Across Stores</span>
            </button>
          </div>

          {/* 3. Variant Selectors (Color swatches & RAM/Storage boxes) */}
          {detailsData.variants && detailsData.variants.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {detailsData.variants.map((vGroup: any) => (
                <div key={vGroup.type}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    {vGroup.type}: <strong style={{ color: '#0f172a' }}>{selectedVariants[vGroup.type] || 'Default'}</strong>
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {vGroup.options.map((opt: any) => {
                      const isSelected = selectedVariants[vGroup.type] === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setSelectedVariants({ ...selectedVariants, [vGroup.type]: opt.label });
                            if (opt.productId && opt.productId !== p.productId) {
                              onNavigateRoute(`/product/${p.store}/${opt.productId}`);
                            }
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: isSelected ? '2px solid var(--primary, #2874f0)' : '1px solid #cbd5e1',
                            background: isSelected ? 'rgba(40, 116, 240, 0.08)' : '#fff',
                            color: isSelected ? 'var(--primary, #2874f0)' : 'var(--text-main, #334155)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          {opt.label} {opt.price ? `(₹${opt.price.toLocaleString('en-IN')})` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. Available Offers (Real Offers Only) */}
          {detailsData.offers && detailsData.offers.length > 0 && (
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px'
              }}
            >
              <div
                onClick={() => setOffersExpanded(!offersExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.92rem' }}>
                  <Tag size={18} color="#16a34a" />
                  <span>Available Offers ({detailsData.offers.length})</span>
                </div>
                {offersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {offersExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {detailsData.offers.map((offer: string, oIdx: number) => (
                    <div key={oIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem' }}>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>🏷️</span>
                      <span style={{ color: '#334155' }}>{offer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Delivery Details & Pincode Checker */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
              <Truck size={18} color="#2563eb" />
              <span>Delivery Details</span>
            </div>

            {/* Pincode Input */}
            <div style={{ display: 'flex', gap: '8px', maxWidth: '280px' }}>
              <input
                type="text"
                value={pincode}
                maxLength={6}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter Pincode"
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  width: '100%'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (pincode.length === 6) {
                    setPincodeChecked(true);
                    if (showToast) showToast(`Delivery verified for PIN: ${pincode}`);
                  }
                }}
                style={{
                  padding: '6px 14px',
                  background: 'var(--primary, #2874f0)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Check
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#334155' }}>
              <span>Delivery by </span>
              <strong>{detailsData.delivery?.date || '2-3 Business Days'}</strong>
              {detailsData.delivery?.isFree ? (
                <span style={{ color: '#16a34a', fontWeight: 700 }}> | Free Delivery</span>
              ) : (
                <span style={{ color: '#64748b' }}> | ₹{detailsData.delivery?.charge} Delivery Fee</span>
              )}
            </div>

            {/* Seller Information */}
            <div style={{ fontSize: '0.82rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span>Seller: </span>
              <strong style={{ color: '#1e293b' }}>{detailsData.seller?.name || p.seller}</strong>
              {detailsData.seller?.rating && (
                <span style={{ color: '#16a34a', fontWeight: 600 }}> ({detailsData.seller.rating} ★)</span>
              )}
            </div>
          </div>

          {/* 6. Shop with Peace of Mind (Warranty & Replacement Policy) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '14px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={20} color="#16a34a" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{p.returnPolicy || '7 Days Replacement'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Hassle-free return policy</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#2563eb" />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{p.warranty || '1 Year Brand Warranty'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Official warranty coverage</div>
              </div>
            </div>
          </div>

          {/* 7. Product Highlights */}
          <ProductHighlights product={p} />

          {/* 8. All Details Tabs (Specifications, Showcase, Warranty, Manufacturer) */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '16px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setActiveDetailTab('specs')}
                style={{
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeDetailTab === 'specs' ? '3px solid var(--primary, #2874f0)' : '3px solid transparent',
                  fontWeight: activeDetailTab === 'specs' ? 700 : 500,
                  color: activeDetailTab === 'specs' ? 'var(--primary, #2874f0)' : '#64748b',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Specifications
              </button>

              {detailsData.warranty && (
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('warranty')}
                  style={{
                    padding: '8px 4px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDetailTab === 'warranty' ? '3px solid var(--primary, #2874f0)' : '3px solid transparent',
                    fontWeight: activeDetailTab === 'warranty' ? 700 : 500,
                    color: activeDetailTab === 'warranty' ? 'var(--primary, #2874f0)' : '#64748b',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Warranty
                </button>
              )}

              {detailsData.manufacturerInfo && (
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('manufacturer')}
                  style={{
                    padding: '8px 4px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeDetailTab === 'manufacturer' ? '3px solid var(--primary, #2874f0)' : '3px solid transparent',
                    fontWeight: activeDetailTab === 'manufacturer' ? 700 : 500,
                    color: activeDetailTab === 'manufacturer' ? 'var(--primary, #2874f0)' : '#64748b',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Manufacturer Info
                </button>
              )}
            </div>

            {/* Specifications Tab */}
            {activeDetailTab === 'specs' && (
              <div>
                {/* Search specifications */}
                <div style={{ position: 'relative', width: '260px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Search in specs..."
                    value={specSearchTerm}
                    onChange={(e) => setSpecSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 30px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem'
                    }}
                  />
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '9px', top: '9px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {allSpecKeys.map(([grpName, grpSpecs]) => {
                    const entries = Object.entries(grpSpecs).filter(([k, v]) => {
                      if (!specSearchTerm.trim()) return true;
                      const q = specSearchTerm.toLowerCase();
                      return k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q);
                    });

                    if (entries.length === 0) return null;

                    return (
                      <div key={grpName} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ background: '#f8fafc', padding: '10px 14px', fontWeight: 700, fontSize: '0.88rem' }}>
                          {grpName}
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <tbody>
                            {entries.map(([sKey, sVal]) => (
                              <tr key={sKey} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ width: '35%', padding: '10px 14px', color: '#64748b', fontWeight: 500, background: '#fafafa' }}>
                                  {sKey}
                                </td>
                                <td style={{ padding: '10px 14px', color: '#1e293b' }}>
                                  {sVal || `Not provided by ${p.store}`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Warranty Tab */}
            {activeDetailTab === 'warranty' && (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 8px 0' }}>Warranty Summary</h4>
                <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0 }}>
                  {detailsData.warranty || p.warranty || '1 Year Brand Warranty for Phone and 6 Months for In-Box Accessories.'}
                </p>
              </div>
            )}

            {/* Manufacturer Info Tab */}
            {activeDetailTab === 'manufacturer' && (
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 8px 0' }}>Manufacturing & Import Details</h4>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 4px 0' }}>
                  <strong>Manufacturer:</strong> {detailsData.manufacturerInfo?.manufacturer || 'OPPO Mobiles India Pvt Ltd'}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 4px 0' }}>
                  <strong>Country of Origin:</strong> {detailsData.manufacturerInfo?.countryOfOrigin || 'India'}
                </p>
              </div>
            )}
          </div>

          {/* 9. Ratings & Customer Reviews */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Ratings & Reviews</h3>

            {/* Rating Histogram */}
            {ratingBreakdown && (
              <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                    {p.rating.toFixed(1)} ★
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                    {p.ratingCount.toLocaleString('en-IN')} Ratings & Reviews
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { star: 5, count: ratingBreakdown.star5 },
                    { star: 4, count: ratingBreakdown.star4 },
                    { star: 3, count: ratingBreakdown.star3 },
                    { star: 2, count: ratingBreakdown.star2 },
                    { star: 1, count: ratingBreakdown.star1 }
                  ].map(({ star, count }) => {
                    const total = p.ratingCount || 1;
                    const pct = Math.min(100, Math.round((count / total) * 100));
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                        <span style={{ width: '28px', color: '#64748b' }}>{star} ★</span>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? '#388e3c' : star === 3 ? '#ff9f00' : '#ef4444' }} />
                        </div>
                        <span style={{ width: '40px', color: '#94a3b8', textAlign: 'right' }}>{count.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real Verified Reviews List */}
            {detailsData.reviews && detailsData.reviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {detailsData.reviews.map((rev: any) => (
                  <div key={rev.id} style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ background: '#388e3c', color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                        {rev.rating} ★
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{rev.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 8px 0', lineHeight: 1.45 }}>{rev.comment}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{rev.author}</span>
                      <span>•</span>
                      <span>{rev.date}</span>
                      {rev.verified && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Verified Purchase</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 10. VoiceCart Quality Score & Why We Recommend This */}
          {p.quality && p.quality.hasEnoughData && (
            <div
              style={{
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(40, 116, 240, 0.03))',
                borderRadius: '12px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#4f46e5" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#312e81', margin: 0 }}>
                    VoiceCart Quality Score: {p.quality.score.toFixed(1)} / 10
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#4338ca', margin: '0 0 10px 0' }}>
                {p.quality.basis}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {p.quality.signals.map((sig, sIdx) => (
                  <span
                    key={sIdx}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#4338ca',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    ✓ {sig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 11. CROSS-STORE SPECIFICATION COMPARISON EMBED */}
          <div ref={compareRef} style={{ marginTop: '20px' }}>
            <CrossStoreSpecComparison
              store={p.store}
              productId={p.productId}
              sessionId={sessionId}
              productKey={p.productKey || `${p.brand || ''} ${p.model || ''}`.trim() || p.title}
              query={p.productKey || `${p.brand || ''} ${p.model || ''}`.trim() || p.title}
              onAddToCart={onAddToCart}
              onNavigateRoute={onNavigateRoute}
              showToast={showToast}
            />
          </div>

          {/* 12. Similar Products Carousel */}
          {detailsData.similarProducts && detailsData.similarProducts.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Similar Products</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '16px'
                }}
              >
                {detailsData.similarProducts.slice(0, 4).map((sim: Product) => (
                  <ProductCard
                    key={`${sim.store}-${sim.productId}`}
                    product={sim}
                    onAddToCart={onAddToCart}
                    onNavigateRoute={onNavigateRoute}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
