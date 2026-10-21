import React from 'react';
import {
  Home,
  LayoutGrid,
  Tag,
  Package,
  User,
  Laptop,
  Smartphone,
  Watch,
  Headphones,
  Tv,
  Footprints,
  Shirt,
  Cpu,
  BookOpen,
  Gamepad2,
  Mic,
  ArrowRight
} from 'lucide-react';
import { TabType } from '../Navbar';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onStartVoice: () => void;
  onNavigateRoute?: (route: string) => void;
  language?: SupportedLanguage;
}

export const DashboardLeftSidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  onSelectCategory,
  onStartVoice,
  onNavigateRoute,
  language = 'en'
}) => {
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const mainNavItems = [
    { id: 'home', label: t.home, icon: Home, tab: 'home' as TabType },
    { id: 'categories', label: t.categories, icon: LayoutGrid, tab: 'home' as TabType },
    { id: 'deals', label: t.dealsAndOffers, icon: Tag, tab: 'home' as TabType },
    { id: 'orders', label: t.myOrders, icon: Package, tab: 'orders' as TabType },
    { id: 'profile', label: t.myAccount, icon: User, tab: 'settings' as TabType }
  ];

  const categoryItems = [
    { id: 'laptops', label: t.laptops, icon: Laptop },
    { id: 'mobiles', label: t.mobiles, icon: Smartphone },
    { id: 'smartwatches', label: t.smartwatches, icon: Watch },
    { id: 'headphones', label: t.headphones, icon: Headphones },
    { id: 'appliances', label: t.appliances, icon: Tv },
    { id: 'shoes', label: t.shoes, icon: Footprints },
    { id: 'fashion', label: t.fashion, icon: Shirt },
    { id: 'electronics', label: t.electronics, icon: Cpu },
    { id: 'books', label: t.books, icon: BookOpen },
    { id: 'toys', label: t.toys, icon: Gamepad2 }
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
      {/* 1. Main Navigation Menu */}
      <nav
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '12px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'home' && activeTab === 'home'
              ? true
              : item.id === 'orders' && activeTab === 'orders'
              ? true
              : item.id === 'profile' && activeTab === 'settings'
              ? true
              : false;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'categories' || item.id === 'deals') {
                  onSelectCategory('all');
                  onTabChange('home');
                } else if (item.id === 'profile' && onNavigateRoute) {
                  onNavigateRoute('/account');
                } else {
                  onTabChange(item.tab);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.88rem',
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
              <Icon size={18} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. Shop by Category Section */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            padding: '4px 8px 8px 8px',
            letterSpacing: '0.2px'
          }}
        >
          {t.shopByCategory}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {categoryItems.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onTabChange('home');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.84rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={16} color={isSelected ? '#ffffff' : 'var(--text-muted)'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Voice Assistant Promo Card */}
      <div
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
          color: '#ffffff',
          padding: '18px 16px',
          boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Mic size={18} color="#ffffff" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>VoiceCart AI</span>
        </div>

        <p style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4, margin: 0 }}>
          {t.heroVoiceSub}
        </p>

        <button
          type="button"
          onClick={onStartVoice}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#ffffff',
            color: '#312e81',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <span>{t.startVoiceShopping}</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  );
};
