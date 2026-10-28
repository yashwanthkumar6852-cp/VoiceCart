import React from 'react';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onNavigateRoute?: (route: string) => void;
  language?: SupportedLanguage;
}

/* =========================================================================
   PIXEL-PERFECT 3D VECTOR ICONS MATCHING USER REFERENCE IMAGE
   ========================================================================= */

// 1. Mobiles: 3D Smartphone with dark metallic bezel & vibrant purple-blue display
const Mobiles3DIcon: React.FC = () => (
  <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
    <defs>
      <linearGradient id="mob-body" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="mob-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="35%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#818cf8" />
      </linearGradient>
      <linearGradient id="mob-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Outer Frame with metallic rim */}
    <rect x="7" y="2" width="20" height="34" rx="4.5" fill="url(#mob-body)" stroke="#475569" strokeWidth="0.8" />
    {/* Inner Screen */}
    <rect x="8.3" y="3.5" width="17.4" height="31" rx="3.5" fill="url(#mob-screen)" />
    {/* Abstract Screen Waves */}
    <path d="M8.3 19 C12 14, 17 25, 25.7 18 L25.7 34.5 L8.3 34.5 Z" fill="#2563eb" opacity="0.65" />
    <path d="M8.3 23 C14 18, 20 27, 25.7 22 L25.7 34.5 L8.3 34.5 Z" fill="#1d4ed8" opacity="0.75" />
    {/* Glass Corner Sheen */}
    <path d="M8.3 3.5 L21 3.5 L12 24 L8.3 24 Z" fill="url(#mob-sheen)" />
    {/* Dynamic Island / Notch */}
    <rect x="13.5" y="4.6" width="7" height="1.8" rx="0.9" fill="#020617" />
  </svg>
);

// 2. Laptops: 3D Open metallic laptop with vivid blue/violet wallpaper
const Laptops3DIcon: React.FC = () => (
  <svg width="40" height="36" viewBox="0 0 40 36" fill="none">
    <defs>
      <linearGradient id="lap-screen-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="50%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="lap-deck" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>
    {/* Screen Lid Frame */}
    <rect x="7" y="4" width="26" height="19" rx="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
    {/* Display Screen */}
    <rect x="8.5" y="5.5" width="23" height="16" rx="1.5" fill="url(#lap-screen-grad)" />
    {/* Screen wallpaper waves */}
    <path d="M8.5 16 C14 11, 23 21, 31.5 14 L31.5 21.5 L8.5 21.5 Z" fill="#1e1b4b" opacity="0.5" />
    <path d="M8.5 18 C15 14, 24 23, 31.5 17 L31.5 21.5 L8.5 21.5 Z" fill="#60a5fa" opacity="0.65" />
    {/* Web Camera */}
    <circle cx="20" cy="4.8" r="0.6" fill="#64748b" />
    {/* Keyboard Deck Base */}
    <polygon points="3,30 37,30 34,23 6,23" fill="url(#lap-deck)" stroke="#94a3b8" strokeWidth="0.6" />
    {/* Trackpad */}
    <rect x="17" y="25" width="6" height="3" rx="0.5" fill="#475569" opacity="0.5" />
    {/* Front Edge Lip */}
    <line x1="4" y1="30" x2="36" y2="30" stroke="#f1f5f9" strokeWidth="0.8" />
  </svg>
);

// 3. Fashion: 3D Pink crewneck short-sleeve T-shirt
const Fashion3DIcon: React.FC = () => (
  <svg width="38" height="36" viewBox="0 0 38 36" fill="none">
    <defs>
      <linearGradient id="tshirt-pink" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="55%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
    </defs>
    {/* T-Shirt Silhouette */}
    <path
      d="M13 5 C15 8.5, 23 8.5, 25 5 L33 9.5 L29 16.5 L26 14.5 L26 31 L12 31 L12 14.5 L9 16.5 L5 9.5 Z"
      fill="url(#tshirt-pink)"
      stroke="#be185d"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    {/* Crewneck Ribbed Collar */}
    <path d="M14.5 5.5 C16.5 9, 21.5 9, 23.5 5.5" fill="none" stroke="#fbcfe8" strokeWidth="1.6" strokeLinecap="round" />
    {/* Subtle Fabric Fold Accents */}
    <path d="M12 18 L14 31" stroke="#be185d" strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
    <path d="M26 18 L24 31" stroke="#be185d" strokeWidth="0.7" opacity="0.3" strokeLinecap="round" />
    <line x1="5.5" y1="10" x2="9" y2="16" stroke="#fbcfe8" strokeWidth="0.8" opacity="0.7" />
    <line x1="32.5" y1="10" x2="29" y2="16" stroke="#fbcfe8" strokeWidth="0.8" opacity="0.7" />
  </svg>
);

// 4. Shoes: 3D Blue athletic running shoe with white swoosh & chunky sole
const Shoes3DIcon: React.FC = () => (
  <svg width="40" height="34" viewBox="0 0 40 34" fill="none">
    <defs>
      <linearGradient id="sneaker-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Upper Body */}
    <path
      d="M7 21 C9 18, 15 13.5, 22 13 C26 13, 30 9, 34 9 C36.5 9, 38 11.5, 38 15 C38 19, 36 23, 36 24 L7 24 Z"
      fill="url(#sneaker-blue)"
      stroke="#1e40af"
      strokeWidth="0.8"
    />
    {/* Ankle Collar Padding */}
    <path d="M33 9.5 C35 9.5, 37.5 11, 37.5 14 L34.5 14 Z" fill="#93c5fd" />
    {/* White Laces */}
    <line x1="24" y1="12" x2="27" y2="11" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="26" y1="14.5" x2="29" y2="13.5" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="28" y1="17" x2="31" y2="16" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" />
    {/* Dynamic Swoosh / Wave */}
    <path
      d="M14 20 C19 20, 25 16, 33 13 C28 17.5, 23 20.5, 17 21.5 Z"
      fill="#ffffff"
    />
    {/* Chunky Running Outsole */}
    <path
      d="M5 24 C10 24, 34 24, 38 24 C38 26.5, 37 28.5, 34 28.5 C24 28.5, 10 28.5, 6 28.5 C5 28.5, 4.5 26.5, 5 24 Z"
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth="0.9"
    />
    {/* Sole Grip Lines */}
    <path d="M8 28.5 L34 28.5" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
  </svg>
);

// 5. Home & Living: 3D Cyan-Blue Plush Tufted Armchair
const HomeLiving3DIcon: React.FC = () => (
  <svg width="38" height="36" viewBox="0 0 38 36" fill="none">
    <defs>
      <linearGradient id="sofa-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
      <linearGradient id="cushion-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* Tufted Backrest */}
    <rect x="9" y="5" width="20" height="17" rx="4" fill="url(#sofa-grad)" stroke="#0e7490" strokeWidth="0.8" />
    {/* Tuft Buttons */}
    <circle cx="14" cy="11" r="1.1" fill="#083344" />
    <circle cx="19" cy="11" r="1.1" fill="#083344" />
    <circle cx="24" cy="11" r="1.1" fill="#083344" />
    {/* Seat Cushion */}
    <rect x="8" y="18" width="22" height="9" rx="3" fill="url(#cushion-grad)" stroke="#0369a1" strokeWidth="0.8" />
    {/* Left Armrest */}
    <rect x="5" y="14" width="6.5" height="13" rx="3.2" fill="url(#sofa-grad)" stroke="#0891b2" strokeWidth="0.8" />
    {/* Right Armrest */}
    <rect x="26.5" y="14" width="6.5" height="13" rx="3.2" fill="url(#sofa-grad)" stroke="#0891b2" strokeWidth="0.8" />
    {/* Wooden Feet */}
    <rect x="8" y="27" width="2.5" height="4" rx="1" fill="#475569" />
    <rect x="27.5" y="27" width="2.5" height="4" rx="1" fill="#475569" />
  </svg>
);

// 6. Electronics: 3D Blue Over-Ear Headphones
const Electronics3DIcon: React.FC = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <defs>
      <linearGradient id="headband" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="earcup" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Headband Arch */}
    <path
      d="M9 22 C9 11, 29 11, 29 22"
      fill="none"
      stroke="url(#headband)"
      strokeWidth="3.8"
      strokeLinecap="round"
    />
    {/* Inner Headband Cushion */}
    <path
      d="M12 15.5 C14.5 12, 23.5 12, 26 15.5"
      fill="none"
      stroke="#64748b"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Left Earcup */}
    <ellipse cx="8.5" cy="24" rx="3.8" ry="6.5" fill="url(#earcup)" stroke="#1e40af" strokeWidth="0.8" />
    <rect x="10" y="19" width="2.2" height="10" rx="1.1" fill="#0f172a" />
    <circle cx="8.5" cy="24" r="1.8" fill="#93c5fd" opacity="0.75" />
    {/* Right Earcup */}
    <ellipse cx="29.5" cy="24" rx="3.8" ry="6.5" fill="url(#earcup)" stroke="#1e40af" strokeWidth="0.8" />
    <rect x="25.8" y="19" width="2.2" height="10" rx="1.1" fill="#0f172a" />
    <circle cx="29.5" cy="24" r="1.8" fill="#93c5fd" opacity="0.75" />
  </svg>
);

// 7. Appliances: 3D Front-Loading Washing Machine with blue drum
const Appliances3DIcon: React.FC = () => (
  <svg width="36" height="38" viewBox="0 0 36 38" fill="none">
    <defs>
      <linearGradient id="washer-cab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <radialGradient id="drum-blue" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
    </defs>
    {/* Machine Cabinet */}
    <rect x="6" y="3" width="24" height="32" rx="4" fill="url(#washer-cab)" stroke="#64748b" strokeWidth="0.8" />
    {/* Top Control Panel */}
    <rect x="7.5" y="5" width="21" height="6" rx="1.5" fill="#f8fafc" />
    {/* Detergent Drawer */}
    <rect x="9" y="6.5" width="5.5" height="3" rx="0.6" fill="#cbd5e1" />
    {/* Dial Knob & Indicator */}
    <circle cx="20" cy="8" r="1.8" fill="#475569" />
    <circle cx="25.5" cy="8" r="1" fill="#10b981" />
    {/* Drum Door Chrome Ring */}
    <circle cx="18" cy="22.5" r="8.5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
    {/* Drum Blue Glass Center */}
    <circle cx="18" cy="22.5" r="6.5" fill="url(#drum-blue)" />
    {/* Glass Reflection Wave */}
    <path d="M15 19.5 C17 18.5, 20.5 19.5, 21.5 22" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 8. Beauty: 3D Glossy Pink Cosmetic Pump Bottle
const Beauty3DIcon: React.FC = () => (
  <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
    <defs>
      <linearGradient id="beauty-pink-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="60%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
    </defs>
    {/* Dispenser Pump Top */}
    <path d="M14 2 L22 2 L22 4.5 L19 4.5 L19 6.5 L17 6.5 L17 4.5 L13 4.5 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
    {/* Pump Neck Ring */}
    <rect x="14.5" y="6.5" width="5" height="3" rx="1" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
    {/* Pink Bottle Body */}
    <rect x="9.5" y="9.5" width="15" height="25" rx="5" fill="url(#beauty-pink-grad)" stroke="#be185d" strokeWidth="0.8" />
    {/* Center Label */}
    <rect x="12" y="15.5" width="10" height="12" rx="2" fill="#ffffff" opacity="0.9" />
    {/* Label Details */}
    <line x1="14" y1="18.5" x2="20" y2="18.5" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="15" y1="21.5" x2="19" y2="21.5" stroke="#ec4899" strokeWidth="0.8" strokeLinecap="round" />
    {/* Glossy Sheen */}
    <path d="M11 12 C11.5 11, 13 10.5, 14 10.5 L14 31 C12.5 30, 11 29, 11 27 Z" fill="#ffffff" opacity="0.25" />
  </svg>
);

// 9. Toys: 3D Honey-Brown Plush Teddy Bear
const Toys3DIcon: React.FC = () => (
  <svg width="36" height="38" viewBox="0 0 36 38" fill="none">
    <defs>
      <linearGradient id="bear-fur-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="bear-tan" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
    </defs>
    {/* Left & Right Ears */}
    <circle cx="10" cy="7" r="4.2" fill="url(#bear-fur-grad)" />
    <circle cx="10" cy="7" r="2.2" fill="url(#bear-tan)" />
    <circle cx="26" cy="7" r="4.2" fill="url(#bear-fur-grad)" />
    <circle cx="26" cy="7" r="2.2" fill="url(#bear-tan)" />
    {/* Bear Body */}
    <ellipse cx="18" cy="24" rx="9.5" ry="8.5" fill="url(#bear-fur-grad)" />
    <ellipse cx="18" cy="24" rx="5.8" ry="5.2" fill="url(#bear-tan)" />
    {/* Bear Head */}
    <circle cx="18" cy="13.5" r="8" fill="url(#bear-fur-grad)" stroke="#92400e" strokeWidth="0.6" />
    {/* Tan Snout */}
    <ellipse cx="18" cy="15.5" rx="4.5" ry="3.2" fill="url(#bear-tan)" />
    {/* Black Nose & Smile */}
    <ellipse cx="18" cy="14" rx="1.6" ry="1.1" fill="#0f172a" />
    <path d="M16.5 16 Q18 17.5 19.5 16" fill="none" stroke="#0f172a" strokeWidth="0.8" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="14.5" cy="12" r="1.2" fill="#0f172a" />
    <circle cx="14.8" cy="11.7" r="0.4" fill="#ffffff" />
    <circle cx="21.5" cy="12" r="1.2" fill="#0f172a" />
    <circle cx="21.8" cy="11.7" r="0.4" fill="#ffffff" />
    {/* Paws */}
    <circle cx="8" cy="21.5" r="3.4" fill="url(#bear-fur-grad)" />
    <circle cx="28" cy="21.5" r="3.4" fill="url(#bear-fur-grad)" />
  </svg>
);

// 10. More: 4 Soft Slate Tiles Grid
const More3DIcon: React.FC = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
    <rect x="6" y="6" width="9" height="9" rx="2.8" fill="#94a3b8" />
    <rect x="19" y="6" width="9" height="9" rx="2.8" fill="#64748b" />
    <rect x="6" y="19" width="9" height="9" rx="2.8" fill="#64748b" />
    <rect x="19" y="19" width="9" height="9" rx="2.8" fill="#94a3b8" />
  </svg>
);

export const CategoryQuickStrip: React.FC<Props> = ({
  selectedCategory,
  onSelectCategory,
  onNavigateRoute
}) => {
  const quickCategories = [
    {
      id: 'mobiles',
      label: 'Mobiles',
      icon: <Mobiles3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'laptops',
      label: 'Laptops',
      icon: <Laptops3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'fashion',
      label: 'Fashion',
      icon: <Fashion3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(253, 242, 248, 0.95) 0%, rgba(252, 231, 243, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'shoes',
      label: 'Shoes',
      icon: <Shoes3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'home_kitchen',
      label: 'Home & Living',
      icon: <HomeLiving3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(236, 254, 255, 0.95) 0%, rgba(207, 250, 254, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'electronics',
      label: 'Electronics',
      icon: <Electronics3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(238, 242, 255, 0.95) 0%, rgba(224, 231, 255, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'appliances',
      label: 'Appliances',
      icon: <Appliances3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'beauty',
      label: 'Beauty',
      icon: <Beauty3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(253, 242, 248, 0.95) 0%, rgba(252, 231, 243, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'toys',
      label: 'Toys',
      icon: <Toys3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(254, 243, 199, 0.9) 0%, rgba(255, 251, 235, 0.45) 70%, transparent 100%)'
    },
    {
      id: 'more',
      label: 'More',
      icon: <More3DIcon />,
      auraBg: 'radial-gradient(circle, rgba(241, 245, 249, 0.95) 0%, rgba(248, 250, 252, 0.45) 70%, transparent 100%)',
      isMore: true
    }
  ];

  return (
    <div
      className="category-quick-strip-container"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
        gap: '12px',
        width: '100%',
        margin: '22px 0 24px 0',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}
    >
      {quickCategories.map((item) => {
        const isSelected = selectedCategory === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.isMore) {
                if (onNavigateRoute) onNavigateRoute('/categories');
                else onSelectCategory('all');
              } else {
                onSelectCategory(item.id);
              }
            }}
            style={{
              background: '#ffffff',
              border: isSelected ? '2px solid #2563eb' : '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '20px',
              padding: '14px 6px 12px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? '0 6px 16px rgba(37, 99, 235, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '78px',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.06)';
              if (!isSelected) e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isSelected
                ? '0 6px 16px rgba(37, 99, 235, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.03)';
              e.currentTarget.style.borderColor = isSelected ? '#2563eb' : 'rgba(226, 232, 240, 0.8)';
            }}
          >
            {/* Soft Aura Circular Backdrop behind the 3D rendered item */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: item.auraBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {item.icon}
            </div>

            {/* Dark Bold Label matching reference */}
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: isSelected ? '#2563eb' : '#1e293b',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
                lineHeight: 1.2
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
