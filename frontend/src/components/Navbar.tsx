import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Package, Settings, Mic, Sun, Moon, Globe, User, LogOut, ChevronDown, Lock, Minimize2, Maximize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../i18n/translations';
import { PendingAuthAction } from '../types/auth';

export type TabType = 'home' | 'search' | 'cart' | 'orders' | 'settings';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount: number;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigate?: (path: string) => void;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'profile', notice?: string) => void;
  onProtectedAction?: (action: PendingAuthAction, notice?: string) => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  cartCount,
  language,
  onLanguageChange,
  onNavigate,
  onOpenAuth,
  onProtectedAction
}) => {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme, density, toggleDensity } = useTheme();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCartClick = () => {
    if (!isAuthenticated) {
      if (onProtectedAction) {
        onProtectedAction({ type: 'OPEN_CART' }, 'Please log in to view and manage your shopping cart.');
      } else if (onOpenAuth) {
        onOpenAuth('login', 'Please log in to view your cart.');
      }
      return;
    }
    onTabChange('cart');
  };

  const handleOrdersClick = () => {
    if (!isAuthenticated) {
      if (onProtectedAction) {
        onProtectedAction({ type: 'NAVIGATE_ROUTE', payload: { route: '/orders' } }, 'Please log in to view and track your orders.');
      } else if (onOpenAuth) {
        onOpenAuth('login', 'Please log in to track your orders.');
      }
      return;
    }
    if (onNavigate) {
      onNavigate('/orders');
    } else {
      onTabChange('orders');
    }
  };

  const userInitial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  const displayName = profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Member');

  return (
    <>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative'
        }}
      >
        <div
          onClick={() => onTabChange('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}
          >
            <Mic size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
              Voice<span style={{ color: '#06b6d4' }}>Cart</span>
            </h1>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Live Amazon • Flipkart • Meesho
            </div>
          </div>
        </div>

        {/* Desktop Quick Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onTabChange('search')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'search' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'search' ? '1px solid var(--primary)' : '1px solid transparent',
              color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Search size={16} /> Search & Compare
          </button>

          <button
            onClick={handleOrdersClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'orders' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: activeTab === 'orders' ? '1px solid var(--primary)' : '1px solid transparent',
              color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-secondary)',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Package size={16} />
            <span>Track Orders</span>
            {!isAuthenticated && <Lock size={12} color="var(--text-muted)" style={{ marginLeft: '2px' }} />}
          </button>

          {/* Cart Button */}
          <button
            onClick={handleCartClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'cart' ? 'var(--primary)' : 'var(--bg-pill)',
              border: '1px solid var(--border-color)',
              color: activeTab === 'cart' ? '#fff' : 'var(--text-main)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
            {isAuthenticated ? (
              cartCount > 0 && (
                <span
                  style={{
                    background: 'var(--accent-rose)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    fontWeight: 800,
                    marginLeft: '2px'
                  }}
                >
                  {cartCount}
                </span>
              )
            ) : (
              <Lock size={12} color="var(--text-muted)" style={{ marginLeft: '2px' }} />
            )}
          </button>

          {/* User Auth / Profile Menu */}
          {isAuthenticated ? (
            <div ref={profileMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-pill)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem'
                  }}
                >
                  {userInitial}
                </div>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '220px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
                    padding: '8px',
                    zIndex: 100,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.full_name || 'VoiceCart Member'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.email || (profile?.phone ? `+91 ${profile.phone}` : '')}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onNavigate) {
                        onNavigate('/orders');
                      } else {
                        onTabChange('orders');
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Package size={15} color="var(--primary)" />
                    <span>My Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onNavigate) {
                        onNavigate('/account');
                      } else if (onOpenAuth) {
                        onOpenAuth('profile');
                      }
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <User size={15} color="var(--secondary)" />
                    <span>Profile & Account</span>
                  </button>

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '6px 0' }} />

                  <button
                    onClick={async () => {
                      setIsProfileMenuOpen(false);
                      await signOut();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--accent-rose)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <LogOut size={15} color="var(--accent-rose)" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('/login');
                  else if (onOpenAuth) onOpenAuth('login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: '1.5px solid #1877f2',
                  color: '#1877f2',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Log in
              </button>

              <button
                onClick={() => {
                  if (onNavigate) onNavigate('/signup');
                  else if (onOpenAuth) onOpenAuth('signup');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#1877f2',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign up
              </button>
            </div>
          )}

          {/* Language Selector Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-pill)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '3px 6px',
              gap: '3px'
            }}
          >
            <Globe size={13} color="var(--text-muted)" style={{ marginLeft: '4px' }} />
            {[
              { code: 'auto', label: 'Auto' },
              { code: 'en', label: 'EN' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'kn', label: 'ಕನ್ನಡ' }
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => onLanguageChange(item.code as any)}
                style={{
                  background: language === item.code ? 'var(--primary)' : 'transparent',
                  color: language === item.code ? '#fff' : 'var(--text-main)',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: item.code === 'kn' ? "'Noto Sans Kannada', sans-serif" : 'inherit'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Density (Compact / Comfortable Screen) Switcher */}
          <button
            onClick={toggleDensity}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: density === 'compact' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-pill)',
              border: density === 'compact' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              color: density === 'compact' ? 'var(--primary)' : 'var(--text-main)',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'all 0.2s ease'
            }}
            title={density === 'compact' ? 'Switch to Comfortable View' : 'Switch to Compact Screen View'}
          >
            {density === 'compact' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span style={{ display: 'none', md: 'inline' } as any}>{density === 'compact' ? 'Compact' : 'Normal'}</span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-pill)',
              border: '1px solid var(--border-color)',
              color: theme === 'dark' ? '#fbbf24' : '#4f46e5',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => onTabChange('settings')}
            style={{
              background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-pill)',
              border: activeTab === 'settings' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            title="Settings & Status"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Fixed Tab Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-color)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 90
        }}
      >
        {[
          { id: 'home', label: 'Voice', icon: Mic },
          { id: 'search', label: 'Compare', icon: Search },
          { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: isAuthenticated ? cartCount : 0, requiresAuth: true },
          { id: 'orders', label: 'Orders', icon: Package, requiresAuth: true },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.requiresAuth && !isAuthenticated) {
                  if (tab.id === 'cart') handleCartClick();
                  else if (tab.id === 'orders') handleOrdersClick();
                  return;
                }
                onTabChange(tab.id as TabType);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} />
                {tab.badge && tab.badge > 0 ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-8px',
                      background: 'var(--accent-rose)',
                      color: '#fff',
                      fontSize: '0.62rem',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      fontWeight: 800
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

