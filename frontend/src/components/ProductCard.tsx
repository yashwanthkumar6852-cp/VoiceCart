import React, { useState } from 'react';
import {
  Star,
  ShoppingCart,
  ExternalLink,
  Tag,
  Truck,
  Lock,
  Heart,
  Info,
  Check,
  Plus,
  Minus,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Award,
  Zap
} from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateQualityScore, normalizeQuantityInfo, buildRealProductSpecifications } from '../utils/productNormalizer';
import { ProductImage } from './ProductImage';
import { SupportedLanguage, translations } from '../i18n/translations';

interface Props {
  product: Product;
  index?: number;
  sessionId?: string;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateRoute?: (route: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  layout?: 'grid' | 'row';
  language?: SupportedLanguage;
}

export const ProductCard: React.FC<Props> = ({
  product,
  index,
  sessionId,
  onAddToCart,
  onSelectProduct,
  onNavigateRoute,
  isCompared = false,
  onToggleCompare,
  layout = 'row',
  language = 'en'
}) => {
  const { isAuthenticated } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;
  const [showQualityPopover, setShowQualityPopover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Compute or extract Quality
  const quality =
    product.quality ||
    calculateQualityScore({
      rating: product.rating,
      ratingCount: product.ratingCount,
      sellerRating: product.sellerInfo?.rating,
      sellerName: product.seller || product.sellerInfo?.name,
      returnPolicy: product.returnPolicy,
      warranty: product.warranty,
      fulfilledByStore: product.fulfilledByStore,
      reviewCount: product.reviewCount
    });

  // Compute or extract Quantity Info
  const quantityInfo =
    product.quantityInfo ||
    normalizeQuantityInfo(product.quantity, product.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK', product.price);

  const storeBadgeStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
    amazon: { bg: '#ff9900', text: '#000', label: 'Amazon India', border: '#e68a00' },
    flipkart: { bg: '#2874f0', text: '#fff', label: 'Flipkart', border: '#1c62d6' },
    meesho: { bg: '#f43397', text: '#fff', label: 'Meesho', border: '#d81b7e' },
    voicecart: { bg: '#6366f1', text: '#fff', label: 'VoiceCart Direct', border: '#4f46e5' }
  };

  const storeInfo = storeBadgeStyles[product.store] || {
    bg: 'var(--primary)',
    text: '#fff',
    label: product.store,
    border: 'transparent'
  };

  // Rating Pill Color Scheme: Green >= 4.0, Orange 3.0-3.9, Red < 3.0
  const getRatingPillBg = (rating: number) => {
    if (rating >= 4.0) return '#388e3c'; // Flipkart green
    if (rating >= 3.0) return '#d97706'; // Amber / Orange
    return '#dc2626'; // Red
  };

  const openDetails = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    const sidParam = sessionId ? `?sid=${encodeURIComponent(sessionId)}` : '';
    const targetUrl = `/product/${encodeURIComponent(product.store)}/${encodeURIComponent(product.productId)}${sidParam}`;
    if (onNavigateRoute) {
      onNavigateRoute(targetUrl);
    } else {
      window.history.pushState({}, '', targetUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Standout badges
  const isBestOverall = product.badges?.includes('Best Overall');
  const isLowestPrice = product.badges?.includes('Lowest Price');
  const isBestRated = product.badges?.includes('Top Rated') || product.badges?.includes('Best Rated');
  const isExactMatch = product.badges?.includes('Exact Match');

  // Extract 3-5 key highlights
  const highlights =
    product.highlights && product.highlights.length > 0
      ? product.highlights.slice(0, 5)
      : Object.values(
          product.specifications && Object.keys(product.specifications).length > 0
            ? product.specifications
            : buildRealProductSpecifications(product)
        )
          .flatMap((grp) => Object.entries(grp).map(([k, v]) => `${k}: ${v}`))
          .slice(0, 4);

  // Delivery string
  const deliveryText = product.delivery?.date || (product.deliveryDays === 1 ? 'Tomorrow' : `Delivery in ${product.deliveryDays} days`);
  const isFreeDelivery = product.delivery?.isFree ?? (product.shippingFee === 0);

  if (layout === 'grid') {
    return (
      <div
        className="marketplace-grid-card"
        onClick={openDetails}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 6px 16px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        {/* Deal Tag / Value 365 on top-left (Shown when real discount >= 20%) */}
        {product.discountPct >= 20 && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 3,
              background: '#e11d48',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.3px'
            }}
          >
            Value 365
          </div>
        )}

        {/* Wishlist Heart on top-right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 3,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Heart size={15} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#878787'} />
        </button>

        {/* Product Image Container with Rating Badge in Bottom-Left */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '210px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--img-bg)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}
        >
          <ProductImage
            src={product.imageUrl}
            images={product.images}
            alt={product.title}
            index={index}
            store={product.store}
            productId={product.productId}
            style={{
              maxHeight: '190px',
              maxWidth: '100%',
              objectFit: 'contain',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.25s ease'
            }}
          />

          {/* Rating Badge Pill in Bottom-Left of Image (Matching User Image Exactly: 4.7 ★ (6,207)) */}
          {product.rating > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '2px 6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                zIndex: 2
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)' }}>
                {product.rating.toFixed(1)}
              </span>
              <span style={{ fontSize: '10px', color: '#388e3c', fontWeight: 900 }}>★</span>
              {product.ratingCount > 0 && (
                <span style={{ fontSize: '10px', color: '#878787', marginLeft: '1px' }}>
                  ({product.ratingCount >= 1000 ? `${(product.ratingCount / 1000).toFixed(1)}k` : product.ratingCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title: Brand in Bold + Title text */}
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--text-main)',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {product.brand && (
              <strong style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '4px' }}>
                {product.brand}
              </strong>
            )}
            <span>{product.title}</span>
          </div>
        </div>

        {/* Price Row: Bold Dark Selling Price + Strikethrough MRP + Discount */}
        <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <span style={{ fontSize: '13px', color: '#878787', textDecoration: 'line-through' }}>
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
            {product.discountPct > 0 && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#388e3c' }}>
                {product.discountPct}% off
              </span>
            )}
          </div>

          {/* Deal / Store Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: storeInfo.text,
                background: storeInfo.bg,
                padding: '2px 7px',
                borderRadius: '3px'
              }}
            >
              {storeInfo.label}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product, 1);
              }}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShoppingCart size={12} /> {t.addToCart}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flipkart-product-card product-card-container glass-panel ${isBestOverall ? 'card-standout-best' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQualityPopover(false);
      }}
      style={{
        display: 'flex',
        flexDirection: layout === 'row' ? 'row' : 'column',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        border: isBestOverall
          ? '2px solid var(--accent-gold, #f59e0b)'
          : isLowestPrice
          ? '2px solid var(--accent-green, #10b981)'
          : '1px solid var(--border-color)',
        boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.18)' : 'var(--shadow-card)',
        transition: 'all 0.25s ease',
        background: 'var(--bg-card)',
        padding: '16px',
        gap: '20px'
      }}
    >
      {/* 1. LEFT SIDE: Image Gallery Preview, Store Badge, Wishlist Heart, Compare Checkbox */}
      <div
        style={{
          width: layout === 'row' ? '220px' : '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {/* Standout earned badges */}
        <div style={{ position: 'absolute', top: '0px', left: '0px', zIndex: 4, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isBestOverall && (
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}
            >
              <Award size={12} /> Best Overall
            </span>
          )}
          {isLowestPrice && !isBestOverall && (
            <span
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Tag size={12} /> Lowest Price
            </span>
          )}
          {isBestRated && !isBestOverall && !isLowestPrice && (
            <span
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              ★ Best Rated
            </span>
          )}
          {isExactMatch && !isBestOverall && (
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-green)',
                border: '1px solid var(--accent-green)',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              Exact Match
            </span>
          )}
          {!isExactMatch && (
            <span
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--accent-gold, #f59e0b)',
                border: '1px solid #f59e0b',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              title={product.reason || 'Similar Alternative'}
            >
              Similar: {product.reason?.split(/[,;]/)[0] || 'Alternative'}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            zIndex: 4,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Heart
            size={16}
            fill={isWishlisted ? '#ef4444' : 'none'}
            color={isWishlisted ? '#ef4444' : 'var(--text-muted)'}
          />
        </button>

        {/* Product Image Container with Zoom */}
        <div
          onClick={openDetails}
          style={{
            width: '100%',
            height: '180px',
            background: 'var(--img-bg)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            cursor: 'pointer',
            overflow: 'hidden',
            marginTop: '22px'
          }}
        >
          <ProductImage
            src={product.imageUrl}
            images={product.images}
            thumbnail={(product as any).thumbnail}
            serpapi_thumbnail={(product as any).serpapi_thumbnail}
            alt={product.title}
            index={index}
            store={product.store}
            productId={product.productId}
            variantText={product.variantText}
            style={{
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.35s ease'
            }}
          />
        </div>

        {/* Bottom Image Sub-bar: Store Badge & Compare Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '10px' }}>
          <span
            style={{
              backgroundColor: storeInfo.bg,
              color: storeInfo.text,
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
            }}
          >
            {storeInfo.label}
          </span>

          <label
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => onToggleCompare && onToggleCompare(product)}
              style={{ cursor: 'pointer' }}
            />
            Compare
          </label>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Brand, Title, Rating Pill, Highlights, Quality Badge & Chips */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Small Brand Text Above Title */}
        {product.brand && (
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            {product.brand}
          </div>
        )}

        {/* Product Title (2 Lines Maximum) */}
        <h3
          onClick={openDetails}
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            lineHeight: 1.35,
            cursor: 'pointer',
            margin: '0 0 4px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Variant Subtitle (e.g. "Bold Black, True Wireless") */}
        {product.variantText && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {product.variantText}
          </div>
        )}

        {/* Rating Pill + Review Counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {product.rating > 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: getRatingPillBg(product.rating),
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '4px'
              }}
            >
              {product.rating.toFixed(1)} <Star size={11} fill="#fff" color="#fff" />
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No ratings yet
            </span>
          )}

          {product.ratingCount > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {product.ratingCount.toLocaleString()} Ratings & {product.reviewCount ? product.reviewCount.toLocaleString() : Math.round(product.ratingCount * 0.08).toLocaleString()} Reviews
            </span>
          )}
        </div>

        {/* Key Highlights Bullet Points (3 to 5 real specs) */}
        {highlights.length > 0 && (
          <ul
            style={{
              paddingLeft: '18px',
              margin: '0 0 12px 0',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55
            }}
          >
            {highlights.map((hl, idx) => (
              <li key={idx}>{hl}</li>
            ))}
          </ul>
        )}

        {/* Quality Score Badge & Real Signal Chips */}
        <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px', position: 'relative' }}>
            {quality.hasEnoughData ? (
              <div
                onClick={() => setShowQualityPopover(!showQualityPopover)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: quality.score >= 8.0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                  border: quality.score >= 8.0 ? '1px solid var(--accent-green)' : '1px solid var(--primary)',
                  color: quality.score >= 8.0 ? 'var(--accent-green)' : 'var(--primary)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Based on ratings, seller and policies (Click for breakdown)"
              >
                <Award size={13} />
                <span>Quality: {quality.score}/10</span>
                <Info size={12} />
              </div>
            ) : (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-subtle)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                Quality: Not enough data
              </span>
            )}

            {/* Quality Mini Breakdown Popover */}
            {showQualityPopover && quality.breakdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '28px',
                  left: '0px',
                  zIndex: 20,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  width: '260px',
                  fontSize: '0.75rem',
                  color: 'var(--text-main)'
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Quality Score Breakdown</span>
                  <span style={{ color: 'var(--accent-green)' }}>{quality.score}/10</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  <span>Customer Ratings ({product.rating}★):</span>
                  <span>+{quality.breakdown.ratingWeight}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  <span>Seller Rating & Reliability:</span>
                  <span>+{quality.breakdown.sellerWeight}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  <span>Return/Replacement Policy:</span>
                  <span>+{quality.breakdown.policyBonus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  <span>Brand Warranty:</span>
                  <span>+{quality.breakdown.warrantyBonus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  <span>Store Fulfillment / Assured:</span>
                  <span>+{quality.breakdown.fulfilledBonus}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                  {quality.basis}
                </div>
              </div>
            )}

            {/* Real Signal Chips */}
            {quality.signals.map((sig, sIdx) => (
              <span
                key={sIdx}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
              >
                ✓ {sig}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RIGHT SIDE: Price Block, MRP, % off, Free Delivery, Quantity Selector, Action Buttons */}
      <div
        style={{
          width: layout === 'row' ? '240px' : '100%',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: layout === 'row' ? '1px solid var(--border-subtle)' : 'none',
          paddingLeft: layout === 'row' ? '16px' : '0px',
          paddingTop: layout === 'row' ? '0px' : '12px'
        }}
      >
        <div>
          {/* Price & MRP Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{product.price.toLocaleString()}
            </span>
            {product.mrp > product.price && (
              <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                ₹{product.mrp.toLocaleString()}
              </span>
            )}
            {product.discountPct > 0 && (
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {product.discountPct}% off
              </span>
            )}
          </div>

          {/* Price per unit if pack > 1 */}
          {quantityInfo.unitsInPack && quantityInfo.unitsInPack > 1 && quantityInfo.pricePerUnit && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              (₹{quantityInfo.pricePerUnit.toLocaleString()} / unit) • {quantityInfo.packSize}
            </div>
          )}

          {/* Delivery Row */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={13} color="var(--secondary)" />
            <span>
              {isFreeDelivery ? <strong style={{ color: 'var(--accent-green)' }}>Free delivery</strong> : `₹${product.shippingFee} delivery`}
              {' '}• {deliveryText}
            </span>
          </div>

          {/* Offers snippet */}
          {product.offers && product.offers.length > 0 && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#16a34a',
                background: 'rgba(22, 163, 74, 0.08)',
                padding: '4px 6px',
                borderRadius: '4px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Zap size={12} /> {product.offers[0]}
            </div>
          )}

          {/* Quantity & Stock Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  background: 'var(--bg-subtle)',
                  border: 'none',
                  color: 'var(--text-main)',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                <Minus size={12} />
              </button>
              <span style={{ padding: '0 8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                style={{
                  background: 'var(--bg-subtle)',
                  border: 'none',
                  color: 'var(--text-main)',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} />
              </button>
            </div>

            {/* Stock status */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color:
                  quantityInfo.stockStatus === 'OUT_OF_STOCK'
                    ? 'var(--accent-rose)'
                    : quantityInfo.stockStatus === 'LOW_STOCK'
                    ? 'var(--accent-gold)'
                    : 'var(--accent-green)'
              }}
            >
              {quantityInfo.stockStatus === 'OUT_OF_STOCK'
                ? 'Out of stock'
                : quantityInfo.stockStatus === 'LOW_STOCK'
                ? 'Only 3 left'
                : 'In stock'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Add to Cart, Buy on Store, View Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => onAddToCart(product, quantity)}
            disabled={!product.inStock || quantityInfo.stockStatus === 'OUT_OF_STOCK'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ff9f00, #fb8c00)',
              color: '#fff',
              border: 'none',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: product.inStock ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 6px rgba(251, 140, 0, 0.3)'
            }}
          >
            {isAuthenticated ? <ShoppingCart size={15} /> : <Lock size={14} />}
            Add to Cart
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: storeInfo.bg,
                color: storeInfo.text,
                border: 'none',
                padding: '7px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={13} /> Buy
            </a>

            <button
              onClick={openDetails}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                padding: '7px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Eye size={13} /> Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
