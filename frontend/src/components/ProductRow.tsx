import React, { useState } from 'react';
import { Heart, Star, Check, ShieldCheck, ShoppingCart, ExternalLink } from 'lucide-react';
import { Product, StoreName } from '../types';
import { formatIndianPrice, extractRealSpecBullets } from '../utils/productNormalizer';
import { ProductImage } from './ProductImage';
import { SupportedLanguage, getTranslation } from '../i18n/translations';

interface ProductRowProps {
  product: Product;
  index?: number;
  sessionId?: string;
  language?: SupportedLanguage;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateRoute?: (route: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  index,
  sessionId,
  language = 'en',
  onAddToCart,
  onSelectProduct,
  onNavigateRoute,
  isCompared = false,
  onToggleCompare,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [localWishlisted, setLocalWishlisted] = useState(isWishlisted);
  const t = getTranslation(language);

  const bullets = extractRealSpecBullets(product);
  const formattedPrice = formatIndianPrice(product.price);
  const formattedMrp = product.mrp > product.price ? formatIndianPrice(product.mrp) : null;
  const discountText = product.discountPct > 0 ? `${product.discountPct}% off` : null;

  const sidParam = sessionId ? `?sid=${encodeURIComponent(sessionId)}` : '';
  const detailsUrl = `/product/${encodeURIComponent(product.store)}/${encodeURIComponent(product.productId)}${sidParam}`;

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectProduct) onSelectProduct(product);
    if (onNavigateRoute) {
      onNavigateRoute(detailsUrl);
    }
  };

  const getRatingPillColor = (rating: number) => {
    if (rating >= 4.0) return { bg: '#388e3c', text: '#fff' }; // Flipkart green
    if (rating >= 3.0) return { bg: '#ff9f00', text: '#fff' }; // Orange
    return { bg: '#ff6161', text: '#fff' }; // Red
  };

  const ratingColor = getRatingPillColor(product.rating);

  const getStoreBadge = (store: StoreName) => {
    switch (store) {
      case 'amazon':
        return { label: 'Amazon India', bg: 'rgba(255, 153, 0, 0.12)', border: '#ff9900', color: '#ea580c' };
      case 'flipkart':
        return { label: 'Flipkart', bg: 'rgba(40, 116, 240, 0.12)', border: '#2874f0', color: '#2563eb' };
      case 'meesho':
        return { label: 'Meesho', bg: 'rgba(244, 51, 151, 0.12)', border: '#f43397', color: '#db2777' };
      default:
        return { label: 'VoiceCart Direct', bg: 'rgba(99, 102, 241, 0.12)', border: '#6366f1', color: '#6366f1' };
    }
  };

  const storeBadge = getStoreBadge(product.store);

  return (
    <div
      className="product-row-container"
      style={{
        display: 'flex',
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-color, rgba(226, 232, 240, 0.8))',
        background: 'var(--bg-card, #ffffff)',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        gap: '24px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 1. LEFT: IMAGE COLUMN */}
      <div
        className="product-row-img-col"
        style={{
          width: '200px',
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative'
        }}
      >
        <div
          onClick={handleOpenDetails}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '140px',
            maxHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            padding: '8px',
            borderRadius: '8px',
            background: 'var(--bg-subtle, #f8fafc)',
            overflow: 'hidden'
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
            className="product-row-img"
            style={{
              maxHeight: '180px',
              maxWidth: '100%',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* Wishlist Heart Icon */}
          <button
            type="button"
            aria-label="Wishlist"
            onClick={(e) => {
              e.stopPropagation();
              setLocalWishlisted(!localWishlisted);
              if (onToggleWishlist) onToggleWishlist(product);
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'var(--bg-card, rgba(255, 255, 255, 0.9))',
              border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Heart
              size={17}
              color={localWishlisted ? '#ef4444' : '#94a3b8'}
              fill={localWishlisted ? '#ef4444' : 'none'}
            />
          </button>
        </div>

        {/* Add to Compare Checkbox */}
        <label
          style={{
            marginTop: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            userSelect: 'none',
            fontWeight: 500
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare && onToggleCompare(product)}
            style={{
              cursor: 'pointer',
              width: '15px',
              height: '15px',
              accentColor: 'var(--primary, #2874f0)'
            }}
          />
          <span>{t.compare}</span>
        </label>
      </div>

      {/* 2. MIDDLE: SPECIFICATION & DETAILS COLUMN */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          paddingRight: '16px'
        }}
      >
        {/* Grey Sponsored label if marked */}
        {(product as any).isSponsored && (
          <span
            style={{
              fontSize: '0.7rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
              marginBottom: '2px'
            }}
          >
            {t.sponsored}
          </span>
        )}

        {/* Title as blue link */}
        <a
          href={detailsUrl}
          onClick={handleOpenDetails}
          style={{
            color: 'var(--link-color, #1d4ed8)',
            fontSize: '1.12rem',
            fontWeight: 600,
            lineHeight: 1.35,
            textDecoration: 'none',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          {product.title}
        </a>

        {/* Rating Pill + Review Counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {product.rating > 0 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: ratingColor.bg,
                color: ratingColor.text,
                padding: '2px 7px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              <span>{product.rating.toFixed(1)}</span>
              <Star size={11} fill="#fff" color="#fff" />
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {t.noRatings}
            </span>
          )}

          {product.ratingCount > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
              {product.ratingCount.toLocaleString('en-IN')} {t.ratings} & {product.reviewCount ? product.reviewCount.toLocaleString('en-IN') : Math.round(product.ratingCount * 0.08).toLocaleString('en-IN')} {t.reviews}
            </span>
          )}
        </div>

        {/* 4 to 6 Spec Bullets */}
        <ul
          style={{
            margin: 0,
            paddingLeft: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            color: 'var(--text-main, #334155)',
            fontSize: '0.85rem',
            lineHeight: 1.45
          }}
        >
          {bullets.map((b, idx) => (
            <li key={idx} style={{ color: 'var(--text-muted, #475569)' }}>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. RIGHT: PRICING, STORE & DELIVERY COLUMN */}
      <div
        style={{
          width: '230px',
          minWidth: '230px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          borderLeft: '1px solid var(--border-color, rgba(226, 232, 240, 0.6))',
          paddingLeft: '20px'
        }}
      >
        {/* Large Price + MRP + Discount */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            {formattedPrice}
          </span>
          {formattedMrp && (
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
              {formattedMrp}
            </span>
          )}
          {discountText && (
            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
              {discountText}
            </span>
          )}
        </div>

        {/* Real Offer Chips */}
        {product.offers && product.offers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
            {product.offers.slice(0, 2).map((offer, oIdx) => (
              <span
                key={oIdx}
                style={{
                  fontSize: '0.72rem',
                  color: '#15803d',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>🏷️</span> {offer.length > 34 ? offer.slice(0, 34) + '...' : offer}
              </span>
            ))}
          </div>
        )}

        {/* Delivery & Free Delivery */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-main, #1e293b)', marginBottom: '8px' }}>
          {product.delivery?.isFree || product.shippingFee === 0 ? (
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{t.freeDelivery} </span>
          ) : (
            <span style={{ color: 'var(--text-muted, #64748b)' }}>₹{product.shippingFee} {t.delivery} </span>
          )}
          <span style={{ color: 'var(--text-muted, #64748b)' }}>
            {product.delivery?.date || `by ${product.deliveryDays || 2} days`}
          </span>
        </div>

        {/* Store Badge & Trusted Seller */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: storeBadge.bg,
              border: `1px solid ${storeBadge.border}`,
              color: storeBadge.color
            }}
          >
            {storeBadge.label}
          </span>

          {product.fulfilledByStore && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#0284c7',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(2, 132, 199, 0.08)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              <ShieldCheck size={12} /> {t.trusted}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.inStock === false ? (
          <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>
            {t.outOfStock}
          </span>
        ) : product.quantityInfo?.stockStatus === 'LOW_STOCK' ? (
          <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, marginBottom: '8px' }}>
            Only 3 Left
          </span>
        ) : null}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) onAddToCart(product, 1);
            }}
            disabled={product.inStock === false}
            style={{
              flex: 1,
              padding: '7px 10px',
              background: 'linear-gradient(135deg, var(--primary, #2874f0), #1e5ac8)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: product.inStock === false ? 'not-allowed' : 'pointer',
              opacity: product.inStock === false ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <ShoppingCart size={14} /> {t.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
};
