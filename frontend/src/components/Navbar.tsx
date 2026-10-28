import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Mic,
  ShoppingCart,
  ChevronDown,
  X,
  User,
  Package,
  LogOut,
  Globe,
  Settings,
  Sparkles,
  Zap,
  Check,
  Tag,
  Moon,
  Sun,
  Scale,
  Heart,
  Bell,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SupportedLanguage, translations } from '../i18n/translations';
import { PendingAuthAction } from '../types/auth';
import { useVoice } from '../hooks/useVoice';
import { commandRouter } from '../voice/commandRouter';
import { actionDispatcher, DispatcherHandlers } from '../voice/dispatcher';
import { voiceStore } from '../voice/voiceStore';
import { AssistantResponse } from '../voice/types';
import { ttsService } from '../voice/tts';
import { CATEGORY_ITEMS } from './CategoryIconTabBar';

export type TabType = 'home' | 'search' | 'cart' | 'orders' | 'settings';

export interface SavedLocation {
  pincode: string;
  city: string;
}

const PINCODE_CITY_PREFIXES: Record<string, string> = {
  '56': 'Bengaluru',
  '57': 'Mysuru',
  '58': 'Hubballi',
  '59': 'Belagavi',
  '11': 'New Delhi',
  '40': 'Mumbai',
  '41': 'Pune',
  '60': 'Chennai',
  '70': 'Kolkata',
  '50': 'Hyderabad',
  '38': 'Ahmedabad',
  '30': 'Jaipur',
  '68': 'Kochi',
  '64': 'Coimbatore',
  '62': 'Madurai',
  '22': 'Lucknow',
  '20': 'Noida',
  '12': 'Gurugram',
  '14': 'Ludhiana',
  '16': 'Chandigarh',
  '45': 'Indore',
  '46': 'Bhopal',
  '80': 'Patna',
  '75': 'Bhubaneswar',
  '78': 'Guwahati'
};

const resolveCityFromPincode = (pin: string): string => {
  const prefix = pin.slice(0, 2);
  return PINCODE_CITY_PREFIXES[prefix] || 'India';
};

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount: number;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigate?: (path: string) => void;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'profile', notice?: string) => void;
  onProtectedAction?: (action: PendingAuthAction, notice?: string) => void;
  searchQuery?: string;
  onSearch?: (query: string, category?: string) => void;
  voiceHandlers?: DispatcherHandlers;
  voiceContext?: any;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  cartCount,
  language,
  onLanguageChange,
  onNavigate,
  onOpenAuth,
  onProtectedAction,
  searchQuery: initialSearchQuery = '',
  onSearch,
  voiceHandlers,
  voiceContext,
  selectedCategory = 'all',
  onCategoryChange
}) => {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = translations[language === 'hi' || language === 'kn' ? language : 'en'] || translations.en;

  // Search State
  const [searchInput, setSearchInput] = useState(initialSearchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchInput(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Dropdowns State
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Delivery Location State
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(() => {
    try {
      const stored = localStorage.getItem('voicecart_delivery_location');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  const loginMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Order Out for Delivery 🚚',
      message: 'iPhone 15 (128GB) is out for delivery. Arriving today by 9 PM!',
      time: '15m ago',
      unread: true,
      route: '/orders',
      icon: 'package',
      color: '#3b82f6',
      requiresAuth: true
    },
    {
      id: 'notif-2',
      title: 'Price Drop Alert 🔥',
      message: 'Sony WH-CH720N dropped by ₹1,500 on Amazon & Flipkart.',
      time: '1h ago',
      unread: true,
      route: '/deals',
      icon: 'zap',
      color: '#f59e0b',
      requiresAuth: false
    },
    {
      id: 'notif-3',
      title: 'Festive Deals Activated ✨',
      message: 'Extra 10% instant discount on electronics with ICICI & HDFC cards.',
      time: '3h ago',
      unread: false,
      route: '/deals',
      icon: 'sparkles',
      color: '#8b5cf6',
      requiresAuth: false
    }
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleNotificationClick = (item: (typeof notifications)[0]) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setIsNotificationOpen(false);

    if (item.requiresAuth && !isAuthenticated) {
      if (onProtectedAction) {
        onProtectedAction(
          { type: 'NAVIGATE', payload: { path: item.route } } as any,
          'Please log in to view your order updates.'
        );
      } else if (onOpenAuth) {
        onOpenAuth('login', 'Please log in to view your order updates.');
      } else if (onNavigate) {
        onNavigate('/login');
      }
      return;
    }

    if (item.route === '/orders') {
      if (onNavigate) onNavigate('/orders');
      onTabChange('orders');
    } else if (onNavigate) {
      onNavigate(item.route);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (loginMenuRef.current && !loginMenuRef.current.contains(target)) {
        setIsLoginMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Voice Search Pipeline Integration
  const langCode = language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
  const [voiceTooltip, setVoiceTooltip] = useState<string | null>(null);

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      const clean = transcript.trim();
      if (!clean) return;
      ttsService.stop();
      setSearchInput(clean);
      setVoiceTooltip(`Heard: "${clean}"`);
      setTimeout(() => setVoiceTooltip(null), 4000);

      if (voiceHandlers) {
        try {
          const currentContext = voiceStore.getContext();
          const targetLang: SupportedLanguage = language === 'auto' ? 'en' : language;
          const commandResult = await commandRouter.route(clean, currentContext, targetLang);

          if (commandResult.action === 'stop') {
            ttsService.stop();
            return;
          }

          const dispatchResult = await actionDispatcher.dispatch(commandResult, voiceHandlers, clean);
          const assistantRes = dispatchResult.assistantResponse || commandResult.assistantResponse;

          const spoken = assistantRes?.spokenResponse || dispatchResult.spokenResponse || commandResult.reply;
          if (spoken) {
            const spokenLang = (commandResult.language && commandResult.language !== 'auto'
              ? commandResult.language
              : targetLang) as 'en' | 'hi' | 'kn';
            ttsService.speak(spoken, spokenLang);
          }
        } catch (err) {
          console.error('Voice routing error in header:', err);
          if (onSearch) onSearch(clean, selectedCategory);
        }
      } else if (onSearch) {
        onSearch(clean, selectedCategory);
      }
    },
    [voiceHandlers, language, onSearch, selectedCategory]
  );

  const { state: voiceState, liveTranscript, startListening, stopListening } = useVoice(
    langCode,
    (transcript) => handleFinalTranscript(transcript)
  );

  const isMicListening = voiceState === 'listening' || voiceState === 'recording_fallback';

  const handleToggleVoice = () => {
    if (ttsService.isSpeaking()) {
      ttsService.stop();
    }
    if (isMicListening) {
      stopListening();
    } else {
      setVoiceTooltip(t.listening);
      startListening();
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch(searchInput.trim(), selectedCategory);
    }
  };

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincodeInput.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    const resolvedCity = resolveCityFromPincode(cleanPin);
    const newLoc: SavedLocation = { pincode: cleanPin, city: resolvedCity };
    setSavedLocation(newLoc);
    try {
      localStorage.setItem('voicecart_delivery_location', JSON.stringify(newLoc));
    } catch { }
    setPincodeError(null);
    setIsLocationModalOpen(false);
  };

  const handleClearLocation = () => {
    setSavedLocation(null);
    try {
      localStorage.removeItem('voicecart_delivery_location');
    } catch { }
    setPincodeInput('');
    setIsLocationModalOpen(false);
  };

  const handleCartClick = () => {
    if (!isAuthenticated) {
      if (onProtectedAction) {
        onProtectedAction({ type: 'OPEN_CART' }, 'Please log in to view your cart.');
      } else if (onOpenAuth) {
        onOpenAuth('login', 'Please log in to view your cart.');
      }
      return;
    }
    onTabChange('cart');
  };

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#0a1226',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          width: '100%',
          fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        <div
          className="navbar-top-row"
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '11px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* 1. Left: VoiceCart Logo matching Reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <div
              onClick={() => {
                if (onNavigate) onNavigate('/');
                onTabChange('home');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                caretColor: 'transparent'
              }}
              title="VoiceCart Home"
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(37, 99, 235, 0.15)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  flexShrink: 0
                }}
              >
                <img
                  src="/logo.png"
                  alt="VoiceCart"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div style={{ userSelect: 'none', WebkitUserSelect: 'none', caretColor: 'transparent' }}>
                <div
                  style={{
                    fontSize: '1.32rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    lineHeight: 1,
                    letterSpacing: '-0.3px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    caretColor: 'transparent'
                  }}
                >
                  VoiceCart
                </div>
                <div
                  className="header-tagline"
                  style={{
                    fontSize: '0.68rem',
                    color: '#60a5fa',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    marginTop: '3px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    caretColor: 'transparent'
                  }}
                >
                  Speak · Search · Shop
                </div>
              </div>
            </div>
          </div>

          {/* 2. Center: Pure White Search Bar Capsule matching Reference */}
          <div
            className="header-search-container"
            style={{
              flex: '1 1 500px',
              maxWidth: '680px',
              position: 'relative'
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '44px',
                borderRadius: '9999px',
                background: '#ffffff',
                border: isSearchFocused ? '1.5px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                padding: '0 5px 0 16px',
                transition: 'all 0.15s ease'
              }}
            >
              <Mic size={16} color="#64748b" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                id="voicecart-main-search-input"
                className="search-bar-input search-input voicecart-search-input"
                data-search-bar="true"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder='Try saying "iPhone 15" or "best laptop under 60000"'
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.88rem',
                  color: '#0f172a',
                  fontWeight: 500,
                  caretColor: 'auto'
                }}
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    if (onSearch) onSearch('', selectedCategory);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}

              {/* Microphone inside Search Bar */}
              <button
                id="navbar-voice-mic-btn"
                type="button"
                onClick={handleToggleVoice}
                title={isMicListening ? `${t.listeningPrompt}` : t.searchTooltip}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isMicListening ? '#ef4444' : '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isMicListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(37, 99, 235, 0.35)',
                  transition: 'transform 0.15s ease',
                  flexShrink: 0
                }}
              >
                <Mic size={16} className={isMicListening ? 'mic-active-pulse' : ''} />
              </button>
            </form>

            {/* Voice Feedback Tooltip */}
            {(isMicListening || liveTranscript || voiceTooltip) && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                  zIndex: 1100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  border: isMicListening ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                {isMicListening && <Mic size={15} color="#ef4444" className="mic-active-pulse" />}
                <span>{liveTranscript ? `${t.listening} "${liveTranscript}"` : voiceTooltip || t.listening}</span>
              </div>
            )}
          </div>

          {/* 3. Right Action Icons & Controls matching Reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            {/* Language Selector Capsule (Desktop only, mobile has pills in search row) */}
            <div ref={langMenuRef} className="navbar-desktop-pill" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <Globe size={15} color="#94a3b8" />
                <span>{language === 'kn' ? 'ಕನ್ನಡ' : language === 'hi' ? 'हिन्दी' : 'English'}</span>
                <ChevronDown size={14} color="#94a3b8" />
              </button>

              {isLangMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                    padding: '6px',
                    zIndex: 1300,
                    minWidth: '130px'
                  }}
                >
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'kn', label: 'ಕನ್ನಡ' },
                    { code: 'hi', label: 'हिन्दी' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        onLanguageChange(item.code as SupportedLanguage);
                        voiceStore.setLanguage(item.code as SupportedLanguage);
                        setIsLangMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: language === item.code ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                        color: language === item.code ? '#60a5fa' : '#f8fafc',
                        fontSize: '0.82rem',
                        fontWeight: language === item.code ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button (Sun & Moon) */}
            <button
              type="button"
              className="navbar-desktop-pill"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '9999px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <Sun size={15} color={theme === 'light' ? '#f59e0b' : '#94a3b8'} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
              <Moon size={15} color={theme === 'dark' ? '#38bdf8' : '#94a3b8'} />
            </button>

            {/* Notification Bell with Interactive Dropdown */}
            <div ref={notificationMenuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isNotificationOpen ? '#38bdf8' : '#ffffff',
                  background: isNotificationOpen ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
                title="Notifications"
                onMouseEnter={(e) => {
                  if (!isNotificationOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isNotificationOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Bell size={20} color={isNotificationOpen ? '#38bdf8' : '#ffffff'} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      fontSize: '10px',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: '-40px',
                    width: '340px',
                    maxWidth: '92vw',
                    background: 'var(--bg-card, #ffffff)',
                    borderRadius: '16px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    zIndex: 1300,
                    overflow: 'hidden',
                    color: 'var(--text-main, #0f172a)',
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--border-color, #f1f5f9)',
                      background: 'var(--bg-card, #ffffff)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '12px'
                          }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List of Notifications */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: item.unread ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                          borderBottom: '1px solid var(--border-color, #f1f5f9)',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-subtle, rgba(0,0,0,0.03))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = item.unread
                            ? 'rgba(99, 102, 241, 0.04)'
                            : 'transparent';
                        }}
                      >
                        {/* Icon with colored badge */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: `${item.color}18`,
                            color: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {item.icon === 'package' ? (
                            <Package size={18} />
                          ) : item.icon === 'zap' ? (
                            <Zap size={18} />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: item.unread ? 700 : 600, color: 'var(--text-main)' }}>
                              {item.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {item.time}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              margin: '3px 0 0 0',
                              lineHeight: 1.35
                            }}
                          >
                            {item.message}
                          </p>
                        </div>

                        {/* Unread indicator dot */}
                        {item.unread && (
                          <div
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: '#2563eb',
                              flexShrink: 0,
                              marginTop: '6px'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer link to Orders */}
                  <div
                    onClick={() => {
                      setIsNotificationOpen(false);
                      if (onNavigate) onNavigate('/orders');
                      onTabChange('orders');
                    }}
                    style={{
                      padding: '11px 16px',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#2563eb',
                      background: 'var(--bg-subtle, #f8fafc)',
                      cursor: 'pointer',
                      borderTop: '1px solid var(--border-color, #e2e8f0)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-subtle, #f8fafc)';
                    }}
                  >
                    View all orders & deliveries →
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <div
              className="navbar-top-cart-btn"
              onClick={handleCartClick}
              style={{
                position: 'relative',
                cursor: 'pointer',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'background 0.15s ease'
              }}
              title={t.cart}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ShoppingCart size={20} color="#ffffff" />
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                }}
              >
                {cartCount > 0 ? cartCount : 2}
              </span>
            </div>

            {/* Profile Dropdown matching Reference */}
            <div ref={loginMenuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setIsLoginMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: !isAuthenticated ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.15)',
                    border: !isAuthenticated ? '1.5px solid rgba(37, 99, 235, 0.5)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <User size={16} />
                </div>
                <div className="navbar-profile-text" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                  {!isAuthenticated ? (
                    <>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                        {language === 'kn' ? 'ಲಾಗಿನ್' : language === 'hi' ? 'लॉग इन' : 'Login'}
                      </span>
                      <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 500 }}>
                        {language === 'kn' ? 'ಸೈನ್ ಇನ್' : language === 'hi' ? 'साइन इन' : 'Sign in'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {displayName}
                      </span>
                      <span style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 500 }}>
                        {language === 'kn' ? 'ಪ್ರೊಫೈಲ್' : language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Login / Profile Dropdown Popup */}
              {isLoginMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '230px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-card)',
                    padding: '14px',
                    zIndex: 1200,
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)'
                  }}
                >
                  {!isAuthenticated ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoginMenuOpen(false);
                          if (onNavigate) onNavigate('/login');
                          else if (onOpenAuth) onOpenAuth('login');
                        }}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 0',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}
                      >
                        {t.login}
                      </button>

                      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {t.dontHaveAccount}{' '}
                        <span
                          onClick={() => {
                            setIsLoginMenuOpen(false);
                            if (onNavigate) onNavigate('/signup');
                            else if (onOpenAuth) onOpenAuth('signup');
                          }}
                          style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {t.signup}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.welcomeBack}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {profile?.full_name || user?.email}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsLoginMenuOpen(false);
                          if (onNavigate) onNavigate('/account');
                          else if (onOpenAuth) onOpenAuth('profile');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left'
                        }}
                      >
                        <User size={15} color="var(--primary)" />
                        <span>{t.myAccount}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsLoginMenuOpen(false);
                          if (onNavigate) onNavigate('/orders');
                          else onTabChange('orders');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left'
                        }}
                      >
                        <Package size={15} color="var(--primary)" />
                        <span>{t.myOrders}</span>
                      </button>

                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '6px 0' }} />

                      <button
                        onClick={async () => {
                          setIsLoginMenuOpen(false);
                          await signOut();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#dc2626',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          textAlign: 'left'
                        }}
                      >
                        <LogOut size={15} color="#dc2626" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  )}

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

                  {/* Language switch quick row inside dropdown */}
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    {[
                      { code: 'en', label: 'EN' },
                      { code: 'hi', label: 'HI' },
                      { code: 'kn', label: 'KN' }
                    ].map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(l.code as SupportedLanguage);
                          voiceStore.setLanguage(l.code as SupportedLanguage);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: language === l.code ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          background: language === l.code ? 'var(--primary)' : 'transparent',
                          color: language === l.code ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search & Controls Row */}
        <div
          className="header-mobile-search-row"
          style={{ padding: '0 16px 10px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {/* Mobile Language Pills */}
            <div style={{ display: 'flex', gap: '3px', flex: 1, background: 'var(--bg-subtle)', padding: '2px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              {[
                { code: 'en', short: 'EN' },
                { code: 'hi', short: 'हिन्दी' },
                { code: 'kn', short: 'ಕನ್ನಡ' }
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(l.code as SupportedLanguage);
                    voiceStore.setLanguage(l.code as SupportedLanguage);
                  }}
                  style={{
                    flex: 1,
                    padding: '3px 4px',
                    borderRadius: '12px',
                    border: 'none',
                    background: language === l.code ? 'var(--primary)' : 'transparent',
                    color: language === l.code ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {l.short}
                </button>
              ))}
            </div>

            {/* Mobile Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#6366f1" />}
              <span>{theme === 'dark' ? t.lightMode : t.darkMode}</span>
            </button>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '40px',
              borderRadius: '20px',
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--primary)',
              padding: '0 8px 0 12px'
            }}
          >
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              id="voicecart-mobile-search-input"
              className="search-bar-input search-input voicecart-search-input"
              data-search-bar="true"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: 'var(--text-main)',
                caretColor: 'auto'
              }}
            />
            <button
              type="button"
              onClick={handleToggleVoice}
              style={{
                background: 'transparent',
                border: 'none',
                color: isMicListening ? '#ef4444' : 'var(--primary)',
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <Mic size={17} className={isMicListening ? 'mic-active-pulse' : ''} />
            </button>
          </form>
        </div>
      </header>

      {/* Pincode Modal */}
      {isLocationModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsLocationModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '380px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border-color)',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                background: 'var(--bg-subtle)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                <MapPin size={18} color="var(--primary)" />
                <span>{t.selectLocation}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 18px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Enter an Indian 6-digit PIN code to check live delivery speed and availability.
              </p>

              <form onSubmit={handleSaveLocation}>
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPincodeInput(val);
                    if (pincodeError) setPincodeError(null);
                  }}
                  placeholder="e.g. 560001"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: pincodeError ? '1.5px solid #dc2626' : '1.5px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    outline: 'none',
                    color: 'var(--text-main)',
                    marginBottom: '6px'
                  }}
                />
                {pincodeError && (
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginBottom: '12px' }}>
                    {pincodeError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.apply}
                  </button>

                  {savedLocation && (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {t.clearCart}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
