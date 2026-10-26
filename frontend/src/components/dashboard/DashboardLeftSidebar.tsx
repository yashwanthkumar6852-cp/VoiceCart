import React, { useState } from 'react';
import {
  Home,
  LayoutGrid,
  Tag,
  Package,
  Navigation,
  Heart,
  Mic,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TabType } from '../Navbar';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onStartVoice: () => void;
  onNavigateRoute?: (route: string) => void;
  currentPath?: string;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  onFilterChange?: (filters: any) => void;
}

export const DashboardLeftSidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onSelectCategory,
  onStartVoice,
  onNavigateRoute,
  currentPath = '/',
  language = 'en',
  onFilterChange
}) => {
  // Filters State
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number>(200000);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [availability, setAvailability] = useState<string[]>(['in_stock']);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home, route: '/' },
    { id: 'categories', label: 'All Categories', icon: LayoutGrid, route: '/categories' },
    { id: 'deals', label: 'Deals & Offers', icon: Tag, route: '/deals' },
    { id: 'orders', label: 'My Orders', icon: Package, route: '/orders' },
    { id: 'track', label: 'Track Order', icon: Navigation, route: '/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, route: '/account/wishlist' }
  ];

  const brandOptions = [
    'Apple',
    'Samsung',
    'OnePlus',
    'Xiaomi',
    'Realme',
    'boAt',
    'Sony',
    'Asus',
    'Nike'
  ];

  const visibleBrands = showAllBrands ? brandOptions : brandOptions.slice(0, 5);

  const toggleBrand = (b: string) => {
    const next = selectedBrands.includes(b)
      ? selectedBrands.filter((item) => item !== b)
      : [...selectedBrands, b];
    setSelectedBrands(next);
    if (onFilterChange) onFilterChange({ brands: next, priceMax, selectedRatings, availability, selectedDiscounts });
  };

  const toggleRating = (r: number) => {
    const next = selectedRatings.includes(r)
      ? selectedRatings.filter((item) => item !== r)
      : [...selectedRatings, r];
    setSelectedRatings(next);
    if (onFilterChange) onFilterChange({ brands: selectedBrands, priceMax, selectedRatings: next, availability, selectedDiscounts });
  };

  const toggleDiscount = (d: number) => {
    const next = selectedDiscounts.includes(d)
      ? selectedDiscounts.filter((item) => item !== d)
      : [...selectedDiscounts, d];
    setSelectedDiscounts(next);
    if (onFilterChange) onFilterChange({ brands: selectedBrands, priceMax, selectedRatings, availability, selectedDiscounts: next });
  };

  const toggleAvailability = (a: string) => {
    const next = availability.includes(a)
      ? availability.filter((item) => item !== a)
      : [...availability, a];
    setAvailability(next);
    if (onFilterChange) onFilterChange({ brands: selectedBrands, priceMax, selectedRatings, availability: next, selectedDiscounts });
  };

  const handleClearAll = () => {
    setSelectedBrands([]);
    setPriceMax(200000);
    setSelectedRatings([]);
    setAvailability([]);
    setSelectedDiscounts([]);
    if (onFilterChange) onFilterChange({});
  };

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
        flexShrink: 0
      }}
    >
      {/* 1. Main Navigation Menu Card */}
      <nav
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '18px',
          padding: '12px 10px',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isHome = item.id === 'home' && (currentPath === '/' || !currentPath) && activeTab === 'home';
          const isCategories = item.id === 'categories' && currentPath === '/categories';
          const isDeals = item.id === 'deals' && (currentPath === '/deals' || currentPath === '/deals-offers');
          const isOrders = item.id === 'orders' && (currentPath === '/orders' || activeTab === 'orders');
          const isTrack = item.id === 'track' && currentPath.includes('/orders');
          const isWishlist = item.id === 'wishlist' && currentPath.includes('wishlist');

          const isActive = isHome || isCategories || isDeals || isOrders || isTrack || isWishlist;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'home') {
                  if (onNavigateRoute) onNavigateRoute('/');
                  onTabChange('home');
                  onSelectCategory('all');
                } else if (item.id === 'categories') {
                  if (onNavigateRoute) onNavigateRoute('/categories');
                } else if (item.id === 'deals') {
                  if (onNavigateRoute) onNavigateRoute('/deals');
                } else if (item.id === 'orders' || item.id === 'track') {
                  if (onNavigateRoute) onNavigateRoute('/orders');
                  else onTabChange('orders');
                } else if (item.id === 'wishlist') {
                  if (onNavigateRoute) onNavigateRoute('/account');
                  else onTabChange('settings');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'rgba(37, 99, 235, 0.09)'
                  : 'transparent',
                color: isActive ? '#2563eb' : 'var(--text-secondary, #475569)',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-subtle, #f8fafc)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary, #475569)';
                }
              }}
            >
              <Icon size={18} color={isActive ? '#2563eb' : 'var(--text-muted, #94a3b8)'} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. Filters Card */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '18px',
          padding: '18px 16px',
          boxShadow: 'var(--shadow-card, 0 4px 20px rgba(0,0,0,0.04))',
          border: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header: Filters + Clear All */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
            Filters
          </h3>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 4px'
            }}
          >
            Clear All
          </button>
        </div>

        {/* Filter Section: Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Brand
            </span>
            <ChevronUp size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleBrands.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: isChecked ? 'var(--text-main, #0f172a)' : 'var(--text-secondary, #64748b)',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBrand(brand)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      accentColor: '#2563eb',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{brand}</span>
                </label>
              );
            })}
            <button
              type="button"
              onClick={() => setShowAllBrands(!showAllBrands)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                padding: '2px 0',
                marginTop: '2px'
              }}
            >
              {showAllBrands ? '- Less' : '+ More'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)' }} />

        {/* Filter Section: Price Range */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Price Range
            </span>
            <ChevronUp size={14} color="#94a3b8" />
          </div>
          <input
            type="range"
            min="0"
            max="200000"
            step="2000"
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#2563eb',
              cursor: 'pointer',
              marginBottom: '4px'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
            <span>₹0</span>
            <span>₹{priceMax.toLocaleString('en-IN')}{priceMax >= 200000 ? '+' : ''}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)' }} />

        {/* Filter Section: Rating */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Rating
            </span>
            <ChevronUp size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[4, 3, 2].map((stars) => {
              const isChecked = selectedRatings.includes(stars);
              return (
                <label
                  key={stars}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: isChecked ? 'var(--text-main, #0f172a)' : 'var(--text-secondary, #64748b)',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRating(stars)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      accentColor: '#2563eb',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ color: '#eab308' }}>★</span>
                    <span>{stars} &amp; above</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)' }} />

        {/* Filter Section: Availability */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Availability
            </span>
            <ChevronUp size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'in_stock', label: 'In Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' }
            ].map((avail) => {
              const isChecked = availability.includes(avail.id);
              return (
                <label
                  key={avail.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: isChecked ? 'var(--text-main, #0f172a)' : 'var(--text-secondary, #64748b)',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAvailability(avail.id)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      accentColor: '#2563eb',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{avail.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)' }} />

        {/* Filter Section: Discount */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Discount
            </span>
            <ChevronDown size={14} color="#94a3b8" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[10, 20, 30].map((disc) => {
              const isChecked = selectedDiscounts.includes(disc);
              return (
                <label
                  key={disc}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: isChecked ? 'var(--text-main, #0f172a)' : 'var(--text-secondary, #64748b)',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDiscount(disc)}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      accentColor: '#2563eb',
                      cursor: 'pointer'
                    }}
                  />
                  <span>{disc}% and above</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Voice Shopping Promo Card */}
      <div
        onClick={onStartVoice}
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
          borderRadius: '18px',
          padding: '20px 18px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -4px rgba(37, 99, 235, 0.4)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 14px 28px -4px rgba(37, 99, 235, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(37, 99, 235, 0.4)';
        }}
      >
        {/* Glow circle background */}
        <div
          style={{
            position: 'absolute',
            top: '-25px',
            right: '-25px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 2 }}>
          {/* Glowing Mic Circle */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255, 255, 255, 0.35)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              flexShrink: 0
            }}
          >
            <Mic size={20} color="#ffffff" />
          </div>

          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
              Voice Shopping
            </h4>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.35 }}>
              Just speak. We&apos;ll find it for you!
            </p>
          </div>
        </div>

        {/* Wave Graphic at Bottom */}
        <svg
          viewBox="0 0 200 30"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '24px',
            opacity: 0.35,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M0,15 C40,5 70,25 110,12 C150,2 170,22 200,8 L200,30 L0,30 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </aside>
  );
};
