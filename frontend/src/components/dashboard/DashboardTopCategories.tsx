import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  onSelectCategory: (categoryId: string) => void;
  onNavigateRoute?: (route: string) => void;
  onViewAllDeals?: () => void;
  language?: SupportedLanguage;
}

export const DashboardTopCategories: React.FC<Props> = ({
  onSelectCategory,
  onNavigateRoute,
  onViewAllDeals,
  language = 'en'
}) => {
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const topCategories = [
    {
      id: 'laptops',
      title: t.laptops,
      subtitle: language === 'kn' ? '₹24,990 ರಿಂದ' : language === 'hi' ? '₹24,990 से शुरू' : 'From ₹24,990',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'mobiles',
      title: t.mobiles,
      subtitle: language === 'kn' ? '₹6,999 ರಿಂದ' : language === 'hi' ? '₹6,999 से शुरू' : 'From ₹6,999',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'smartwatches',
      title: t.smartwatches,
      subtitle: language === 'kn' ? '₹1,299 ರಿಂದ' : language === 'hi' ? '₹1,299 से शुरू' : 'From ₹1,299',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'headphones',
      title: t.headphones,
      subtitle: language === 'kn' ? '₹899 ರಿಂದ' : language === 'hi' ? '₹899 से शुरू' : 'From ₹899',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'shoes',
      title: t.shoes,
      subtitle: language === 'kn' ? '₹799 ರಿಂದ' : language === 'hi' ? '₹799 से शुरू' : 'From ₹799',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 'fashion',
      title: t.fashion,
      subtitle: language === 'kn' ? 'ಕನಿಷ್ಠ 40% ರಿಯಾಯಿತಿ' : language === 'hi' ? 'न्यूनतम 40% छूट' : 'Min 40% Off',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=60'
    }
  ];

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {t.popularCategories}
          </h2>
          {onNavigateRoute && (
            <button
              type="button"
              onClick={() => onNavigateRoute('/categories')}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                color: 'var(--primary)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '3px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{language === 'kn' ? 'ಎಲ್ಲಾ 24+ ವರ್ಗಗಳು' : language === 'hi' ? 'सभी 24+ श्रेणियां' : 'All 24+ Categories'}</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (onViewAllDeals) onViewAllDeals();
            else if (onNavigateRoute) onNavigateRoute('/deals');
            else onSelectCategory('all');
          }}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px'
        }}
      >
        {topCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div
              style={{
                width: '100%',
                height: '90px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--img-bg)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={cat.image}
                alt={cat.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
              {cat.title}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 600, textAlign: 'center', marginTop: '2px' }}>
              {cat.subtitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
