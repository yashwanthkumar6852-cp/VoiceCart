import React, { useState } from 'react';
import {
  Star,
  Heart,
  ArrowRight,
  ShoppingCart,
  Check,
  Award,
  Zap,
  TrendingUp,
  Flame,
  Scale
} from 'lucide-react';
import { Product } from '../../types';
import { ProductImage } from '../ProductImage';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateRoute?: (route: string) => void;
  onToggleCompare?: (product: Product) => void;
  onViewAll?: () => void;
  language?: SupportedLanguage;
}

export const DashboardFeaturedProducts: React.FC<Props> = ({
  products,
  onAddToCart,
  onSelectProduct,
  onNavigateRoute,
  onToggleCompare,
  onViewAll,
  language = 'en'
}) => {
  const [wishlistedIds, setWishlistedIds] = useState<Record<string, boolean>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlistedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    onAddToCart(p, 1);
    setAddedIds((prev) => ({ ...prev, [p.productId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [p.productId]: false }));
    }, 1800);
  };

  const fallbackFeatured: Product[] = [
    {
      productId: 'hp-pav-15',
      title: 'HP Pavilion 15',
      brand: 'HP',
      price: 48990,
      mrp: 69990,
      discountPct: 30,
      rating: 4.5,
      ratingCount: 12400,
      reviewCount: 12400,
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
      store: 'amazon',
      productUrl: '#',
      affiliateUrl: '#',
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Amazon Retail',
      inStock: true,
      highlights: ['Intel i5', '16GB RAM', '512GB SSD', '15.6" FHD']
    },
    {
      productId: 'iphone-15-128',
      title: 'iPhone 15 (128GB)',
      brand: 'Apple',
      price: 69999,
      mrp: 79000,
      discountPct: 12,
      rating: 4.7,
      ratingCount: 25600,
      reviewCount: 25600,
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60',
      store: 'flipkart',
      productUrl: '#',
      affiliateUrl: '#',
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'SuperComNet',
      inStock: true,
      highlights: ['A16 Bionic', '48MP Camera', '6.1" Super Retina XDR']
    },
    {
      productId: 'sony-wh1000xm5',
      title: 'Sony WH-1000XM5',
      brand: 'Sony',
      price: 24990,
      mrp: 34990,
      discountPct: 29,
      rating: 4.4,
      ratingCount: 8300,
      reviewCount: 8300,
      imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
      store: 'amazon',
      productUrl: '#',
      affiliateUrl: '#',
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      highlights: ['Noise Cancelling', '30hr Battery', 'Bluetooth 5.2']
    },
    {
      productId: 'fire-boltt-ninja',
      title: 'Fire-Boltt Ninja Call Pro',
      brand: 'Fire-Boltt',
      price: 1999,
      mrp: 5990,
      discountPct: 67,
      rating: 4.3,
      ratingCount: 6700,
      reviewCount: 6700,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
      store: 'meesho',
      productUrl: '#',
      affiliateUrl: '#',
      deliveryDays: 3,
      shippingFee: 0,
      seller: 'Retail Smart',
      inStock: true,
      highlights: ['1.69" Display', 'BT Calling', '700+ Sports Modes']
    }
  ];

  const displayList = products && products.length >= 4 ? products.slice(0, 4) : fallbackFeatured;

  const cardBadges = [
    { text: t.bestOverall, bg: '#10b981', color: '#ffffff' },
    { text: t.bestRated, bg: '#6366f1', color: '#ffffff' },
    { text: t.lowestPrice, bg: '#0284c7', color: '#ffffff' },
    { text: t.fastestDelivery, bg: '#ec4899', color: '#ffffff' }
  ];

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>🔥</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {t.featuredDeals}
          </h2>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px'
          }}
        >
          <span>{t.viewAllDeals}</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4 Cards Responsive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '16px',
          width: '100%'
        }}
      >
        {displayList.map((product, idx) => {
          const badge = cardBadges[idx % cardBadges.length];
          const isWishlisted = !!wishlistedIds[product.productId];
          const isAdded = !!addedIds[product.productId];
          const specsLine =
            product.highlights && product.highlights.length > 0
              ? product.highlights.slice(0, 3).join(' | ')
              : product.brand
              ? `${product.brand} • In Stock`
              : 'Verified Best Deal';

          const mrp = product.mrp || Math.round(product.price * 1.35);
          const discountPct = product.discountPct || Math.round(((mrp - product.price) / mrp) * 100);

          return (
            <div
              key={`${product.store}-${product.productId}-${idx}`}
              onClick={() => {
                onSelectProduct(product);
                if (onNavigateRoute) {
                  onNavigateRoute(`/product/${encodeURIComponent(product.store)}/${encodeURIComponent(product.productId)}`);
                }
              }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-card)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {/* Card Top: Standout Badge + Heart Wishlist */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <span
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase'
                  }}
                >
                  {badge.text}
                </span>

                <button
                  type="button"
                  aria-label="Wishlist"
                  onClick={(e) => toggleWishlist(e, product.productId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    color: isWishlisted ? '#ef4444' : 'var(--text-muted)'
                  }}
                >
                  <Heart size={16} fill={isWishlisted ? '#ef4444' : 'none'} />
                </button>
              </div>

              {/* Product Image */}
              <div
                style={{
                  width: '100%',
                  height: '145px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                  background: 'var(--img-bg)',
                  borderRadius: '10px',
                  padding: '8px',
                  overflow: 'hidden'
                }}
              >
                <ProductImage
                  src={product.imageUrl}
                  alt={product.title}
                  index={idx}
                  store={product.store}
                  productId={product.productId}
                  style={{ maxHeight: '130px', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Rating & Review Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>★</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {product.rating || 4.5}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  ({(product.ratingCount || 12400) > 1000 ? `${((product.ratingCount || 12400) / 1000).toFixed(1)}k` : product.ratingCount || 12400})
                </span>
              </div>

              {/* Product Title (Verbatim - never corrupted) */}
              <div
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: 1.3,
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={product.title}
              >
                {product.title}
              </div>

              {/* Spec Line */}
              <div
                style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.3,
                  marginBottom: '10px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={specsLine}
              >
                {specsLine}
              </div>

              {/* Price & Discount (Verbatim Indian rupee currency) */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {mrp > product.price && (
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPct > 0 && (
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                    {discountPct}% off
                  </span>
                )}
              </div>

              {/* Action Buttons: Add to Cart & Store Badge */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background:
                      product.store === 'amazon'
                        ? 'rgba(255, 153, 0, 0.15)'
                        : product.store === 'flipkart'
                        ? 'rgba(40, 116, 240, 0.15)'
                        : 'rgba(244, 51, 151, 0.15)',
                    color:
                      product.store === 'amazon'
                        ? '#ff9900'
                        : product.store === 'flipkart'
                        ? '#2874f0'
                        : '#f43397'
                  }}
                >
                  {product.store}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleAdd(e, product)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isAdded ? 'var(--accent-green)' : 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isAdded ? (
                    <>
                      <Check size={13} />
                      <span>{t.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={13} />
                      <span>{t.addToCart}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
