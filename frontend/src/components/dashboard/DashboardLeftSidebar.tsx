import React from 'react';
import {
  Home,
  LayoutGrid,
  Tag,
  Package,
  Navigation,
  Heart,
  User,
  Globe,
  Sun,
  Moon,
  Mic
} from 'lucide-react';
import { TabType } from '../Navbar';
import { SupportedLanguage } from '../../i18n/translations';
import { useTheme } from '../../context/ThemeContext';

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
  onLanguageChange
}) => {
  const { theme, setTheme } = useTheme();

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: Home, route: '/' },
    { id: 'categories', label: 'All Categories', icon: LayoutGrid, route: '/categories' },
    { id: 'deals', label: 'Deals & Offers', icon: Tag, route: '/deals' },
    { id: 'orders', label: 'My Orders', icon: Package, route: '/orders' },
    { id: 'track', label: 'Track Order', icon: Navigation, route: '/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, route: '/account/wishlist' },
    { id: 'profile', label: 'Profile', icon: User, route: '/account' }
  ];

  const languagesList: { id: SupportedLanguage; label: string }[] = [
    { id: 'en', label: 'English' },
    { id: 'kn', label: 'ಕನ್ನಡ' },
    { id: 'hi', label: 'हिन्दी' }
  ];

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        flexShrink: 0
      }}
    >
      {/* 1. Main Navigation Menu Card */}
      <nav
        style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '16px 14px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
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
          const isProfile = item.id === 'profile' && (currentPath === '/account' || currentPath.startsWith('/account/') || activeTab === 'settings');

          const isActive = isHome || isCategories || isDeals || isOrders || isTrack || isWishlist || isProfile;

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
                } else if (item.id === 'profile' || item.id === 'wishlist') {
                  if (onNavigateRoute) onNavigateRoute('/account');
                  else onTabChange('settings');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                width: '100%',
                padding: '11px 16px',
                borderRadius: '12px',
                border: 'none',
                background: isActive
                  ? 'rgba(99, 102, 241, 0.12)'
                  : 'transparent',
                color: isActive ? '#4f46e5' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <Icon size={19} color={isActive ? '#4f46e5' : 'var(--text-muted)'} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 4px' }} />

        {/* 2. Languages Section */}
        <div style={{ padding: '0 8px 6px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '12px'
            }}
          >
            <Globe size={16} color="var(--text-muted)" />
            <span>Languages</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '4px' }}>
            {languagesList.map((lang) => {
              const isChecked = language === lang.id;
              return (
                <label
                  key={lang.id}
                  onClick={() => {
                    if (onLanguageChange) onLanguageChange(lang.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.86rem',
                    color: isChecked ? 'var(--text-main)' : 'var(--text-secondary)',
                    fontWeight: isChecked ? 600 : 400,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: isChecked ? '5px solid #4f46e5' : '1.5px solid var(--border-color)',
                      background: isChecked ? '#ffffff' : 'transparent',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  />
                  <span>{lang.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 4px' }} />

        {/* 3. Theme Section */}
        <div style={{ padding: '0 8px 6px 8px' }}>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '10px'
            }}
          >
            Theme
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-subtle, #f1f5f9)',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 0',
                borderRadius: '8px',
                border: 'none',
                background: theme === 'light' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: theme === 'light' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: theme === 'light' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                fontSize: '0.8rem',
                fontWeight: theme === 'light' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sun size={14} color={theme === 'light' ? '#4f46e5' : 'currentColor'} />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 0',
                borderRadius: '8px',
                border: 'none',
                background: theme === 'dark' ? 'var(--bg-card, #ffffff)' : 'transparent',
                color: theme === 'dark' ? 'var(--text-main)' : 'var(--text-muted)',
                boxShadow: theme === 'dark' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                fontSize: '0.8rem',
                fontWeight: theme === 'dark' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Moon size={14} color={theme === 'dark' ? '#6366f1' : 'currentColor'} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 4. Bottom Voice Shopping Promo Card */}
      <div
        onClick={onStartVoice}
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 55%, #312e81 100%)',
          borderRadius: '20px',
          padding: '24px 20px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 28px -6px rgba(30, 27, 75, 0.4)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: '1px solid rgba(129, 140, 248, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(30, 27, 75, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(30, 27, 75, 0.4)';
        }}
      >
        {/* Glow circle */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.25)',
            filter: 'blur(25px)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Glowing Mic Circle */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.4)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              marginBottom: '14px'
            }}
          >
            <Mic size={22} color="#ffffff" />
          </div>

          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.2px' }}>
            Voice Shopping
          </h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.4 }}>
            Just speak. We&apos;ll find it for you!
          </p>
        </div>

        {/* Ambient Wave Graphic at Bottom */}
        <svg
          viewBox="0 0 200 40"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '35px',
            opacity: 0.45,
            pointerEvents: 'none'
          }}
        >
          <path
            d="M0,25 C40,10 70,35 110,20 C150,5 170,30 200,15 L200,40 L0,40 Z"
            fill="rgba(56, 189, 248, 0.5)"
          />
          <path
            d="M0,30 C30,15 60,32 100,24 C140,16 160,35 200,20 L200,40 L0,40 Z"
            fill="rgba(99, 102, 241, 0.6)"
          />
        </svg>
      </div>
    </aside>
  );
};
