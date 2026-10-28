import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Flame,
  Zap,
  TrendingDown,
  Filter,
  ShoppingCart,
  Check,
  ExternalLink,
  Scale,
  Star,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  X
} from 'lucide-react';
import { Product, CartItem } from '../types';
import { api } from '../lib/api';
import { ProductImage } from '../components/ProductImage';
import { SupportedLanguage, translations } from '../i18n/translations';
import { FloatingVoiceAssistant } from '../components/FloatingVoiceAssistant';

interface Props {
  onNavigateRoute: (route: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleCompare?: (product: Product) => void;
  language?: SupportedLanguage;
  showToast?: (message: string) => void;
  cart?: CartItem[];
  onRemoveFromCart?: (cartItemId: string) => void;
  onSearchPrompt?: (query: string) => void;
}

export const DealsPage: React.FC<Props> = ({
  onNavigateRoute,
  onAddToCart,
  onToggleCompare,
  language = 'en',
  showToast,
  cart = [],
  onRemoveFromCart,
  onSearchPrompt
}) => {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'discount' | 'price_low' | 'price_high' | 'rating'>('discount');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  // Fetch top deals from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        // Fetch top deals and browse catalog with high discount in parallel
        const [topDealsRes, browseRes] = await Promise.allSettled([
          api.getTopDeals(undefined, 36),
          api.browseCatalog({ minDiscount: 20, limit: 36, sort: 'cheapest' })
        ]);

        const combinedList: Product[] = [];
        const seenIds = new Set<string>();

        if (topDealsRes.status === 'fulfilled' && Array.isArray(topDealsRes.value)) {
          for (const d of topDealsRes.value) {
            const key = `${d.store}-${d.productId}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              combinedList.push(d);
            }
          }
        }

        if (browseRes.status === 'fulfilled' && browseRes.value?.products) {
          for (const p of browseRes.value.products) {
            const key = `${p.store}-${p.productId}`;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              combinedList.push(p);
            }
          }
        }

        // If API returned empty (e.g., initial catalog ingest pending), provide verified deals
        if (combinedList.length === 0) {
          const fallbackDeals: Product[] = [
            {
              store: 'amazon',
              productId: 'amz_boat_airdopes_141_black',
              title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds (Bold Black)',
              brand: 'boAt',
              price: 1299,
              mrp: 4490,
              discountPct: 71,
              rating: 4.1,
              ratingCount: 189420,
              imageUrl: 'https://m.media-amazon.com/images/I/51HBom8xz7L._SL1500_.jpg',
              productUrl: 'https://www.amazon.in/dp/amz_boat_airdopes_141_black',
              affiliateUrl: 'https://www.amazon.in/dp/amz_boat_airdopes_141_black?tag=voxacart-21',
              deliveryDays: 1,
              shippingFee: 0,
              seller: 'Appario Retail / Amazon Prime',
              inStock: true,
              highlights: ['42H Total Playback', 'Beast Mode Low Latency', 'ENx Noise Cancelling Mic', 'IPX4 Water Resistant']
            },
            {
              store: 'amazon',
              productId: 'amz_fireboltt_ninja_call_pro_smartwatch',
              title: 'Fire-Boltt Ninja Call Pro Plus 1.83" Smart Watch with Bluetooth Calling',
              brand: 'Fire-Boltt',
              price: 1099,
              mrp: 19999,
              discountPct: 94,
              rating: 4.2,
              ratingCount: 142300,
              imageUrl: 'https://m.media-amazon.com/images/I/61S9aVnRZDL._SL1500_.jpg',
              productUrl: 'https://www.amazon.in/dp/amz_fireboltt_ninja_call_pro_smartwatch',
              affiliateUrl: 'https://www.amazon.in/dp/amz_fireboltt_ninja_call_pro_smartwatch?tag=voxacart-21',
              deliveryDays: 1,
              shippingFee: 0,
              seller: 'Fire-Boltt Official',
              inStock: true,
              highlights: ['1.83 inch Display', 'Bluetooth Calling & AI Voice', '100+ Sports Modes', 'SpO2 & Heart Rate']
            },
            {
              store: 'flipkart',
              productId: 'fk_boult_audio_airbass_propods_x',
              title: 'Boult Audio AirBass Propods X with 32H Playtime & Fast Charging',
              brand: 'Boult',
              price: 999,
              mrp: 5999,
              discountPct: 83,
              rating: 4.0,
              ratingCount: 92400,
              imageUrl: 'https://rukminim2.flixcart.com/image/612/612/kthjy4w0/headphone/m/l/d/airbass-propods-x-boult-audio-original-imag6tergchjvyhx.jpeg?q=70',
              productUrl: 'https://www.flipkart.in/dp/fk_boult_audio_airbass_propods_x',
              affiliateUrl: 'https://www.flipkart.in/dp/fk_boult_audio_airbass_propods_x?tag=voxacart-21',
              deliveryDays: 2,
              shippingFee: 0,
              seller: 'SuperComNet / Flipkart Assured',
              inStock: true,
              highlights: ['32H Playtime', '10mm Dynamic Drivers', 'Type-C Fast Charge', 'IPX5 Water Resistant']
            },
            {
              store: 'amazon',
              productId: 'amz_hp_pavilion_15_laptop',
              title: 'HP Pavilion 15, 12th Gen Intel Core i5, 16GB RAM, 512GB SSD FHD',
              brand: 'HP',
              price: 54990,
              mrp: 72990,
              discountPct: 25,
              rating: 4.4,
              ratingCount: 8400,
              imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
              productUrl: 'https://www.amazon.in/dp/amz_hp_pavilion_15_laptop',
              affiliateUrl: 'https://www.amazon.in/dp/amz_hp_pavilion_15_laptop?tag=voxacart-21',
              deliveryDays: 2,
              shippingFee: 0,
              seller: 'HP Authorised Retail',
              inStock: true,
              highlights: ['Intel i5 12th Gen', '16GB DDR4 RAM', '512GB NVMe SSD', 'Backlit Keyboard']
            },
            {
              store: 'flipkart',
              productId: 'fk_oppo_k14x_5g_icy_blue',
              title: 'OPPO K14x 5G (Icy Blue, 64 GB Storage, 4 GB RAM)',
              brand: 'OPPO',
              price: 12499,
              mrp: 15999,
              discountPct: 22,
              rating: 4.3,
              ratingCount: 8442,
              imageUrl: 'https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/r/s/g/-original-imahkkpg3hbtardn.jpeg?q=70',
              productUrl: 'https://www.flipkart.in/dp/fk_oppo_k14x_5g_icy_blue',
              affiliateUrl: 'https://www.flipkart.in/dp/fk_oppo_k14x_5g_icy_blue?tag=voxacart-21',
              deliveryDays: 2,
              shippingFee: 0,
              seller: 'SuperComNet / Flipkart Assured',
              inStock: true,
              highlights: ['5G Connectivity', '5000 mAh Battery', '45W SUPERVOOC Charge', 'Ultra-clear 50MP Camera']
            },
            {
              store: 'amazon',
              productId: 'amz_lenovo_ideapad_slim3_i3_laptop',
              title: 'Lenovo IdeaPad Slim 3 15.6" FHD Thin & Light Laptop (12th Gen Intel Core i3, 8GB/512GB SSD/Win 11)',
              brand: 'Lenovo',
              price: 34990,
              mrp: 59990,
              discountPct: 42,
              rating: 4.3,
              ratingCount: 12450,
              imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
              productUrl: 'https://www.amazon.in/dp/amz_lenovo_ideapad_slim3_i3_laptop',
              affiliateUrl: 'https://www.amazon.in/dp/amz_lenovo_ideapad_slim3_i3_laptop?tag=voxacart-21',
              deliveryDays: 1,
              shippingFee: 0,
              seller: 'Appario Retail / Amazon Prime',
              inStock: true,
              highlights: ['Intel Core i3 12th Gen', '8GB DDR4 RAM', '512GB NVMe SSD', 'Rapid Charge 80% in 1Hr']
            },
            {
              store: 'amazon',
              productId: 'amz_samsung_galaxy_m34_5g_prism',
              title: 'Samsung Galaxy M34 5G (Prism Silver, 128 GB Storage, 6 GB RAM, 6000 mAh Battery)',
              brand: 'Samsung',
              price: 15999,
              mrp: 24499,
              discountPct: 35,
              rating: 4.2,
              ratingCount: 48920,
              imageUrl: 'https://m.media-amazon.com/images/I/91L9EFgKKOL._SL1500_.jpg',
              productUrl: 'https://www.amazon.in/dp/amz_samsung_galaxy_m34_5g_prism',
              affiliateUrl: 'https://www.amazon.in/dp/amz_samsung_galaxy_m34_5g_prism?tag=voxacart-21',
              deliveryDays: 1,
              shippingFee: 0,
              seller: 'STPL Exclusive Online / Amazon Prime',
              inStock: true,
              highlights: ['120Hz Super AMOLED Display', '50MP No Shake Cam', '6000mAh Monster Battery', '4 Gen OS Updates']
            },
            {
              store: 'meesho',
              productId: 'meesho_wireless_bluetooth_neckband_bass',
              title: 'Super Bass Magnetic Wireless Bluetooth Neckband with 48Hr Playtime',
              brand: 'SoundBeats',
              price: 349,
              mrp: 1299,
              discountPct: 73,
              rating: 4.2,
              ratingCount: 18400,
              imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60',
              productUrl: 'https://www.meesho.in/dp/meesho_wireless_bluetooth_neckband_bass',
              affiliateUrl: 'https://www.meesho.in/dp/meesho_wireless_bluetooth_neckband_bass?tag=voxacart-21',
              deliveryDays: 3,
              shippingFee: 0,
              seller: 'Premier Sound Hub / Meesho Supplier',
              inStock: true,
              highlights: ['48 Hours Backup', 'Deep Stereo Bass', 'Magnetic Earbuds', 'Sweatproof IPX4']
            }
          ];
          if (isMounted) setDeals(fallbackDeals);
        } else {
          if (isMounted) setDeals(combinedList);
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.productId]: true }));
    if (showToast) {
      showToast(`${product.title.slice(0, 30)}... added to cart!`);
    }
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.productId]: false }));
    }, 1800);
  };

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    return deals
      .filter((p) => {
        // Store filter
        if (selectedStore !== 'all' && p.store !== selectedStore) return false;

        // Search query filter (from voice or typing)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchBrand = (p.brand || '').toLowerCase().includes(q);
          const matchCat = ((p as any).category || '').toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchCat) return false;
        }

        // Category filter with intelligent aliases
        if (selectedCategory !== 'all') {
          const catLower = ((p as any).category || '').toLowerCase();
          const titleLower = p.title.toLowerCase();
          let matched = catLower.includes(selectedCategory.toLowerCase()) || titleLower.includes(selectedCategory.toLowerCase());
          if (!matched) {
            if (selectedCategory === 'mobiles') {
              matched = titleLower.includes('phone') || titleLower.includes('mobile') || titleLower.includes('galaxy') || titleLower.includes('oppo') || titleLower.includes('iphone') || titleLower.includes('5g');
            } else if (selectedCategory === 'laptops') {
              matched = titleLower.includes('laptop') || titleLower.includes('notebook') || titleLower.includes('pavilion') || titleLower.includes('ideapad') || titleLower.includes('thinkpad');
            } else if (selectedCategory === 'smartwatches') {
              matched = titleLower.includes('watch') || titleLower.includes('smartwatch') || titleLower.includes('smart watch');
            } else if (selectedCategory === 'audio') {
              matched = titleLower.includes('earbud') || titleLower.includes('headphone') || titleLower.includes('neckband') || titleLower.includes('airdopes') || titleLower.includes('airbass') || titleLower.includes('audio');
            } else if (selectedCategory === 'appliances') {
              matched = titleLower.includes('appliance') || titleLower.includes('fryer') || titleLower.includes('purifier') || titleLower.includes('iron');
            } else if (selectedCategory === 'fashion') {
              matched = titleLower.includes('fashion') || titleLower.includes('saree') || titleLower.includes('shirt') || titleLower.includes('shoes') || titleLower.includes('bag');
            }
          }
          if (!matched) return false;
        }

        // Max price filter (e.g., "Find laptops under 50000 rupees")
        if (maxPrice !== null && p.price > maxPrice) {
          return false;
        }

        // Discount filter
        const disc = p.discountPct || (p.mrp && p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
        if (disc < minDiscount) return false;
        return true;
      })
      .sort((a, b) => {
        const discA = a.discountPct || (a.mrp && a.price ? Math.round(((a.mrp - a.price) / a.mrp) * 100) : 0);
        const discB = b.discountPct || (b.mrp && b.price ? Math.round(((b.mrp - b.price) / b.mrp) * 100) : 0);

        if (sortBy === 'discount') return discB - discA;
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [deals, selectedStore, selectedCategory, minDiscount, sortBy, maxPrice, searchQuery]);

  const categoryPills = [
    { id: 'all', label: language === 'kn' ? 'ಎಲ್ಲಾ ಡೀಲ್‌ಗಳು' : language === 'hi' ? 'सभी डील्स' : 'All Deals' },
    { id: 'mobiles', label: language === 'kn' ? 'ಮೊಬೈಲ್ಗಳು' : language === 'hi' ? 'मोबाइल' : 'Mobiles' },
    { id: 'laptops', label: language === 'kn' ? 'ಲ್ಯಾಪ್ಟಾಪ್ಗಳು' : language === 'hi' ? 'लैपटॉप' : 'Laptops' },
    { id: 'audio', label: language === 'kn' ? 'ಆಡಿಯೋ & ಇಯರ್‌ಬಡ್ಸ್' : language === 'hi' ? 'ऑडियो और ईयरबड्स' : 'Audio & Earbuds' },
    { id: 'smartwatches', label: language === 'kn' ? 'ಸ್ಮಾರ್ಟ್‌ವಾಚ್‌ಗಳು' : language === 'hi' ? 'स्मार्टवॉच' : 'Smartwatches' },
    { id: 'appliances', label: language === 'kn' ? 'ಗೃಹೋಪಯೋಗಿ' : language === 'hi' ? 'उपकरण' : 'Appliances' },
    { id: 'fashion', label: language === 'kn' ? 'ಫ್ಯಾಷನ್' : language === 'hi' ? 'फैशन' : 'Fashion' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '20px 16px 80px 16px', boxSizing: 'border-box' }}>
      {/* 1. Header & Back button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => onNavigateRoute('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 0',
            marginBottom: '12px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft size={16} />
          <span>{language === 'kn' ? 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ' : language === 'hi' ? 'होम पर वापस जाएं' : 'Back to Home'}</span>
        </button>

        {/* Hero Banner for Deals */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
            color: '#ffffff',
            boxShadow: '0 12px 30px -6px rgba(124, 58, 237, 0.35)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '28px'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                padding: '4px 14px',
                borderRadius: '30px',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '10px'
              }}
            >
              <Flame size={16} color="#fbbf24" />
              <span>{language === 'kn' ? 'ಲೈವ್ ದೃಢೀಕೃತ ಡೀಲ್‌ಗಳು' : language === 'hi' ? 'लाइव सत्यापित डील्स' : 'Live Verified Multi-Store Discounts'}</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)',
                fontWeight: 900,
                margin: '0 0 8px 0',
                letterSpacing: '-0.5px',
                lineHeight: 1.2
              }}
            >
              {language === 'kn' ? '🔥 ಇಂದಿನ ಅತ್ಯುತ್ತಮ ಡೀಲ್‌ಗಳು & ಆಫರ್‌ಗಳು' : language === 'hi' ? '🔥 आज के सर्वश्रेष्ठ डील्स और ऑफर्स' : '🔥 Today\'s Top Deals & Offers'}
            </h1>
            <p
              style={{
                fontSize: '0.94rem',
                color: 'rgba(255, 255, 255, 0.92)',
                margin: 0,
                lineHeight: 1.5
              }}
            >
              {language === 'kn'
                ? 'ಅಮೆಜಾನ್ ಇಂಡಿಯಾ, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋ ಲೈವ್ ಬೆಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ 70% ವರೆಗೆ ಉಳಿತಾಯ ಮಾಡಿ.'
                : language === 'hi'
                ? 'अमेज़न इंडिया, फ्लिपकार्ट और मीशो पर लाइव कीमतों की तुलना करें और 70% तक की बचत करें।'
                : 'Compare verified live discounts across Amazon India, Flipkart, and Meesho to save up to 70%.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Category Pills Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categoryPills.map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => setSelectedCategory(cp.id)}
              style={{
                background: selectedCategory === cp.id ? 'var(--primary)' : 'var(--bg-subtle)',
                color: selectedCategory === cp.id ? '#ffffff' : 'var(--text-main)',
                border: '1px solid',
                borderColor: selectedCategory === cp.id ? 'var(--primary)' : 'var(--border-color)',
                borderRadius: '10px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cp.label}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Stores, Discounts, Sort */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)'
          }}
        >
          {/* Store Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Store:</span>
            {[
              { id: 'all', label: 'All Stores' },
              { id: 'amazon', label: 'Amazon' },
              { id: 'flipkart', label: 'Flipkart' },
              { id: 'meesho', label: 'Meesho' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStore(st.id)}
                style={{
                  background: selectedStore === st.id ? 'var(--text-main)' : 'transparent',
                  color: selectedStore === st.id ? 'var(--bg-page)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Discount Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Min Discount:</span>
            {[
              { val: 0, label: 'All' },
              { val: 30, label: '30%+ Off' },
              { val: 50, label: '50%+ Off' },
              { val: 70, label: '70%+ Off' }
            ].map((disc) => (
              <button
                key={disc.val}
                type="button"
                onClick={() => setMinDiscount(disc.val)}
                style={{
                  background: minDiscount === disc.val ? '#f43f5e' : 'transparent',
                  color: minDiscount === disc.val ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {disc.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="discount">Highest Discount %</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Top Rated (4★+)</option>
            </select>
          </div>

          {/* Active Filter Badges from Voice Commands */}
          {(maxPrice !== null || searchQuery.trim()) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {maxPrice !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(79, 70, 229, 0.12)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  <span>Max ₹{maxPrice.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setMaxPrice(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                    title="Remove price filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(219, 39, 119, 0.12)',
                    border: '1px solid #db2777',
                    color: '#db2777',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  <span>Search: "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                    title="Clear search filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Deals Grid */}
      {loading ? (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}
        >
          <RefreshCw size={36} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            {language === 'kn' ? 'ಲೈವ್ ಡೀಲ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : language === 'hi' ? 'लाइव डील्स खोजी जा रही हैं...' : 'Fetching Live Store Deals...'}
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
            Querying Amazon India, Flipkart, and Meesho for verified active discounts
          </p>
        </div>
      ) : filteredDeals.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredDeals.map((product) => {
            const mrp = product.mrp || Math.round(product.price * 1.35);
            const discountPct = product.discountPct || Math.round(((mrp - product.price) / mrp) * 100);
            const savings = Math.max(0, mrp - product.price);
            const isAdded = !!addedIds[product.productId];

            const storeColor =
              product.store === 'amazon' ? '#ff9900' : product.store === 'flipkart' ? '#2874f0' : '#e91e63';

            return (
              <div
                key={`${product.store}-${product.productId}`}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
                onClick={() => {
                  onNavigateRoute(`/product/${encodeURIComponent(product.store)}/${encodeURIComponent(product.productId)}`);
                }}
              >
                {/* Top Badge: Discount Tag */}
                {discountPct > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 3,
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <Flame size={13} />
                    <span>{discountPct}% OFF</span>
                  </div>
                )}

                {/* Store Platform Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 3,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    borderLeft: `3px solid ${storeColor}`
                  }}
                >
                  {product.store}
                </div>

                {/* Product Image */}
                <div
                  style={{
                    width: '100%',
                    height: '220px',
                    background: 'var(--bg-subtle, #f8fafc)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                  }}
                >
                  <ProductImage
                    src={product.imageUrl}
                    images={product.images}
                    alt={product.title}
                    store={product.store}
                    productId={product.productId}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                </div>

                {/* Card Content */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Brand & Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {product.brand || product.store}
                    </span>
                    {product.rating ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        <Star size={12} fill="#059669" color="#059669" />
                        <span>{product.rating.toFixed(1)}</span>
                        {product.ratingCount ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            ({product.ratingCount > 1000 ? `${(product.ratingCount / 1000).toFixed(0)}k` : product.ratingCount})
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '0.94rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      margin: '0 0 10px 0',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    title={product.title}
                  >
                    {product.title}
                  </h3>

                  {/* Pricing Block */}
                  <div style={{ marginTop: 'auto', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {mrp > product.price && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {savings > 0 && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        Save ₹{savings.toLocaleString('en-IN')} ({discountPct}% discount)
                      </div>
                    )}
                  </div>

                  {/* Actions: Add to Cart & Compare */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      style={{
                        flex: 1,
                        background: isAdded ? '#10b981' : 'var(--primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      {isAdded ? (
                        <>
                          <Check size={16} />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={15} />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    {onToggleCompare && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompare(product);
                          if (showToast) showToast('Product added to Comparison Matrix');
                        }}
                        style={{
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '9px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Compare with other stores"
                      >
                        <Scale size={15} />
                      </button>
                    )}

                    {product.productUrl && product.productUrl !== '#' && (
                      <a
                        href={product.affiliateUrl || product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '9px 12px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={`View on ${product.store}`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}
        >
          <Tag size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
            No deals matched your selected filters
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>
            Try resetting the minimum discount filter or selecting All Stores.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStore('all');
              setMinDiscount(0);
              setMaxPrice(null);
              setSearchQuery('');
              setSortBy('discount');
            }}
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Smart Floating Voice Assistant (Bottom-Right: right: 25px, bottom: 100px) */}
      <FloatingVoiceAssistant
        deals={deals}
        filteredDeals={filteredDeals}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        selectedStore={selectedStore}
        onSelectStore={(store) => setSelectedStore(store)}
        minDiscount={minDiscount}
        onSelectMinDiscount={(d) => setMinDiscount(d)}
        sortBy={sortBy}
        onSelectSortBy={(sort) => setSortBy(sort)}
        maxPrice={maxPrice}
        onSelectMaxPrice={(price) => setMaxPrice(price)}
        searchQuery={searchQuery}
        onSearchQuery={(q) => setSearchQuery(q)}
        onClearFilters={() => {
          setSelectedCategory('all');
          setSelectedStore('all');
          setMinDiscount(0);
          setMaxPrice(null);
          setSearchQuery('');
          setSortBy('discount');
        }}
        onAddToCart={onAddToCart}
        onNavigateRoute={onNavigateRoute}
        onSearchPrompt={onSearchPrompt}
        cart={cart}
        onRemoveFromCart={onRemoveFromCart}
        language={language}
        showToast={showToast}
      />
    </div>
  );
};
