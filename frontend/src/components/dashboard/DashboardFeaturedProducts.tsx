import React, { useState } from 'react';
import {
  Star,
  ArrowRight,
  ShoppingCart,
  Check
} from 'lucide-react';
import { Product } from '../../types';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  products: Product[];
  category?: string;
  onResetCategory?: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateRoute?: (route: string) => void;
  onToggleCompare?: (product: Product) => void;
  onViewAll?: () => void;
  language?: SupportedLanguage;
}

const CATEGORY_META: Record<string, { title: string; emoji: string }> = {
  mobiles: { title: 'Mobiles & Smartphones', emoji: '📱' },
  laptops: { title: 'Laptops & Computers', emoji: '💻' },
  fashion: { title: 'Fashion & Clothing', emoji: '👗' },
  shoes: { title: 'Shoes & Footwear', emoji: '👟' },
  footwear: { title: 'Shoes & Footwear', emoji: '👟' },
  home_kitchen: { title: 'Home & Living', emoji: '🛋️' },
  home_living: { title: 'Home & Living', emoji: '🛋️' },
  electronics: { title: 'Electronics & Audio', emoji: '🎧' },
  appliances: { title: 'Home Appliances', emoji: '🧺' },
  beauty: { title: 'Beauty & Personal Care', emoji: '💄' },
  toys: { title: 'Toys & Games', emoji: '🧸' },
  tablets: { title: 'Tablets & iPads', emoji: '📱' },
  tvs: { title: 'Smart TVs & Displays', emoji: '📺' }
};

export const DashboardFeaturedProducts: React.FC<Props> = ({
  products = [],
  category = 'all',
  onResetCategory,
  onAddToCart,
  onSelectProduct,
  onNavigateRoute,
  onToggleCompare,
  onViewAll
}) => {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Exact 5 items featured in reference image
  const referenceTopDeals = [
    {
      productId: 'apple-iphone-15-128gb',
      title: 'iPhone 15 (128GB)',
      subtitle: 'Apple',
      price: 64999,
      mrp: 79900,
      discountPct: 18,
      rating: 4.6,
      ratingCountText: '12.5k',
      badge: 'Best Value',
      badgeColor: '#10b981',
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    },
    {
      productId: 'asus-vivobook-15',
      title: 'ASUS Vivobook 15',
      subtitle: 'Intel i5 | 16GB | 512GB SSD',
      price: 49990,
      mrp: 64990,
      discountPct: 23,
      rating: 4.5,
      ratingCountText: '8.2k',
      badge: 'Top Rated',
      badgeColor: '#6366f1',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80',
      store: 'flipkart' as const
    },
    {
      productId: 'nike-running-shoes-mens',
      title: 'Nike Running Shoes',
      subtitle: "Men's | Lightweight",
      price: 3499,
      mrp: 5999,
      discountPct: 42,
      rating: 4.4,
      ratingCountText: '6.3k',
      badge: 'Bestseller',
      badgeColor: '#f97316',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
      store: 'flipkart' as const
    },
    {
      productId: 'sony-wh-ch720n-headphones',
      title: 'Sony WH-CH720N',
      subtitle: 'Noise Canceling Headphones',
      price: 8990,
      mrp: 12990,
      discountPct: 31,
      rating: 4.5,
      ratingCountText: '4.8k',
      badge: null,
      badgeColor: null,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    },
    {
      productId: 'fire-boltt-smart-watch',
      title: 'Fire-Boltt Smart Watch',
      subtitle: 'SpO2 | Heart Rate | GPS',
      price: 2499,
      mrp: 4999,
      discountPct: 50,
      rating: 4.2,
      ratingCountText: '3.6k',
      badge: null,
      badgeColor: null,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    }
  ];

  const handleAction = (item: {
    productId: string;
    title: string;
    subtitle?: string;
    price: number;
    mrp?: number;
    discountPct?: number;
    rating?: number;
    imageUrl?: string;
    store: any;
  }) => {
    const p: Product = {
      productId: item.productId,
      title: item.title,
      price: item.price,
      mrp: item.mrp ?? item.price,
      discountPct: item.discountPct ?? 0,
      rating: item.rating ?? 4.5,
      ratingCount: 1000,
      imageUrl: item.imageUrl || '',
      store: item.store || 'amazon',
      inStock: true,
      deliveryDays: 1,
      shippingFee: 0,
      seller: item.subtitle || 'Authorized Retailer',
      productUrl: '#',
      affiliateUrl: '#'
    };
    onAddToCart(p, 1);
    if (onToggleCompare) onToggleCompare(p);
    setAddedIds((prev) => ({ ...prev, [item.productId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.productId]: false }));
    }, 1800);
  };

  const isCategoryFilter = category && category !== 'all';
  const catMeta = isCategoryFilter
    ? CATEGORY_META[category] || {
        title: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
        emoji: '🛍️'
      }
    : { title: 'Top Deals', emoji: '🔥' };

  const maxItems = isCategoryFilter ? 20 : 5;

  const itemsToDisplay = products && products.length > 0
    ? products.slice(0, maxItems).map((p, idx) => ({
        productId: p.productId,
        title: p.title,
        subtitle: p.seller || (p.store ? p.store.toUpperCase() : 'VoiceCart'),
        price: p.price,
        mrp: p.mrp || Math.round(p.price * 1.25),
        discountPct: p.discountPct || (p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 15),
        rating: p.rating || 4.5,
        ratingCountText: p.ratingCount ? `${(p.ratingCount / 1000).toFixed(1)}k` : '1.2k',
        badge: idx === 0 ? 'Best Value' : idx === 1 ? 'Top Rated' : idx === 2 ? 'Bestseller' : null,
        badgeColor: idx === 0 ? '#10b981' : idx === 1 ? '#6366f1' : idx === 2 ? '#f97316' : null,
        imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
        store: (p.store || 'amazon') as 'amazon' | 'flipkart' | 'meesho'
      }))
    : isCategoryFilter
    ? []
    : referenceTopDeals;

  return (
    <div style={{ width: '100%', marginBottom: '28px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>{catMeta.emoji}</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {catMeta.title}
          </h2>
          {isCategoryFilter && itemsToDisplay.length > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                padding: '3px 8px',
                borderRadius: '12px'
              }}
            >
              {itemsToDisplay.length} related items
            </span>
          )}
        </div>

        {isCategoryFilter ? (
          <button
            type="button"
            onClick={onResetCategory || onViewAll}
            style={{
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              color: '#2563eb',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Show All Deals</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (onViewAll) onViewAll();
              else if (onNavigateRoute) onNavigateRoute('/deals');
            }}
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
        )}
      </div>

      {/* Cards Row or Responsive Grid */}
      {itemsToDisplay.length === 0 ? (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}
        >
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
            Loading related {catMeta.title} items...
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: itemsToDisplay.length > 5
              ? 'repeat(auto-fill, minmax(210px, 1fr))'
              : 'repeat(5, minmax(0, 1fr))',
            gap: '14px',
            width: '100%',
            paddingBottom: '4px'
          }}
        >
          {itemsToDisplay.map((item) => {
          const isAdded = !!addedIds[item.productId];

          return (
            <div
              key={item.productId}
              onClick={() => {
                const prod: Product = {
                  productId: item.productId,
                  title: item.title,
                  price: item.price,
                  mrp: item.mrp,
                  discountPct: item.discountPct,
                  rating: item.rating,
                  ratingCount: 1000,
                  imageUrl: item.imageUrl,
                  store: item.store,
                  inStock: true,
                  deliveryDays: 1,
                  shippingFee: 0,
                  seller: 'Authorized Retailer',
                  productUrl: '#',
                  affiliateUrl: '#'
                };
                onSelectProduct(prod);
                if (onNavigateRoute) {
                  onNavigateRoute(`/product/${encodeURIComponent(item.store)}/${encodeURIComponent(item.productId)}`);
                }
              }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                minWidth: '160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            >
              {/* Top Badge (Best Value / Top Rated / Bestseller) */}
              {item.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 2,
                    background: item.badgeColor || '#10b981',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.2px'
                  }}
                >
                  {item.badge}
                </div>
              )}

              {/* Product Image */}
              <div
                style={{
                  width: '100%',
                  height: '145px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    transition: 'transform 0.25s ease'
                  }}
                />
              </div>

              {/* Card Body */}
              <div style={{ padding: '12px 14px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h4
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    margin: '0 0 2px 0',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={item.title}
                >
                  {item.title}
                </h4>

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.subtitle}
                </div>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <Star size={12} fill="#eab308" color="#eab308" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.rating}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({item.ratingCountText})
                  </span>
                </div>

                {/* Price, MRP and Discount */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--text-main)' }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{item.mrp.toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                    {item.discountPct}% off
                  </span>
                </div>

                {/* Compare & Buy Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item);
                  }}
                  style={{
                    marginTop: 'auto',
                    width: '100%',
                    background: isAdded ? '#10b981' : 'var(--bg-subtle, #f1f5f9)',
                    color: isAdded ? '#ffffff' : 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '7px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAdded) {
                      e.currentTarget.style.background = '#4f46e5';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#4f46e5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAdded) {
                      e.currentTarget.style.background = 'var(--bg-subtle, #f1f5f9)';
                      e.currentTarget.style.color = 'var(--text-main)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }
                  }}
                >
                  {isAdded ? (
                    <>
                      <Check size={13} />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={13} />
                      <span>Compare &amp; Buy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
