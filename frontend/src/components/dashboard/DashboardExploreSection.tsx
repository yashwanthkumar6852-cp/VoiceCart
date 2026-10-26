import React, { useState } from 'react';
import { ArrowRight, Star, ShoppingCart, Check, Heart, ChevronDown } from 'lucide-react';
import { Product } from '../../types';

interface Props {
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateRoute?: (route: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const DashboardExploreSection: React.FC<Props> = ({
  onAddToCart,
  onSelectProduct,
  onNavigateRoute,
  onSelectCategory
}) => {
  const [activeCategory, setActiveCategory] = useState('mobiles');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categoryTabs = [
    { id: 'mobiles', label: 'Mobiles', icon: '📱' },
    { id: 'laptops', label: 'Laptops', icon: '💻' },
    { id: 'fashion', label: 'Fashion', icon: '👗', hasDropdown: true },
    { id: 'shoes', label: 'Shoes', icon: '👟' },
    { id: 'electronics', label: 'Electronics', icon: '🎧' },
    { id: 'appliances', label: 'Home Appliances', icon: '🧺' },
    { id: 'home_living', label: 'Home & Living', icon: '🛋️' },
    { id: 'beauty', label: 'Beauty', icon: '💄' },
    { id: 'more', label: 'More', icon: '🧸' }
  ];

  const popularMobiles = [
    {
      productId: 'apple-iphone-15-128gb',
      title: 'iPhone 15 (128GB)',
      subtitle: 'Apple',
      price: 64999,
      mrp: 79900,
      discountPct: 18,
      rating: 4.6,
      ratingCount: '12.5k',
      badge: 'Best Value',
      badgeColor: '#10b981',
      imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    },
    {
      productId: 'samsung-galaxy-s24',
      title: 'Samsung Galaxy S24',
      subtitle: 'Samsung | 256GB',
      price: 74999,
      mrp: 89999,
      discountPct: 17,
      rating: 4.6,
      ratingCount: '9.4k',
      badge: 'Top Rated',
      badgeColor: '#6366f1',
      imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&auto=format&fit=crop&q=80',
      store: 'flipkart' as const
    },
    {
      productId: 'oneplus-12r-5g',
      title: 'OnePlus 12R',
      subtitle: 'OnePlus | 16GB RAM',
      price: 39999,
      mrp: 42999,
      discountPct: 7,
      rating: 4.5,
      ratingCount: '8.1k',
      badge: 'Deal',
      badgeColor: '#10b981',
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    },
    {
      productId: 'redmi-note-13-pro',
      title: 'Redmi Note 13 Pro',
      subtitle: 'Xiaomi | 200MP Camera',
      price: 25999,
      mrp: 29999,
      discountPct: 13,
      rating: 4.3,
      ratingCount: '14.2k',
      badge: null,
      badgeColor: null,
      imageUrl: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&auto=format&fit=crop&q=80',
      store: 'meesho' as const
    },
    {
      productId: 'realme-12-pro-plus',
      title: 'realme 12 Pro',
      subtitle: 'Realme | Periscope Lens',
      price: 23999,
      mrp: 27999,
      discountPct: 14,
      rating: 4.3,
      ratingCount: '7.8k',
      badge: null,
      badgeColor: null,
      imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&auto=format&fit=crop&q=80',
      store: 'flipkart' as const
    },
    {
      productId: 'google-pixel-8',
      title: 'Google Pixel 8',
      subtitle: 'Google Tensor G3',
      price: 71999,
      mrp: 75999,
      discountPct: 5,
      rating: 4.5,
      ratingCount: '5.3k',
      badge: null,
      badgeColor: null,
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&auto=format&fit=crop&q=80',
      store: 'amazon' as const
    }
  ];

  const handleAction = (item: any) => {
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
      seller: item.subtitle,
      productUrl: '#',
      affiliateUrl: '#'
    };
    onAddToCart(prod, 1);
    setAddedIds((prev) => ({ ...prev, [item.productId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.productId]: false }));
    }, 1800);
  };

  return (
    <div style={{ width: '100%', marginBottom: '28px' }}>
      {/* 1. Header: Explore Products */}
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: '0 0 3px 0' }}>
          Explore Products
        </h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
          Discover the best deals across all categories
        </p>
      </div>

      {/* 2. Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '16px',
          scrollbarWidth: 'none'
        }}
      >
        {categoryTabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                if (onSelectCategory) onSelectCategory(tab.id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: isActive ? '1px solid #2563eb' : '1px solid var(--border-color, #e2e8f0)',
                background: isActive ? '#2563eb' : 'var(--bg-card, #ffffff)',
                color: isActive ? '#ffffff' : 'var(--text-main, #334155)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'var(--shadow-card, 0 1px 4px rgba(0,0,0,0.03))',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.hasDropdown && <ChevronDown size={13} />}
            </button>
          );
        })}
      </div>

      {/* 3. Section Header: Popular Mobiles */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}
      >
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
          Popular Mobiles
        </h3>
        <button
          type="button"
          onClick={() => {
            if (onNavigateRoute) onNavigateRoute('/categories');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px'
          }}
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* 4. Products Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: '12px',
          width: '100%'
        }}
      >
        {popularMobiles.map((item) => {
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
                  seller: item.subtitle,
                  productUrl: '#',
                  affiliateUrl: '#'
                };
                onSelectProduct(prod);
                if (onNavigateRoute) {
                  onNavigateRoute(`/product/${encodeURIComponent(item.store)}/${encodeURIComponent(item.productId)}`);
                }
              }}
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '14px',
                border: '1px solid var(--border-color, #e2e8f0)',
                boxShadow: 'var(--shadow-card, 0 2px 10px rgba(0,0,0,0.03))',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                padding: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card, 0 2px 10px rgba(0,0,0,0.03))';
              }}
            >
              {/* Badge if present */}
              {item.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    zIndex: 2,
                    background: item.badgeColor || '#10b981',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    letterSpacing: '0.2px'
                  }}
                >
                  {item.badge}
                </div>
              )}

              {/* Wishlist Heart */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 2,
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Heart size={13} color="#94a3b8" />
              </button>

              {/* Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: '115px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-subtle, #f8fafc)',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  padding: '6px'
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>

              {/* Title & Brand */}
              <h4
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-main, #0f172a)',
                  margin: '0 0 2px 0',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={item.title}
              >
                {item.title}
              </h4>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.subtitle}
              </div>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                <Star size={11} fill="#eab308" color="#eab308" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {item.rating}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  ({item.ratingCount})
                </span>
              </div>

              {/* Price & MRP */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  ₹{item.mrp.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981' }}>
                  {item.discountPct}% off
                </span>
              </div>

              {/* Action Button */}
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
                  color: isAdded ? '#ffffff' : 'var(--text-main, #1e293b)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '6px',
                  padding: '5px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isAdded ? (
                  <>
                    <Check size={11} />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={11} />
                    <span>Compare &amp; Buy</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
