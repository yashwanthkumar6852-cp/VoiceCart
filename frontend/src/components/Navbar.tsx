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
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SupportedLanguage, translations } from '../i18n/translations';
import { PendingAuthAction } from '../types/auth';
import { useVoice } from '../hooks/useVoice';
import { commandRouter } from '../voice/commandRouter';
import { actionDispatcher, DispatcherHandlers } from '../voice/dispatcher';
import { voiceStore } from '../voice/voiceStore';
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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (loginMenuRef.current && !loginMenuRef.current.contains(target)) {
        setIsLoginMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
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
      if (!transcript.trim()) return;
      setSearchInput(transcript);
      setVoiceTooltip(`Heard: "${transcript}"`);
      setTimeout(() => setVoiceTooltip(null), 3000);

      if (voiceHandlers) {
        try {
          const currentContext = voiceStore.getContext();
          const targetLang: SupportedLanguage = language === 'auto' ? 'en' : language;
          const commandResult = await commandRouter.route(transcript, currentContext, targetLang);

          if (commandResult.action === 'search') {
            const queryToSearch = commandResult.params?.query || transcript;
            if (onSearch) onSearch(queryToSearch, selectedCategory);
          } else {
            await actionDispatcher.dispatch(commandResult, voiceHandlers, transcript);
          }
        } catch (err) {
          console.error('Voice routing error in header:', err);
          if (onSearch) onSearch(transcript, selectedCategory);
        }
      } else if (onSearch) {
        onSearch(transcript, selectedCategory);
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
    } catch {}
    setPincodeError(null);
    setIsLocationModalOpen(false);
  };

  const handleClearLocation = () => {
    setSavedLocation(null);
    try {
      localStorage.removeItem('voicecart_delivery_location');
    } catch {}
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

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Yashwanth');

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'var(--nav-bg)',
          color: 'var(--text-main)',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          width: '100%',
          fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        <div
          style={{
            maxWidth: '1680px',
            margin: '0 auto',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* 1. Left: VoiceCart Logo + Deliver to */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <div
              onClick={() => {
                if (onNavigate) onNavigate('/');
                onTabChange('home');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
              title="VoiceCart Home"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
                }}
              >
                <Mic size={20} color="#ffffff" strokeWidth={2.4} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    lineHeight: 1,
                    letterSpacing: '-0.3px'
                  }}
                >
                  Voice<span style={{ color: 'var(--primary)' }}>Cart</span>
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                    marginTop: '2px'
                  }}
                >
                  {t.speakSearchShop}
                </div>
              </div>
            </div>

            {/* Deliver To Location Capsule */}
            <div
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                transition: 'border-color 0.15s ease'
              }}
              title={t.selectLocation}
            >
              <MapPin size={15} color="var(--primary)" />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.deliverTo}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {savedLocation ? `${savedLocation.city}` : t.selectLocation}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Center: Search Bar Capsule */}
          <div
            className="header-search-container"
            style={{
              flex: '1 1 440px',
              maxWidth: '680px',
              position: 'relative'
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '42px',
                borderRadius: '9999px',
                background: 'var(--bg-subtle)',
                border: isSearchFocused ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                boxShadow: isSearchFocused ? '0 0 0 3px var(--primary-glow)' : 'none',
                overflow: 'hidden',
                padding: '0 5px 0 14px',
                transition: 'all 0.15s ease'
              }}
            >
              <Search size={17} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={t.searchPlaceholder}
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.86rem',
                  color: 'var(--text-main)',
                  fontWeight: 500
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
                    color: 'var(--text-muted)',
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
                type="button"
                onClick={handleToggleVoice}
                title={isMicListening ? `${t.listeningPrompt}` : t.searchTooltip}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isMicListening ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  transition: 'transform 0.15s ease'
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
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card)',
                  zIndex: 1100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  border: isMicListening ? '2px solid var(--accent-rose)' : '1px solid var(--border-color)'
                }}
              >
                {isMicListening && <Mic size={15} color="#ef4444" className="mic-active-pulse" />}
                <span>{liveTranscript ? `${t.listening} "${liveTranscript}"` : voiceTooltip || t.listening}</span>
              </div>
            )}
          </div>

          {/* 3. Right Action Icons & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Language Switcher Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--bg-subtle)',
                padding: '2px 4px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)'
              }}
            >
              <Globe size={13} color="var(--text-muted)" style={{ margin: '0 3px' }} />
              {[
                { code: 'en', label: 'English', short: 'EN' },
                { code: 'hi', label: 'हिन्दी', short: 'HI' },
                { code: 'kn', label: 'ಕನ್ನಡ', short: 'KN' }
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(l.code as SupportedLanguage);
                    voiceStore.setLanguage(l.code as SupportedLanguage);
                  }}
                  title={l.label}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '14px',
                    border: 'none',
                    background: language === l.code ? 'var(--primary)' : 'transparent',
                    color: language === l.code ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {l.short}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? t.lightMode : t.darkMode}
              aria-label="Toggle Light and Dark Mode"
              style={{
                padding: '5px 10px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? (
                <Sun size={15} color="#f59e0b" />
              ) : (
                <Moon size={15} color="#6366f1" />
              )}
              <span className="theme-toggle-text" style={{ fontSize: '0.76rem' }}>
                {theme === 'dark' ? t.lightMode : t.darkMode}
              </span>
            </button>

            {/* Compare Link */}
            <div
              onClick={() => onTabChange('search')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                borderRadius: '6px',
                transition: 'color 0.15s ease'
              }}
              title={t.compare}
            >
              <Scale size={16} color="var(--text-muted)" />
              <span>{t.compare}</span>
            </div>

            {/* Cart Button */}
            <div
              onClick={handleCartClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                padding: '4px 6px',
                borderRadius: '6px',
                transition: 'color 0.15s ease'
              }}
              title={t.cart}
            >
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={18} color="var(--text-muted)" />
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-9px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    lineHeight: '14px'
                  }}
                >
                  {cartCount > 0 ? cartCount : 0}
                </span>
              </div>
              <span>{t.cart}</span>
            </div>

            {/* Profile Dropdown */}
            <div ref={loginMenuRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setIsLoginMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  padding: '5px 8px',
                  borderRadius: '24px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  transition: 'background 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  {isAuthenticated ? displayName.charAt(0).toUpperCase() : 'Y'}
                </div>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAuthenticated ? `Hi, ${displayName.split(' ')[0]}` : 'Hi, Yashwanth'}
                </span>
                <ChevronDown size={13} color="var(--text-muted)" />
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
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.searchPlaceholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                color: 'var(--text-main)'
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
