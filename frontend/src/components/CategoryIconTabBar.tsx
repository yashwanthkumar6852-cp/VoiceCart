import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CATALOG_TAXONOMY, findCategoryTaxonomy } from '../config/taxonomy';

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export const CATEGORY_ITEMS: CategoryItem[] = [
  { id: 'all', label: 'For You', icon: Sparkles },
  { id: 'mobiles', label: 'Mobiles', icon: Smartphone },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'tablets', label: 'Tablets', icon: Tablet },
  { id: 'tvs', label: 'TVs', icon: Tv },
  { id: 'appliances', label: 'Appliances', icon: Zap },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'smartwatches', label: 'Smartwatches', icon: Watch },
  { id: 'cameras', label: 'Cameras', icon: Camera },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'fashion_men', label: 'Men Fashion', icon: Shirt },
  { id: 'fashion_women', label: 'Women Fashion', icon: ShoppingBag },
  { id: 'kids', label: 'Kids & Baby', icon: Baby },
  { id: 'footwear', label: 'Footwear', icon: Footprints },
  { id: 'bags', label: 'Bags & Luggage', icon: Briefcase },
  { id: 'home_kitchen', label: 'Home & Kitchen', icon: Home },
  { id: 'furniture', label: 'Furniture', icon: Armchair },
  { id: 'beauty', label: 'Beauty', icon: Heart },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'groceries', label: 'Groceries', icon: ShoppingBasket },
  { id: 'toys', label: 'Toys & Games', icon: Smile },
  { id: 'books_stationery', label: 'Books', icon: BookOpen },
  { id: 'sports', label: 'Sports & Fitness', icon: Dumbbell },
  { id: 'auto', label: 'Automotive', icon: Car }
];

interface Props {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  selectedSubCategory?: string;
  onSelectSubCategory?: (subCategoryId: string) => void;
  lastUpdated?: string | null;
}

export const CategoryIconTabBar: React.FC<Props> = ({
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  lastUpdated
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const subCategoryScrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Normalize selected category ID
  const activeId = selectedCategory === 'for_you' ? 'all' : (selectedCategory || 'all');
  const activeTaxonomy = findCategoryTaxonomy(activeId);

  // Check scroll position for arrows & edge fade
  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  // Smooth scroll active tab into view
  useEffect(() => {
    const btn = tabRefs.current[activeId];
    if (btn && scrollContainerRef.current) {
      btn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeId]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
  };

  // Keyboard navigation (ArrowLeft, ArrowRight, Home, End)
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % CATEGORY_ITEMS.length;
      const nextId = CATEGORY_ITEMS[nextIndex].id;
      onSelectCategory(nextId);
      tabRefs.current[nextId]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + CATEGORY_ITEMS.length) % CATEGORY_ITEMS.length;
      const prevId = CATEGORY_ITEMS[prevIndex].id;
      onSelectCategory(prevId);
      tabRefs.current[prevId]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstId = CATEGORY_ITEMS[0].id;
      onSelectCategory(firstId);
      tabRefs.current[firstId]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastId = CATEGORY_ITEMS[CATEGORY_ITEMS.length - 1].id;
      onSelectCategory(lastId);
      tabRefs.current[lastId]?.focus();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--bg-card, #ffffff)',
        borderBottom: '1px solid var(--border-color, #f0f0f0)',
        margin: '0 0 16px 0',
        padding: '6px 16px 4px 16px',
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
        {/* Left Scroll Arrow (Desktop) */}
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => handleScroll('left')}
            style={{
              position: 'absolute',
              left: '-8px',
              top: '36px',
              transform: 'translateY(-50%)',
              zIndex: 30,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #ccd0d5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main, #1c1e21)'
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Right Scroll Arrow (Desktop) */}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => handleScroll('right')}
            style={{
              position: 'absolute',
              right: '-8px',
              top: '36px',
              transform: 'translateY(-50%)',
              zIndex: 30,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #ccd0d5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-main, #1c1e21)'
            }}
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Left / Right Gradient Fade Overlays */}
        {canScrollLeft && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(to right, var(--bg-card, #ffffff), transparent)',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          />
        )}
        {canScrollRight && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(to left, var(--bg-card, #ffffff), transparent)',
              zIndex: 20,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Horizontal Category Tab List */}
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Shopping Categories"
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '6px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {CATEGORY_ITEMS.map((cat, idx) => {
            const isSelected = activeId === cat.id;
            const IconComponent = cat.icon;

            return (
              <button
                key={cat.id}
                ref={(el) => (tabRefs.current[cat.id] = el)}
                role="tab"
                id={`category-tab-${cat.id}`}
                aria-selected={isSelected}
                aria-controls={`category-panel-${cat.id}`}
                tabIndex={isSelected ? 0 : -1}
                title={cat.label}
                onClick={() => {
                  onSelectCategory(cat.id);
                  if (onSelectSubCategory) onSelectSubCategory('all');
                }}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px 10px 10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  minWidth: '76px',
                  maxWidth: '110px',
                  transition: 'transform 0.18s ease, color 0.18s ease'
                }}
              >
                {/* Two-Tone Icon Container */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected
                      ? '#DCE9FF'
                      : 'var(--bg-subtle, #f0f2f5)',
                    boxShadow: isSelected
                      ? '0 4px 12px rgba(40, 116, 240, 0.2)'
                      : 'none',
                    position: 'relative',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#FFC107',
                      opacity: isSelected ? 0.35 : 0.2,
                      top: '8px',
                      right: '8px',
                      pointerEvents: 'none'
                    }}
                  />
                  <IconComponent
                    size={24}
                    color={isSelected ? '#1877f2' : 'var(--text-main, #334155)'}
                    strokeWidth={isSelected ? 2.3 : 1.9}
                  />
                </div>

                {/* Tab Label */}
                <span
                  style={{
                    fontSize: '0.80rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#1877f2' : 'var(--text-main, #1c1e21)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '92px',
                    lineHeight: 1.2
                  }}
                >
                  {cat.label}
                </span>

                {/* Blue Indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '12px',
                      right: '12px',
                      height: '3px',
                      borderRadius: '3px 3px 0 0',
                      background: '#1877f2',
                      boxShadow: '0 -1px 6px rgba(24, 119, 242, 0.4)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-Category Chips Row (Shown when active category has subcategories) */}
        {activeTaxonomy && activeTaxonomy.subCategories.length > 0 && onSelectSubCategory && (
          <div
            ref={subCategoryScrollRef}
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingTop: '8px',
              paddingBottom: '4px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <button
              type="button"
              onClick={() => onSelectSubCategory('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: !selectedSubCategory || selectedSubCategory === 'all' ? 700 : 500,
                border: '1px solid',
                borderColor: !selectedSubCategory || selectedSubCategory === 'all' ? '#1877f2' : 'var(--border-color, #cbd5e1)',
                background: !selectedSubCategory || selectedSubCategory === 'all' ? '#1877f2' : 'var(--bg-subtle, #f8fafc)',
                color: !selectedSubCategory || selectedSubCategory === 'all' ? '#ffffff' : 'var(--text-main, #334155)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              All {activeTaxonomy.label}
            </button>
            {activeTaxonomy.subCategories.map((sub) => {
              const isSubActive = selectedSubCategory === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onSelectSubCategory(sub.id)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '0.78rem',
                    fontWeight: isSubActive ? 700 : 500,
                    border: '1px solid',
                    borderColor: isSubActive ? '#1877f2' : 'var(--border-color, #cbd5e1)',
                    background: isSubActive ? '#1877f2' : 'var(--bg-subtle, #f8fafc)',
                    color: isSubActive ? '#ffffff' : 'var(--text-main, #334155)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
