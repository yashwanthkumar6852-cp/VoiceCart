import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  Check,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SupportedLanguage } from '../../i18n/translations';

interface Props {
  onSearchPrompt?: (query: string) => void;
  onStartVoice?: () => void;
  onNavigateRoute?: (route: string) => void;
  language?: SupportedLanguage;
}

interface HeroSlide {
  id: number;
  pill: string;
  heading1: string;
  heading2: string;
  description: string;
  ctaText: string;
  ctaIcon: any;
  ctaDestination: string;
  accentColor: string;
  ctaBackground: string;
  ctaShadow: string;
  radialGlow1: string;
  radialGlow2: string;
  renderVisual: () => React.ReactNode;
}

const HERO_SLIDES: HeroSlide[] = [
  // SLIDE 1 — Voice Shopping
  {
    id: 1,
    pill: '✨ Smart Voice Shopping',
    heading1: 'Your Voice,',
    heading2: 'Our Search',
    description: 'Compare products across Amazon, Flipkart and Meesho using your voice.',
    ctaText: 'Start Shopping',
    ctaIcon: Mic,
    ctaDestination: '/',
    accentColor: '#38bdf8',
    ctaBackground: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
    ctaShadow: '0 6px 20px rgba(59, 130, 246, 0.45)',
    radialGlow1: 'rgba(56, 189, 248, 0.22)',
    radialGlow2: 'rgba(99, 102, 241, 0.25)',
    renderVisual: () => (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '185px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Floating Store Pills */}
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            left: '8%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 4
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#111827',
              padding: '3px 10px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: '#ff9900' }}>amazon</span>
          </div>
          <div
            style={{
              background: '#ffffff',
              color: '#2874f0',
              padding: '3px 10px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}
          >
            Flipkart <span style={{ color: '#eab308' }}>★</span>
          </div>
          <div
            style={{
              background: '#ffffff',
              color: '#f43397',
              padding: '3px 10px',
              borderRadius: '7px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}
          >
            meesho
          </div>
        </div>

        {/* Hand-drawn style note with curved arrow on the top right */}
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '4%',
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.95)',
            fontFamily: "'Caveat', cursive, sans-serif",
            lineHeight: 1.25,
            textAlign: 'right',
            zIndex: 4
          }}
        >
          <div>Best price</div>
          <div>Best quality</div>
          <div>All in one place</div>
          <svg width="30" height="22" viewBox="0 0 34 26" style={{ marginTop: '1px', display: 'inline-block' }}>
            <path
              d="M24,2 Q10,12 8,22 M8,22 L14,18 M8,22 L5,15"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Product Showcase Collage: Smartphone, Laptop, Headphones, Smartwatch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '26px',
            width: '100%'
          }}
        >
          {/* 1. Smartphone */}
          <div style={{ position: 'relative', transform: 'rotate(-4deg)' }}>
            <img
              src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80"
              alt="Smartphone"
              style={{
                width: '64px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '0.6rem',
                padding: '2px 4px',
                borderRadius: '3px',
                fontWeight: 700
              }}
            >
              Mobiles
            </span>
          </div>

          {/* 2. Open Laptop */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80"
              alt="Laptop"
              style={{
                width: '130px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '9px',
                boxShadow: '0 10px 22px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.25)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                background: 'rgba(99, 102, 241, 0.85)',
                color: '#fff',
                fontSize: '0.6rem',
                padding: '2px 5px',
                borderRadius: '3px',
                fontWeight: 700
              }}
            >
              Laptops
            </span>
          </div>

          {/* 3. Sony Headphones */}
          <div style={{ position: 'relative', transform: 'rotate(5deg)' }}>
            <img
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80"
              alt="Headphones"
              style={{
                width: '70px',
                height: '92px',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '0.6rem',
                padding: '2px 4px',
                borderRadius: '3px',
                fontWeight: 700
              }}
            >
              Audio
            </span>
          </div>

          {/* 4. Smartwatch */}
          <div style={{ position: 'relative', transform: 'rotate(8deg)' }}>
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&auto=format&fit=crop&q=80"
              alt="Smartwatch"
              style={{
                width: '50px',
                height: '76px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          </div>
        </div>
      </div>
    )
  },

  // SLIDE 2 — Best Deals & Savings
  {
    id: 2,
    pill: '⭐ Verified Deals & Savings',
    heading1: 'Find Your Best Deal,',
    heading2: 'Save More',
    description: 'Compare verified prices, ratings and offers to find the best value.',
    ctaText: 'Explore Deals',
    ctaIcon: Sparkles,
    ctaDestination: '/deals',
    accentColor: '#fbbf24',
    ctaBackground: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    ctaShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
    radialGlow1: 'rgba(245, 158, 11, 0.25)',
    radialGlow2: 'rgba(234, 88, 12, 0.22)',
    renderVisual: () => (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '185px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Hand-drawn style note on top right matching user image */}
        <div
          style={{
            position: 'absolute',
            top: '-14px',
            right: '4px',
            fontSize: '0.68rem',
            color: 'rgba(255, 255, 255, 0.95)',
            fontFamily: "'Caveat', cursive, sans-serif",
            lineHeight: 1.25,
            textAlign: 'right',
            zIndex: 5
          }}
        >
          <div>Best price</div>
          <div>Best quality</div>
          <div>All in one place</div>
          <svg width="28" height="20" viewBox="0 0 34 26" style={{ marginTop: '1px', display: 'inline-block' }}>
            <path
              d="M24,2 Q10,12 8,22 M8,22 L14,18 M8,22 L5,15"
              stroke="#ffffff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* 3 Devices with floating discount tags matching reference image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '8px',
            paddingTop: '20px',
            width: '100%'
          }}
        >
          {/* Device 1: Laptop */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '6px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '12px',
                padding: '2px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 4,
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ background: '#10b981', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800 }}>10% OFF</span>
              <span style={{ color: '#ffffff', fontSize: '0.66rem', fontWeight: 800 }}>₹28,990</span>
              <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.58rem' }}>₹32,990</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80"
              alt="ASUS Vivobook Laptop"
              style={{
                width: '128px',
                height: '96px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 10px 22px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 255, 255, 0.22)'
              }}
            />
          </div>

          {/* Device 2: TV / Monitor */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '12px',
                padding: '2px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 4,
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ background: '#06b6d4', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800 }}>25% OFF</span>
              <span style={{ color: '#ffffff', fontSize: '0.66rem', fontWeight: 800 }}>₹24,990</span>
              <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.58rem' }}>₹33,990</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&auto=format&fit=crop&q=80"
              alt="Samsung 4K TV"
              style={{
                width: '136px',
                height: '96px',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 12px 26px rgba(0,0,0,0.55)',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            />
          </div>

          {/* Device 3: Smartphone */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-4px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '12px',
                padding: '2px 7px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 4,
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ background: '#3b82f6', color: '#fff', padding: '1px 4px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 800 }}>32% OFF</span>
              <span style={{ color: '#ffffff', fontSize: '0.66rem', fontWeight: 800 }}>₹42,999</span>
              <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: '0.58rem' }}>₹62,999</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80"
              alt="iPhone"
              style={{
                width: '64px',
                height: '96px',
                objectFit: 'cover',
                borderRadius: '10px',
                boxShadow: '0 8px 18px rgba(0,0,0,0.45)',
                border: '1px solid rgba(255, 255, 255, 0.22)'
              }}
            />
          </div>
        </div>

        {/* Floating Store Pills at bottom matching reference image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '10px',
            zIndex: 4
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#111827',
              padding: '3px 12px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: '#ff9900' }}>amazon</span>
          </div>
          <div
            style={{
              background: '#ffffff',
              color: '#2874f0',
              padding: '3px 12px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}
          >
            Flipkart <span style={{ color: '#eab308' }}>★</span>
          </div>
          <div
            style={{
              background: '#ffffff',
              color: '#f43397',
              padding: '3px 12px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}
          >
            meesho
          </div>
        </div>
      </div>
    )
  },

  // SLIDE 3 — Smart Product Comparison
  {
    id: 3,
    pill: '⚖️ Smart Multi-Store Comparison',
    heading1: 'Compare Smart,',
    heading2: 'Choose Better',
    description: 'Compare prices, specifications, ratings and features before buying.',
    ctaText: 'Compare Products',
    ctaIcon: SlidersHorizontal,
    ctaDestination: '/compare',
    accentColor: '#34d399',
    ctaBackground: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
    ctaShadow: '0 6px 20px rgba(16, 185, 129, 0.45)',
    radialGlow1: 'rgba(16, 185, 129, 0.24)',
    radialGlow2: 'rgba(2, 132, 199, 0.22)',
    renderVisual: () => (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '185px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {/* Model Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '4px 14px',
            borderRadius: '18px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#e0e7ff',
            marginBottom: '4px'
          }}
        >
          <span>iPhone 15 (128 GB)</span>
          <span style={{ color: '#38bdf8' }}>• 3 Stores Evaluated</span>
        </div>

        {/* 3 Side-by-Side Store Comparison Cards */}
        <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '8px', width: '100%' }}>
          {/* Flipkart Card (Best Match) */}
          <div
            style={{
              flex: '1 1 100px',
              maxWidth: '120px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid #10b981',
              borderRadius: '11px',
              padding: '9px 8px',
              textAlign: 'center',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.25)',
              position: 'relative'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#10b981',
                color: '#fff',
                fontSize: '0.58rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '7px',
                whiteSpace: 'nowrap'
              }}
            >
              SAVE ₹500 ★
            </span>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2874f0', marginBottom: '2px' }}>
              FLIPKART
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff' }}>
              ₹69,499
            </div>
            <div style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 600, marginTop: '2px' }}>
              Free 2-Day Del.
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              4.7 ★ (18.9k)
            </div>
          </div>

          {/* Amazon Card */}
          <div
            style={{
              flex: '1 1 100px',
              maxWidth: '120px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '11px',
              padding: '9px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ff9900', marginBottom: '2px' }}>
              AMAZON
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
              ₹69,999
            </div>
            <div style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
              Prime 1-Day Del.
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              4.6 ★ (14.2k)
            </div>
          </div>

          {/* Meesho Card */}
          <div
            style={{
              flex: '1 1 100px',
              maxWidth: '120px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '11px',
              padding: '9px 8px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f43397', marginBottom: '2px' }}>
              MEESHO
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
              ₹70,499
            </div>
            <div style={{ fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 600, marginTop: '2px' }}>
              Standard Del.
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
              Direct Seller
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
          <TrendingDown size={14} />
          <span>Save ₹500 instantly on Flipkart with live comparison</span>
        </div>
      </div>
    )
  },

  // SLIDE 4 — Shop Your Way
  {
    id: 4,
    pill: '🛍️ Everything in One Marketplace',
    heading1: 'Everything You Need,',
    heading2: 'One Place',
    description: 'Discover mobiles, laptops, fashion, shoes, electronics and home appliances.',
    ctaText: 'Explore Categories',
    ctaIcon: LayoutGrid,
    ctaDestination: '/categories',
    accentColor: '#c084fc',
    ctaBackground: 'linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)',
    ctaShadow: '0 6px 20px rgba(147, 51, 234, 0.45)',
    radialGlow1: 'rgba(192, 132, 252, 0.22)',
    radialGlow2: 'rgba(129, 140, 248, 0.25)',
    renderVisual: () => (
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '185px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {/* Category Header Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(192, 132, 252, 0.15)',
            border: '1px solid rgba(192, 132, 252, 0.35)',
            padding: '3px 12px',
            borderRadius: '16px',
            color: '#e9d5ff',
            fontSize: '0.72rem',
            fontWeight: 700,
            marginBottom: '4px'
          }}
        >
          <Layers size={13} />
          <span>6 Core Categories • Millions of Products</span>
        </div>

        {/* 6 Category Tiles (3 x 2 grid) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '7px',
            width: '100%',
            maxWidth: '340px'
          }}
        >
          {[
            { name: 'Mobiles', img: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=160&auto=format&fit=crop&q=80', icon: '📱' },
            { name: 'Laptops', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160&auto=format&fit=crop&q=80', icon: '💻' },
            { name: 'Fashion', img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=160&auto=format&fit=crop&q=80', icon: '👗' },
            { name: 'Shoes', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80', icon: '👟' },
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=160&auto=format&fit=crop&q=80', icon: '🎧' },
            { name: 'Home', img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=160&auto=format&fit=crop&q=80', icon: '🏠' }
          ].map((cat) => (
            <div
              key={cat.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
              }}
            >
              <img
                src={cat.img}
                alt={cat.name}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#c084fc' }}>{cat.icon} Verified</div>
              </div>
            </div>
          ))}
        </div>

        <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)', marginTop: '4px' }}>
          Explore unified catalogs from Amazon, Flipkart & Meesho
        </span>
      </div>
    )
  }
];

export const DashboardHeroBanner: React.FC<Props> = ({
  onSearchPrompt,
  onStartVoice,
  onNavigateRoute
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const touchStartXRef = useRef<number | null>(null);

  const totalSlides = HERO_SLIDES.length;
  const currentSlide = HERO_SLIDES[activeSlide % totalSlides];
  const CtaIcon = currentSlide.ctaIcon;

  // Next / Prev slide handlers
  const handleNext = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleDotClick = (index: number) => {
    setActiveSlide(index);
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;
    if (diffX > 45) {
      handleNext();
    } else if (diffX < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  // Track page visibility to pause autoplay when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Autoplay timer: auto-advances automatically every 4 seconds, pauses only when browser tab is hidden
  useEffect(() => {
    if (!isTabVisible) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [isTabVisible, activeSlide, totalSlides]);

  // CTA Click router (prevents full page reloads)
  const handleCtaClick = () => {
    if (currentSlide.id === 1) {
      if (onStartVoice) {
        onStartVoice();
      } else if (onSearchPrompt) {
        onSearchPrompt('top trending products');
      }
    } else {
      if (onNavigateRoute) {
        onNavigateRoute(currentSlide.ctaDestination);
      } else {
        window.history.pushState({}, '', currentSlide.ctaDestination);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Shopping Highlights"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="dashboard-hero-banner-root"
      style={{
        width: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #090e1a 0%, #0c1838 35%, #18224d 70%, #0d1527 100%)',
        color: '#ffffff',
        padding: '24px 36px 18px 36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 18px 40px -15px rgba(10, 15, 30, 0.45)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        minHeight: '235px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        outline: 'none'
      }}
    >
      <style>{`
        @keyframes heroSlideFadeIn {
          from {
            opacity: 0;
            transform: translateX(8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .hero-slide-anim {
          animation: heroSlideFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes heroDotProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .hero-dot-active-bar {
          animation: heroDotProgress 4s linear forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-slide-anim {
            animation: none !important;
            transition: none !important;
          }
        }
        .hero-arrow-btn:hover {
          background: rgba(30, 41, 59, 0.85) !important;
          transform: translateY(-50%) scale(1.08) !important;
          border-color: rgba(255, 255, 255, 0.45) !important;
        }
        @media (max-width: 768px) {
          .hero-slide-layout {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .hero-slide-copy {
            max-width: 100% !important;
            text-align: center !important;
          }
          .hero-arrow-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* Decorative dynamic radial glow background shifting with active slide */}
      <div
        style={{
          position: 'absolute',
          top: '-50px',
          right: '35%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: currentSlide.radialGlow1,
          filter: 'blur(50px)',
          pointerEvents: 'none',
          transition: 'background 0.5s ease'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-40px',
          right: '5%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: currentSlide.radialGlow2,
          filter: 'blur(45px)',
          pointerEvents: 'none',
          transition: 'background 0.5s ease'
        }}
      />

      {/* Navigation Arrow: Previous Slide */}
      <button
        type="button"
        aria-label="Previous slide"
        className="hero-arrow-btn"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(11, 15, 25, 0.65)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
          transition: 'all 0.2s ease'
        }}
      >
        <ChevronLeft size={18} />
      </button>

      {/* Navigation Arrow: Next Slide */}
      <button
        type="button"
        aria-label="Next slide"
        className="hero-arrow-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'rgba(11, 15, 25, 0.65)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 10,
          transition: 'all 0.2s ease'
        }}
      >
        <ChevronRight size={18} />
      </button>

      {/* Synchronized Slide Content Area (Both Text & Visuals update together via key) */}
      <div
        key={activeSlide}
        className="hero-slide-anim hero-slide-layout"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          position: 'relative',
          zIndex: 2,
          paddingLeft: '12px',
          paddingRight: '12px'
        }}
      >
        {/* Left Column: Heading, Description & Action CTA */}
        <div className="hero-slide-copy" style={{ flex: '1 1 320px', maxWidth: '420px' }}>
          {/* Top Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#e0e7ff',
              letterSpacing: '0.3px',
              marginBottom: '12px'
            }}
          >
            <span>{currentSlide.pill}</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(1.7rem, 2.6vw, 2.25rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 10px 0',
              letterSpacing: '-0.5px'
            }}
          >
            {currentSlide.heading1}<br />
            <span style={{ color: currentSlide.accentColor }}>{currentSlide.heading2}</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.86rem',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.45,
              margin: '0 0 18px 0'
            }}
          >
            {currentSlide.description}
          </p>

          {/* CTA Action Button */}
          <button
            type="button"
            onClick={handleCtaClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '24px',
              border: 'none',
              background: currentSlide.ctaBackground,
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: currentSlide.ctaShadow,
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <CtaIcon size={16} color="#ffffff" />
            <span>{currentSlide.ctaText}</span>
          </button>
        </div>

        {/* Right Column: Slide Visuals */}
        <div
          style={{
            flex: '1 1 360px',
            position: 'relative',
            minHeight: '185px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {currentSlide.renderVisual()}
        </div>
      </div>

      {/* Slide Indicator Dots at Bottom */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '12px',
          position: 'relative',
          zIndex: 6
        }}
        role="tablist"
        aria-label="Carousel slide pagination"
      >
        {HERO_SLIDES.map((s, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${idx + 1}: ${s.heading1} ${s.heading2}`}
              onClick={(e) => {
                e.stopPropagation();
                handleDotClick(idx);
              }}
              style={{
                width: isActive ? '28px' : '7px',
                height: '7px',
                borderRadius: '4px',
                border: 'none',
                padding: 0,
                background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 0 8px ${currentSlide.accentColor}` : 'none'
              }}
            >
              {isActive && (
                <span
                  key={`progress-${activeSlide}`}
                  className="hero-dot-active-bar"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    background: currentSlide.accentColor,
                    borderRadius: '4px'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
