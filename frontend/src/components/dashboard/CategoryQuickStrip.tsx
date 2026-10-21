import React from 'react';
import {
  Laptop,
  Smartphone,
  Watch,
  Headphones,
  Tv,
  Footprints,
  Shirt,
  MoreHorizontal
} from 'lucide-react';
import { SupportedLanguage, translations } from '../../i18n/translations';

interface Props {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  language?: SupportedLanguage;
}

export const CategoryQuickStrip: React.FC<Props> = ({
  selectedCategory,
  onSelectCategory,
  language = 'en'
}) => {
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  const quickCategories = [
    { id: 'laptops', label: t.laptops, icon: Laptop, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
    { id: 'mobiles', label: t.mobiles, icon: Smartphone, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    { id: 'smartwatches', label: t.smartwatches, icon: Watch, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    { id: 'headphones', label: t.headphones, icon: Headphones, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.15)' },
    { id: 'appliances', label: t.appliances, icon: Tv, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
    { id: 'shoes', label: t.shoes, icon: Footprints, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    { id: 'fashion', label: t.fashion, icon: Shirt, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
    { id: 'all', label: t.allProducts, icon: MoreHorizontal, color: 'var(--text-muted)', bg: 'var(--bg-subtle)' }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
        gap: '12px',
        width: '100%',
        margin: '18px 0'
      }}
    >
      {quickCategories.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedCategory === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectCategory(item.id)}
            style={{
              background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
              border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '12px 6px 10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? '0 6px 16px var(--primary-glow)'
                : 'var(--shadow-card)',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }
            }}
          >
            {/* Colored icon circle */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color
              }}
            >
              <Icon size={20} />
            </div>

            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: isSelected ? 700 : 600,
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
