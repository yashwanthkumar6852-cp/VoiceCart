import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Zap,
  Headphones,
  Watch,
  Camera,
  Gamepad2,
  Shirt,
  ShoppingBag,
  Baby,
  Footprints,
  Briefcase,
  Home,
  Armchair,
  Heart,
  HeartPulse,
  ShoppingBasket,
  Smile,
  BookOpen,
  Dumbbell,
  Car,
  Search,
  ArrowLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { CATALOG_TAXONOMY, CategoryTaxonomy } from '../config/taxonomy';
import { SupportedLanguage, translations } from '../i18n/translations';

// Icon map for taxonomy categories
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Zap,
  Headphones,
  Watch,
  Camera,
  Gamepad2,
  Shirt,
  ShoppingBag,
  Baby,
  Footprints,
  Briefcase,
  Home,
  Armchair,
  Heart,
  HeartPulse,
  ShoppingBasket,
  Smile,
  BookOpen,
  Dumbbell,
  Car,
  Sparkles
};

// Exact color & gradient themes matching user reference screenshot
const CATEGORY_STYLE_MAP: Record<string, { color: string; bgGradient: string }> = {
  mobiles: {
    color: '#6366f1',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.16) 0%, rgba(99, 102, 241, 0.03) 60%, transparent 75%)'
  },
  laptops: {
    color: '#0284c7',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(2, 132, 199, 0.16) 0%, rgba(2, 132, 199, 0.03) 60%, transparent 75%)'
  },
  tablets: {
    color: '#ef4444',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 60%, transparent 75%)'
  },
  tvs: {
    color: '#10b981',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.03) 60%, transparent 75%)'
  },
  appliances: {
    color: '#f59e0b',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.16) 0%, rgba(245, 158, 11, 0.03) 60%, transparent 75%)'
  },
  audio_earbuds: {
    color: '#8b5cf6',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.16) 0%, rgba(139, 92, 246, 0.03) 60%, transparent 75%)'
  },
  smartwatches: {
    color: '#4f46e5',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(79, 70, 229, 0.16) 0%, rgba(79, 70, 229, 0.03) 60%, transparent 75%)'
  },
  cameras: {
    color: '#0891b2',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(8, 145, 178, 0.16) 0%, rgba(8, 145, 178, 0.03) 60%, transparent 75%)'
  },
  gaming: {
    color: '#e11d48',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(225, 29, 72, 0.16) 0%, rgba(225, 29, 72, 0.03) 60%, transparent 75%)'
  },
  fashion_men: {
    color: '#059669',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(5, 150, 105, 0.16) 0%, rgba(5, 150, 105, 0.03) 60%, transparent 75%)'
  },
  fashion_women: {
    color: '#ea580c',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.16) 0%, rgba(234, 88, 12, 0.03) 60%, transparent 75%)'
  },
  kids_clothing: {
    color: '#7c3aed',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.16) 0%, rgba(124, 58, 237, 0.03) 60%, transparent 75%)'
  },
  footwear: {
    color: '#4338ca',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(67, 56, 202, 0.16) 0%, rgba(67, 56, 202, 0.03) 60%, transparent 75%)'
  },
  bags_luggage: {
    color: '#0284c7',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(2, 132, 199, 0.16) 0%, rgba(2, 132, 199, 0.03) 60%, transparent 75%)'
  },
  home_kitchen: {
    color: '#e11d48',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(225, 29, 72, 0.16) 0%, rgba(225, 29, 72, 0.03) 60%, transparent 75%)'
  },
  furniture: {
    color: '#0d9488',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(13, 148, 136, 0.16) 0%, rgba(13, 148, 136, 0.03) 60%, transparent 75%)'
  },
  beauty_skincare: {
    color: '#d97706',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(217, 119, 6, 0.16) 0%, rgba(217, 119, 6, 0.03) 60%, transparent 75%)'
  },
  health_nutrition: {
    color: '#9333ea',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(147, 51, 234, 0.16) 0%, rgba(147, 51, 234, 0.03) 60%, transparent 75%)'
  },
  groceries: {
    color: '#2563eb',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0.03) 60%, transparent 75%)'
  },
  toys_baby: {
    color: '#06b6d4',
    bgGradient: 'radial-gradient(circle at 100% 0%, rgba(6, 182, 212, 0.16) 0%, rgba(6, 182, 212, 0.03) 60%, transparent 75%)'
  }
};

interface Props {
  onNavigateRoute: (route: string) => void;
  onSelectCategory: (categoryId: string, subCategoryId?: string) => void;
  language?: SupportedLanguage;
}

export const CategoriesPage: React.FC<Props> = ({
  onNavigateRoute,
  onSelectCategory,
  language = 'en'
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const filteredTaxonomy = useMemo(() => {
    if (!searchFilter.trim()) return CATALOG_TAXONOMY;
    const q = searchFilter.toLowerCase().trim();
    return CATALOG_TAXONOMY.filter((cat) => {
      const matchLabel = cat.label.toLowerCase().includes(q);
      const matchDesc = cat.description.toLowerCase().includes(q);
      const matchSub = cat.subCategories?.some((sub) => sub.label.toLowerCase().includes(q));
      return matchLabel || matchDesc || matchSub;
    });
  }, [searchFilter]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 80px 20px' }}>
      {/* 1. Header & Breadcrumbs matching reference */}
      <div style={{ marginBottom: '22px' }}>
        <button
          type="button"
          onClick={() => onNavigateRoute('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '0.86rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: '10px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
        >
          <ArrowLeft size={16} />
          <span>{language === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : language === 'hi' ? 'होम पर वापस जाएं' : 'Back to Home'}</span>
        </button>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.92rem',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.45
              }}
            >
              {language === 'kn'
                ? 'ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ಬೆಲೆ ಹೋಲಿಕೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿದ ಉತ್ಪನ್ನಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ.'
                : language === 'hi'
                ? 'अमेज़न इंडिया, फ्लिपकार्ट और मीशो पर रीयल-टाइम मूल्य तुलना के साथ सत्यापित उत्पादों को ब्राउज़ करें।'
                : 'Browse verified products across Amazon India, Flipkart, and Meesho with real-time price comparison.'}
            </p>
          </div>

          {/* Quick Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 16px',
              width: '100%',
              maxWidth: '340px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={language === 'kn' ? 'ವರ್ಗ ಹುಡುಕಿ...' : language === 'hi' ? 'श्रेणी खोजें...' : 'Filter categories...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.86rem',
                color: '#0f172a',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Exactly 4-Column Grid matching reference image */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '18px'
        }}
      >
        {filteredTaxonomy.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Sparkles;
          const styleConfig = CATEGORY_STYLE_MAP[cat.id] || {
            color: '#2563eb',
            bgGradient: 'radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0.03) 60%, transparent 75%)'
          };

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                padding: '20px 20px 16px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '260px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = styleConfig.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {/* Soft Corner Glow Aura (top right) matching reference image */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '180px',
                  height: '180px',
                  background: styleConfig.bgGradient,
                  pointerEvents: 'none'
                }}
              />

              <div>
                {/* Header: Icon + Category Name & Sub-categories count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: styleConfig.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: `0 4px 12px ${styleConfig.color}40`,
                      flexShrink: 0
                    }}
                  >
                    <Icon size={22} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.2
                      }}
                    >
                      {cat.label}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      {cat.subCategories?.length || 0} Sub-categories
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    lineHeight: 1.45,
                    margin: '0 0 14px 0',
                    minHeight: '34px'
                  }}
                >
                  {cat.description}
                </p>

                {/* Subcategories Pills: 4 Pills + "+1 more" */}
                {cat.subCategories && cat.subCategories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {cat.subCategories.slice(0, 4).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCategory(cat.id, sub.id);
                        }}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '4px 9px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          lineHeight: 1.2
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = styleConfig.color;
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = styleConfig.color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                    {cat.subCategories.length > 4 && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#94a3b8',
                          padding: '4px 6px',
                          fontWeight: 600,
                          alignSelf: 'center'
                        }}
                      >
                        +{cat.subCategories.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Footer: Browse Products >  &  Amazon • Flipkart • Meesho */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9'
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: styleConfig.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Browse Products</span>
                  <ChevronRight size={14} />
                </span>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  Amazon • Flipkart • Meesho
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTaxonomy.length === 0 && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            marginTop: '20px'
          }}
        >
          <Search size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            No matching categories found
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
            Try searching with a different keyword like "mobiles", "audio", or "fashion".
          </p>
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Show All Categories
          </button>
        </div>
      )}
    </div>
  );
};
