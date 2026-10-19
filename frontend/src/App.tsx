import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Sparkles, Filter, SlidersHorizontal, RefreshCw, ShoppingCart, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CartItem, OrderRecord, Product, RankingPreference, SearchFilters, SearchResponse, StoreName, StoreStatus, VoiceIntentResult } from './types';
import { api, subscribeServerStatus, ServerWakeStatus, formatApiErrorMessage } from './lib/api';
import { Navbar, TabType } from './components/Navbar';
import { VoiceMicButton } from './components/VoiceMicButton';
import { ProductCard } from './components/ProductCard';
import { ProductRow } from './components/ProductRow';
import { StoreComparisonTable } from './components/StoreComparisonTable';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductImage } from './components/ProductImage';
import { CartScreen } from './components/CartScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { DebugPanel } from './components/DebugPanel';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { AccountPage, AccountSection } from './pages/AccountPage';
import { OrdersListPage } from './pages/OrdersListPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CrossStoreComparisonPage } from './pages/CrossStoreComparisonPage';
import { LayoutGrid, List, X, Layers, CloudLightning } from 'lucide-react';
import { CategoryIconTabBar } from './components/CategoryIconTabBar';
import { useAuth } from './context/AuthContext';
import { PendingAuthAction } from './types/auth';
import { voiceStore } from './voice/voiceStore';
import { actionDispatcher, DispatcherHandlers } from './voice/dispatcher';
import { translations, SupportedLanguage } from './i18n/translations';

export const App: React.FC = () => {
  const { user, isAuthenticated, authState, signOut, pendingAction, setPendingAction } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [serverStatus, setServerStatus] = useState<ServerWakeStatus>({ wakingUp: false });

  // Subscribe to backend cold start wakeup notifications
  useEffect(() => {
    const unsub = subscribeServerStatus((status) => {
      setServerStatus(status);
    });
    return unsub;
  }, []);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voicecart_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Trending Categories Dashboard Feed State
  const [feedCategory, setFeedCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cat = new URLSearchParams(window.location.search).get('category');
      return cat ? (cat === 'for_you' ? 'all' : cat) : 'all';
    }
    return 'all';
  });
  const [feedProducts, setFeedProducts] = useState<Product[]>([]);
  const [feedLoading, setFeedLoading] = useState<boolean>(true);
  const [feedStatus, setFeedStatus] = useState<'ready' | 'building' | 'unavailable'>('building');
  const [feedLastUpdated, setFeedLastUpdated] = useState<string>('');
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedSubCategory, setFeedSubCategory] = useState<string>('all');
  const [feedSort, setFeedSort] = useState<string>('relevance');
  const [feedPage, setFeedPage] = useState<number>(1);
  const [feedTotalPages, setFeedTotalPages] = useState<number>(1);
  const [feedTotalProducts, setFeedTotalProducts] = useState<number>(0);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [catalogBrands, setCatalogBrands] = useState<{ brand: string; count: number }[]>([]);
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const feedPollingTimerRef = useRef<any>(null);
  const inFlightFeedRef = useRef<string | null>(null);
  const initialDataLoadedRef = useRef<boolean>(false);

  const [filters, setFilters] = useState<SearchFilters>({
    preference: 'balanced',
    inStockOnly: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [storeStatuses, setStoreStatuses] = useState<StoreStatus[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'profile'>('login');
  const [authPendingNotice, setAuthPendingNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [paymentTab, setPaymentTab] = useState<'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking'>('upi');
  const [layoutMode, setLayoutMode] = useState<'row' | 'grid'>('row');
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const t = translations[language] || translations.en;

  const addToSearchHistory = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('voicecart_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeSearchHistoryItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((i) => i !== item);
      try {
        localStorage.setItem('voicecart_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.productId === product.productId && p.store === product.store);
      if (exists) {
        return prev.filter((p) => !(p.productId === product.productId && p.store === product.store));
      }
      if (prev.length >= 4) {
        showToast('You can compare a maximum of 4 products at once.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0]);
  }, []);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync conversation state store whenever UI state changes
  useEffect(() => {
    voiceStore.setCurrentScreen(activeTab);
    voiceStore.setSearchResults(searchResponse);
    voiceStore.setSelectedProduct(selectedProduct);
    voiceStore.setCart(cart);
    voiceStore.setOrders(orders);
    voiceStore.setLanguage(language);
    voiceStore.setActivePaymentTab(paymentTab);
  }, [activeTab, searchResponse, selectedProduct, cart, orders, language, paymentTab]);

  // Handle client-side route guards on load (/cart, /orders, /orders/:id, /payment, /profile)
  useEffect(() => {
    if (currentPath === '/cart') {
      if (!isAuthenticated) {
        handleProtectedAction({ type: 'OPEN_CART' }, 'Please log in to view your cart.');
      } else {
        setActiveTab('cart');
      }
    } else if (currentPath === '/orders') {
      if (!isAuthenticated) {
        handleProtectedAction({ type: 'NAVIGATE_ROUTE', payload: { route: '/orders' } }, 'Please log in to view your orders.');
      } else {
        setActiveTab('orders');
      }
    } else if (currentPath.startsWith('/orders/')) {
      if (!isAuthenticated) {
        handleProtectedAction({ type: 'NAVIGATE_ROUTE', payload: { route: currentPath } }, 'Please log in to view your order details.');
      } else {
        setActiveTab('orders');
      }
    } else if (currentPath === '/payment') {
      if (!isAuthenticated) {
        handleProtectedAction({ type: 'OPEN_PAYMENT' }, 'Please log in to proceed to checkout.');
      } else {
        setActiveTab('cart');
      }
    } else if (currentPath === '/profile' || currentPath === '/account' || currentPath.startsWith('/account/')) {
      if (!isAuthenticated) {
        handleProtectedAction({ type: 'NAVIGATE_ROUTE', payload: { route: '/account' } }, 'Please log in to view your profile and account settings.');
      }
    } else if (currentPath === '/magic-login') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        api.magicVerifyOtp(token)
          .then((res) => {
            if (res.success) {
              navigate('/');
            }
          })
          .catch((err) => {
            console.error('Magic link verification error:', err);
            navigate('/login');
          });
      }
    }
  }, [currentPath, isAuthenticated]);

  const handleSelectCategory = (catId: string) => {
    const cleanCat = catId === 'for_you' ? 'all' : catId;
    setFeedCategory(cleanCat);
    setFeedSubCategory('all');
    setSelectedBrand('all');
    setFeedPage(1);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (cleanCat === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', cleanCat);
      }
      url.searchParams.delete('subCategory');
      window.history.replaceState({}, '', url.toString());
    }
    loadDashboardFeed(cleanCat, false, 1, 'all', feedSort, 'all');
  };

  const loadDashboardFeed = useCallback(async (
    cat = feedCategory,
    refresh = false,
    page = feedPage,
    subCat = feedSubCategory,
    sort = feedSort,
    brand = selectedBrand
  ) => {
    const requestKey = `${cat}_${subCat}_${brand}_${selectedStoreFilter || 'all'}_${page}_${sort}_${refresh}`;
    if (inFlightFeedRef.current === requestKey) {
      return;
    }
    inFlightFeedRef.current = requestKey;

    if (feedPollingTimerRef.current) {
      clearTimeout(feedPollingTimerRef.current);
      feedPollingTimerRef.current = null;
    }

    setFeedLoading(true);
    setFeedError(null);

    try {
      // 1. Instant local catalog response
      const catalogData = await api.browseCatalog({
        category: cat === 'all' ? undefined : cat,
        subCategory: subCat !== 'all' ? subCat : undefined,
        store: selectedStoreFilter !== 'all' ? selectedStoreFilter : undefined,
        brand: brand !== 'all' ? brand : undefined,
        page,
        limit: 24,
        sort
      });

      if (catalogData && catalogData.products && catalogData.products.length > 0) {
        setFeedProducts(catalogData.products);
        setFeedTotalPages(catalogData.totalPages || 1);
        setFeedTotalProducts(catalogData.total || catalogData.products.length);
        setFeedStatus('ready');
        setFeedLastUpdated(catalogData.lastUpdated || new Date().toISOString());
      } else {
        // Fallback to legacy dashboard feed
        const data = await api.getDashboardFeed(cat, selectedStoreFilter, refresh);
        setFeedStatus(data.status);
        const items = data.items || data.products || [];
        setFeedProducts(items);
        setFeedTotalPages(1);
        setFeedTotalProducts(items.length);
        if (data.updatedAt || data.lastUpdated) {
          setFeedLastUpdated(data.updatedAt || data.lastUpdated);
        }
      }

      // Concurrently fetch top deals and brands in background
      api.getTopDeals(cat === 'all' ? undefined : cat, 8).then((deals) => {
        if (Array.isArray(deals)) setTopDeals(deals);
      }).catch(() => {});

      api.getCatalogBrands(cat === 'all' ? undefined : cat).then((brands) => {
        if (Array.isArray(brands)) setCatalogBrands(brands);
      }).catch(() => {});

    } catch (err: any) {
      console.warn('Catalog browse fallback to feed:', err.message);
      try {
        const data = await api.getDashboardFeed(cat, selectedStoreFilter, refresh);
        setFeedStatus(data.status);
        const items = data.items || data.products || [];
        setFeedProducts(items);
      } catch (feedErr: any) {
        const formatted = formatApiErrorMessage(feedErr, `Feed (${cat})`);
        setFeedError(formatted);
      }
    } finally {
      inFlightFeedRef.current = null;
      setFeedLoading(false);
    }
  }, [feedCategory, feedSubCategory, selectedBrand, selectedStoreFilter, feedPage, feedSort]);

  // Clean up polling timer on unmount
  useEffect(() => {
    return () => {
      if (feedPollingTimerRef.current) {
        clearTimeout(feedPollingTimerRef.current);
      }
    };
  }, []);

  // 1. Initial public data load (Store Status & Initial Feed) - Independent of Auth
  useEffect(() => {
    let isCancelled = false;

    const loadPublicData = async () => {
      try {
        const statuses = await api.getStatuses();
        if (!isCancelled) {
          setStoreStatuses(statuses);
        }
      } catch (err) {
        if (!isCancelled) console.warn('Store status load warning:', err);
      }

      // Load live trending feed on initial page load (respecting ?category URL param)
      if (!isCancelled && !initialDataLoadedRef.current) {
        initialDataLoadedRef.current = true;
        const initialCat = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('category') || 'all'
          : 'all';
        loadDashboardFeed(initialCat);
      }
    };

    loadPublicData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Protected user data load (Cart & Orders) - Gated by authState
  useEffect(() => {
    // Session is still restoring (POST /api/auth/refresh pending). Wait!
    if (authState === 'loading') {
      return;
    }

    // Guest mode: do not call /api/cart or /api/orders! Maintain clean empty local state.
    if (authState === 'guest') {
      setCart([]);
      setOrders([]);
      return;
    }

    // Authenticated mode: session is restored, fetch user cart and orders
    if (authState === 'authenticated') {
      let isCancelled = false;

      const loadUserData = async () => {
        try {
          const [cartResult, ordersResult] = await Promise.allSettled([
            api.getCart(),
            api.getOrders()
          ]);

          if (isCancelled) return;
          if (cartResult.status === 'fulfilled') setCart(cartResult.value);
          if (ordersResult.status === 'fulfilled') {
            const val: any = ordersResult.value;
            setOrders(Array.isArray(val) ? val : val?.orders || []);
          }
        } catch (err) {
          if (!isCancelled) console.warn('User data load warning:', err);
        }
      };

      loadUserData();

      return () => {
        isCancelled = true;
      };
    }
  }, [authState]);

  const handleProtectedAction = (action: PendingAuthAction, notice?: string) => {
    setPendingAction(action);
    setAuthPendingNotice(notice || 'Please log in to continue.');
    navigate('/login');
  };

  const activeSearchIdRef = useRef<string>('');
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResponse(null);
    setSelectedProduct(null);
    setComparedProducts([]);
    if (activeAbortControllerRef.current) activeAbortControllerRef.current.abort();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    loadDashboardFeed(feedCategory);
  };

  const handleSearch = async (query: string, customFilters?: SearchFilters): Promise<SearchResponse | undefined> => {
    if (!query.trim()) {
      handleClearSearch();
      return undefined;
    }

    addToSearchHistory(query);
    setIsSearchFocused(false);

    // 1. Cancel any previous in-flight search and stop ongoing speech synthesis
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const searchId = `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    activeSearchIdRef.current = searchId;

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setIsLoading(true);
    setSelectedProduct(null);
    voiceStore.startSearch(searchId, query);

    const activeFilters: SearchFilters = {
      ...(customFilters || filters),
      requestId: searchId,
      ...(language ? { language } : {}) as any,
      signal: controller.signal
    } as any;

    try {
      const res = await api.search(query, activeFilters);

      // Ignore responses from older searches
      if (activeSearchIdRef.current !== searchId) {
        return undefined;
      }

      voiceStore.completeSearch(res);
      setSearchResponse(res);
      setSearchQuery(query);
      return res;
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.message === 'canceled') {
        return undefined;
      }
      console.error('Search failed:', err);
      voiceStore.failSearch(searchId, err.message || 'Search failed');
      return undefined;
    } finally {
      if (activeSearchIdRef.current === searchId) {
        setIsLoading(false);
      }
    }
  };

  const handleAddToCart = async (product: Product, quantity = 1) => {
    if (!isAuthenticated) {
      handleProtectedAction(
        { type: 'ADD_TO_CART', payload: { product, quantity } },
        'Please log in to add items to your cart.'
      );
      return;
    }

    try {
      const res = await api.addToCart(product, quantity);
      if (res && Array.isArray(res.cart)) {
        setCart(res.cart);
        voiceStore.setCart(res.cart);
      } else {
        const refreshed = await api.getCart();
        setCart(refreshed);
        voiceStore.setCart(refreshed);
      }
      const addedMsg =
        language === 'kn'
          ? `ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ: ${product.title.slice(0, 24)}...`
          : language === 'hi'
          ? `कार्ट में जोड़ा गया: ${product.title.slice(0, 24)}...`
          : `Added to cart: ${product.title.slice(0, 24)}...`;
      showToast(addedMsg);
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
      showToast('Failed to add item to cart. Please try again.');
    }
  };

  const handleRemoveFromCart = async (id: string) => {
    try {
      const res = await api.removeFromCart(id);
      setCart(res.cart);
    } catch (err) {
      console.error('Failed to remove cart item:', err);
    }
  };

  const handleClearCart = async () => {
    try {
      await api.clearCart();
      setCart([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  // Execute pending action after successful login
  const isExecutingPendingRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && pendingAction && !isExecutingPendingRef.current) {
      isExecutingPendingRef.current = true;
      const currentAction = pendingAction;
      setPendingAction(null);

      (async () => {
        try {
          if (currentAction.type === 'ADD_TO_CART') {
            await handleAddToCart(currentAction.payload.product, currentAction.payload.quantity || 1);
            showToast('Item automatically added to your cart!');
          } else if (currentAction.type === 'BUY_NOW') {
            await handleAddToCart(currentAction.payload.product, 1);
            setActiveTab('cart');
          } else if (currentAction.type === 'OPEN_CART') {
            setActiveTab('cart');
          } else if (currentAction.type === 'OPEN_ORDERS') {
            setActiveTab('orders');
            navigate('/orders');
          } else if (currentAction.type === 'NAVIGATE_ROUTE') {
            navigate(currentAction.payload.route);
          } else if (currentAction.type === 'OPEN_PAYMENT') {
            setActiveTab('cart');
          } else if (currentAction.type === 'VOICE_COMMAND') {
            await actionDispatcher.dispatch(
              currentAction.payload.command,
              dispatcherHandlers,
              currentAction.payload.transcript
            );
          }
        } catch (err) {
          console.error('Failed to execute pending action:', err);
        } finally {
          isExecutingPendingRef.current = false;
        }
      })();
    }
  }, [isAuthenticated, pendingAction]);

  // Typed Action Dispatcher Handlers
  const dispatcherHandlers: DispatcherHandlers = {
    isAuthenticated,
    onNavigate: (tab) => {
      if ((tab === 'cart' || tab === 'orders') && !isAuthenticated) {
        handleProtectedAction(
          { type: tab === 'cart' ? 'OPEN_CART' : 'OPEN_ORDERS' },
          tab === 'cart' ? 'Please log in to view your cart.' : 'Please log in to view your orders.'
        );
        return;
      }
      setActiveTab(tab);
      voiceStore.setCurrentScreen(tab);
    },
    onNavigateRoute: (route) => {
      navigate(route);
    },
    onSearch: async (query, customFilters) => {
      return await handleSearch(query, customFilters);
    },
    onAddToCart: async (product, quantity) => {
      await handleAddToCart(product, quantity);
    },
    onRemoveFromCart: async (cartItemId) => {
      await handleRemoveFromCart(cartItemId);
    },
    onClearCart: async () => {
      await handleClearCart();
    },
    onOpenProductDetail: (product) => {
      setSelectedProduct(product);
      voiceStore.setSelectedProduct(product);
    },
    onCloseProductDetail: () => {
      setSelectedProduct(null);
      voiceStore.setSelectedProduct(null);
    },
    onSetPaymentTab: (tab) => {
      setPaymentTab(tab);
      voiceStore.setActivePaymentTab(tab);
      setActiveTab('cart');
    },
    onSetLanguage: (lang) => {
      setLanguage(lang);
      voiceStore.setLanguage(lang);
    },
    onOpenPaymentModal: () => {
      setActiveTab('cart');
    },
    onSelectCategory: (cat) => {
      handleSelectCategory(cat);
    },
    onCheckoutPartner: (storeUrl) => {
      window.open(storeUrl, '_blank');
    },
    onOpenAuth: (mode = 'login') => {
      if (mode === 'signup') navigate('/signup');
      else if (mode === 'login') navigate('/login');
      else {
        setAuthModalMode('profile');
        setIsAuthModalOpen(true);
      }
    },
    onSignOut: async () => {
      await signOut();
      showToast('Signed out successfully.');
    },
    onSavePendingVoiceCommand: (command, transcript) => {
      setPendingAction({ type: 'VOICE_COMMAND', payload: { command, transcript } });
    }
  };

  const handleConfirmYes = async () => {
    await actionDispatcher.dispatch(
      {
        action: 'confirm_yes',
        params: {},
        layer: 'rule',
        confidence: 1.0,
        language,
        reply: 'Confirmed.'
      },
      dispatcherHandlers,
      'yes'
    );
  };

  const handleConfirmNo = async () => {
    await actionDispatcher.dispatch(
      {
        action: 'confirm_no',
        params: {},
        layer: 'rule',
        confidence: 1.0,
        language,
        reply: 'Cancelled.'
      },
      dispatcherHandlers,
      'no'
    );
  };

  // FULL STANDALONE PAGES (No Dashboard Header / Voice Mic)
  if (currentPath === '/login') {
    return (
      <LoginPage
        onNavigate={navigate}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          voiceStore.setLanguage(l);
        }}
        pendingNotice={authPendingNotice}
      />
    );
  }

  if (currentPath === '/signup') {
    return (
      <SignupPage
        onNavigate={navigate}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          voiceStore.setLanguage(l);
        }}
        pendingNotice={authPendingNotice}
      />
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigate={navigate}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          voiceStore.setLanguage(l);
        }}
      />
    );
  }

  if (currentPath === '/reset-password') {
    return (
      <ResetPasswordPage
        onNavigate={navigate}
        language={language}
      />
    );
  }

  if (currentPath === '/terms') {
    return (
      <TermsPage
        onNavigate={navigate}
        language={language}
      />
    );
  }

  if (currentPath === '/privacy') {
    return (
      <PrivacyPage
        onNavigate={navigate}
        language={language}
      />
    );
  }

  if (currentPath.startsWith('/orders/')) {
    if (!isAuthenticated) {
      return null;
    }
    const orderIdParam = currentPath.replace('/orders/', '').split('/')[0];
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab="orders"
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          language={language}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          onNavigate={navigate}
          onOpenAuth={(mode = 'login', notice) => {
            if (mode === 'signup') navigate('/signup');
            else if (mode === 'login') navigate('/login');
            else navigate('/account');
          }}
          onProtectedAction={handleProtectedAction}
        />
        <OrderDetailPage
          orderId={orderIdParam}
          onNavigateRoute={navigate}
          onAddToCart={handleAddToCart}
          language={language}
          showToast={showToast}
        />
      </div>
    );
  }

  if (currentPath === '/orders') {
    if (!isAuthenticated) {
      return null;
    }
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab="orders"
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          language={language}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          onNavigate={navigate}
          onOpenAuth={(mode = 'login', notice) => {
            if (mode === 'signup') navigate('/signup');
            else if (mode === 'login') navigate('/login');
            else navigate('/account');
          }}
          onProtectedAction={handleProtectedAction}
        />
        <OrdersListPage
          onNavigateRoute={navigate}
          onAddToCart={handleAddToCart}
          language={language}
          showToast={showToast}
        />
      </div>
    );
  }

  if (currentPath === '/account' || currentPath.startsWith('/account/') || currentPath === '/profile') {
    if (!isAuthenticated) {
      return null;
    }
    const subSection = (currentPath.startsWith('/account/') ? currentPath.replace('/account/', '') : 'profile') as AccountSection;
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab="settings"
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          language={language}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          onNavigate={navigate}
          onOpenAuth={(mode = 'login', notice) => {
            if (mode === 'signup') navigate('/signup');
            else if (mode === 'login') navigate('/login');
            else navigate('/account');
          }}
          onProtectedAction={handleProtectedAction}
        />
        <AccountPage
          initialSection={subSection}
          onNavigateRoute={navigate}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          currentLanguage={language}
          onNavigateToOrdersTab={() => {
            navigate('/orders');
            setActiveTab('orders');
          }}
        />
      </div>
    );
  }

  if (currentPath.startsWith('/product/')) {
    const urlObj = new URL(window.location.href);
    const pathname = urlObj.pathname;
    const parts = pathname.replace('/product/', '').split('/');
    const productStore = decodeURIComponent(parts[0] || 'amazon');
    const productStoreId = decodeURIComponent(parts.slice(1).join('/') || '');
    const sid = urlObj.searchParams.get('sid') || searchResponse?.sessionId || searchResponse?.searchId || '';

    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          language={language}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          onNavigate={navigate}
          onOpenAuth={(mode = 'login') => {
            if (mode === 'signup') navigate('/signup');
            else if (mode === 'login') navigate('/login');
            else navigate('/account');
          }}
          onProtectedAction={handleProtectedAction}
        />
        <ProductDetailsPage
          store={productStore}
          productId={productStoreId}
          sessionId={sid}
          initialProduct={selectedProduct}
          onNavigateRoute={navigate}
          onAddToCart={handleAddToCart}
          language={language}
          showToast={showToast}
        />
      </div>
    );
  }

  if (currentPath.startsWith('/compare/specs')) {
    const productKeyParam = currentPath.replace('/compare/specs/', '').replace('/compare/specs', '').split('/')[0] || '';
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          language={language}
          onLanguageChange={(l) => {
            setLanguage(l);
            voiceStore.setLanguage(l);
          }}
          onNavigate={navigate}
          onOpenAuth={(mode = 'login', notice) => {
            if (mode === 'signup') navigate('/signup');
            else if (mode === 'login') navigate('/login');
            else navigate('/account');
          }}
          onProtectedAction={handleProtectedAction}
        />
        <CrossStoreComparisonPage
          productKey={productKeyParam || undefined}
          onNavigateRoute={navigate}
          onAddToCart={handleAddToCart}
          language={language}
          showToast={showToast}
        />
      </div>
    );
  }

  // MAIN DASHBOARD APPLICATION
  return (
    <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
      {/* Server Wakeup Notification Banner (Render Free Tier Cold Start) */}
      {serverStatus.wakingUp && (
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(49, 46, 129, 0.95))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(129, 140, 248, 0.6)',
            color: '#e0e7ff',
            padding: '10px 20px',
            borderRadius: '9999px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.84rem',
            fontWeight: 600,
            animation: 'pulse 2s infinite ease-in-out',
            maxWidth: '90vw'
          }}
        >
          <CloudLightning size={18} className="animate-spin" color="#818cf8" />
          <span>{serverStatus.message || 'Waking up the cloud server... Please wait a few seconds.'}</span>
        </div>
      )}

      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-green)" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if ((tab === 'cart' || tab === 'orders') && !isAuthenticated) {
            handleProtectedAction(
              { type: tab === 'cart' ? 'OPEN_CART' : 'OPEN_ORDERS' },
              tab === 'cart' ? 'Please log in to view your cart.' : 'Please log in to view your orders.'
            );
            return;
          }
          setActiveTab(tab);
        }}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        language={language}
        onLanguageChange={(l) => {
          setLanguage(l);
          voiceStore.setLanguage(l);
        }}
        onNavigate={navigate}
        onOpenAuth={(mode = 'login', notice) => {
          if (mode === 'signup') navigate('/signup');
          else if (mode === 'login') navigate('/login');
          else {
            setAuthModalMode('profile');
            setAuthPendingNotice(notice || null);
            setIsAuthModalOpen(true);
          }
        }}
        onProtectedAction={handleProtectedAction}
      />

      {/* Hero Voice Hub (Visible on Home & Search) */}
      {(activeTab === 'home' || activeTab === 'search') && (
        <section
          className="glass-panel hero-voice-section"
          style={{
            padding: '24px 20px',
            marginBottom: '20px',
            textAlign: 'center',
            background: 'var(--hero-bg)',
            border: '1px solid var(--hero-border)'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid #06b6d4', color: '#06b6d4', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '16px' }}>
            <Sparkles size={14} /> {t.heroTag}
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {t.heroTitle}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {t.heroSubtitle}
          </p>

          {/* Voice Microphone Controller with Kannada, Hindi, and English */}
          <VoiceMicButton
            language={language}
            onLanguageChange={(l) => {
              setLanguage(l);
              voiceStore.setLanguage(l);
            }}
            handlers={dispatcherHandlers}
            context={{
              selectedProduct: searchResponse?.topRecommendations?.bestOverall || selectedProduct,
              cart
            }}
          />

          {/* Search Input Box with Clear (X) and Search History Dropdown */}
          <div style={{ maxWidth: '640px', margin: '24px auto 0', position: 'relative' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(searchQuery);
              }}
              style={{ display: 'flex', gap: '8px', position: 'relative' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                  placeholder="Search for a product, e.g. boAt earbuds under 2000"
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: searchQuery ? '40px' : '16px' }}
                />
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />

                {/* Clear (X) button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Search History Dropdown (Shown only when input is focused) */}
                {isSearchFocused && searchHistory.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-card, #0f172a)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      overflow: 'hidden',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border-subtle)' }}>
                      Recent Searches
                    </div>
                    {searchHistory.map((item, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => {
                          setSearchQuery(item);
                          handleSearch(item);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontSize: '0.86rem',
                          borderBottom: idx < searchHistory.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Search size={14} color="var(--text-muted)" />
                          <span>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeSearchHistoryItem(e, item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title="Remove search"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  border: 'none',
                  color: '#fff',
                  padding: '0 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isLoading ? <RefreshCw size={16} className="mic-active-pulse" /> : <Search size={16} />}
                {t.searchBtn}
              </button>
            </form>

            {/* Quick Suggestions Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              {t.quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(pill);
                    handleSearch(pill);
                  }}
                  style={{
                    background: 'var(--bg-pill)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: language === 'kn' ? "'Noto Sans Kannada', sans-serif" : 'inherit'
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Tab Views */}
      {(activeTab === 'home' || activeTab === 'search') && (
        <main>
          {/* A. ACTIVE SEARCH RESULTS VIEW */}
          {searchResponse && searchQuery.trim() ? (
            <div>
              {/* Unified Search Outcome Banner */}
              <div
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  marginBottom: '20px',
                  borderLeft:
                    searchResponse.outcome?.status === 'exact_found' || searchResponse.isExactMatch
                      ? '4px solid var(--accent-green, #10b981)'
                      : searchResponse.outcome?.status === 'similar_only'
                      ? '4px solid var(--accent-gold, #f59e0b)'
                      : '4px solid #ef4444',
                  background:
                    searchResponse.outcome?.status === 'exact_found' || searchResponse.isExactMatch
                      ? 'rgba(16, 185, 129, 0.07)'
                      : searchResponse.outcome?.status === 'similar_only'
                      ? 'rgba(245, 158, 11, 0.07)'
                      : 'rgba(239, 68, 68, 0.07)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                      You searched for:
                    </span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {searchResponse.outcome?.cleanProductName || searchResponse.parsedQuery?.displayName || searchResponse.query}
                    </div>
                  </div>

                  <div>
                    {searchResponse.outcome?.status === 'exact_found' || searchResponse.isExactMatch ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid #10b981',
                          color: '#10b981',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        <CheckCircle2 size={16} /> Exact Match Found ✓
                      </div>
                    ) : searchResponse.outcome?.status === 'similar_only' ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid #f59e0b',
                          color: '#f59e0b',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        Exact product not found, showing similar
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        No exact results
                      </div>
                    )}
                  </div>
                </div>

                {/* Synchronized Written & Spoken Explanation */}
                {searchResponse.replyText && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, maxWidth: '780px' }}>
                      {searchResponse.replyText}
                    </p>
                  </div>
                )}
              </div>

              {/* Comparison Table */}
              {searchResponse?.comparisonMatrix && (
                <StoreComparisonTable
                  comparisonMatrix={searchResponse.comparisonMatrix}
                  storeStatuses={searchResponse.storeStatuses}
                />
              )}

              {/* Results Header with Sorting / Filter Options / View Switcher */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  gap: '12px',
                  background: 'var(--bg-card, #fff)',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    {searchResponse?.isExactMatch === false ? (
                      <span style={{ color: 'var(--accent-gold, #f59e0b)' }}>Similar Alternatives</span>
                    ) : (
                      <span>{searchResponse ? `${t.rankedResultsFor} "${searchResponse.parsedQuery?.displayName || searchResponse.query}"` : t.rankedResultsFor}</span>
                    )}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {searchResponse ? `${searchResponse.totalResults} items analyzed across Amazon, Flipkart & Meesho` : ''}
                  </span>
                </div>

                {/* Filter Preference Controls & Layout Toggle */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  {/* Store Filter Pills */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {['all', 'amazon', 'flipkart', 'meesho'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStoreFilter(st)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: selectedStoreFilter === st ? '1px solid var(--primary, #2874f0)' : '1px solid #cbd5e1',
                          background: selectedStoreFilter === st ? 'var(--primary, #2874f0)' : 'var(--bg-pill, #f8fafc)',
                          color: selectedStoreFilter === st ? '#fff' : 'var(--text-main, #334155)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {st === 'all' ? 'All Stores' : st}
                      </button>
                    ))}
                  </div>

                  {/* Sorting Pills */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sort:</span>
                    {[
                      { id: 'balanced', label: language === 'kn' ? 'ಸಮತೋಲಿತ' : language === 'hi' ? 'संतुलित' : 'Relevance' },
                      { id: 'cheapest', label: language === 'kn' ? 'ಕಡಿಮೆ ಬೆಲೆ' : language === 'hi' ? 'कम कीमत' : 'Price: Low' },
                      { id: 'best_rated', label: language === 'kn' ? 'ಉತ್ತಮ ರೇಟಿಂಗ್' : language === 'hi' ? 'उच्च रेटिंग' : 'Rating 4★+' }
                    ].map((pref) => (
                      <button
                        key={pref.id}
                        onClick={() => {
                          const newFilters: SearchFilters = { ...filters, preference: pref.id as any };
                          setFilters(newFilters);
                          if (searchResponse?.query) {
                            handleSearch(searchResponse.query, newFilters);
                          }
                        }}
                        style={{
                          background: filters.preference === pref.id ? 'var(--primary)' : 'var(--bg-pill)',
                          border: '1px solid var(--border-color)',
                          color: filters.preference === pref.id ? '#fff' : 'var(--text-main)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {pref.label}
                      </button>
                    ))}
                  </div>

                  {/* View Switcher: Row vs Grid */}
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      title="List View"
                      onClick={() => setLayoutMode('row')}
                      style={{
                        padding: '5px 8px',
                        background: layoutMode === 'row' ? 'var(--primary, #2874f0)' : '#fff',
                        color: layoutMode === 'row' ? '#fff' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      title="Grid View"
                      onClick={() => setLayoutMode('grid')}
                      style={{
                        padding: '5px 8px',
                        background: layoutMode === 'grid' ? 'var(--primary, #2874f0)' : '#fff',
                        color: layoutMode === 'grid' ? '#fff' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products List / Grid */}
              {isLoading ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={36} color="#6366f1" className="mic-active-pulse" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Fetching Live Store Data...</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Querying Amazon India, Flipkart & Meesho APIs in real-time</p>
                </div>
              ) : searchResponse?.products && searchResponse.products.length > 0 ? (
                <div>
                  {(() => {
                    const displayedProducts = searchResponse.products.filter((p) => {
                      if (selectedStoreFilter !== 'all' && p.store !== selectedStoreFilter) return false;
                      return true;
                    });

                    if (displayedProducts.length === 0) {
                      return (
                        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                          <p style={{ color: '#94a3b8' }}>No items found on {selectedStoreFilter.toUpperCase()}. Try selecting All Stores.</p>
                        </div>
                      );
                    }

                    if (layoutMode === 'row') {
                      return (
                        <div
                          style={{
                            background: 'var(--bg-card, #fff)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {displayedProducts.map((product, index) => {
                            const isCompared = comparedProducts.some(
                              (p) => p.productId === product.productId && p.store === product.store
                            );
                            return (
                              <ProductRow
                                key={`${product.store}-${product.productId}`}
                                product={product}
                                index={index}
                                sessionId={searchResponse.sessionId}
                                onAddToCart={handleAddToCart}
                                onSelectProduct={(p) => {
                                  setSelectedProduct(p);
                                  navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}?sid=${encodeURIComponent(searchResponse.sessionId || '')}`);
                                }}
                                onNavigateRoute={navigate}
                                isCompared={isCompared}
                                onToggleCompare={handleToggleCompare}
                              />
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <div className="products-grid">
                        {displayedProducts.map((product, index) => (
                          <ProductCard
                            key={`${product.store}-${product.productId}`}
                            product={product}
                            index={index}
                            sessionId={searchResponse.sessionId}
                            onAddToCart={handleAddToCart}
                            onSelectProduct={(p) => {
                              setSelectedProduct(p);
                              navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}?sid=${encodeURIComponent(searchResponse.sessionId || '')}`);
                            }}
                            onNavigateRoute={navigate}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8' }}>No products found. Try changing your search query or budget filter.</p>
                </div>
              )}
            </div>
          ) : (
            /* B. DEFAULT DASHBOARD: TRENDING CATEGORIES FEED (REAL LIVE DATA ONLY) */
            <div>
              {/* Category Chips Bar & Last Updated Timestamp */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  gap: '12px',
                  background: 'var(--bg-card, #fff)',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--primary, #6366f1)" />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Trending Products
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Live verified multi-store feed • Last updated {feedLastUpdated ? new Date(feedLastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => loadDashboardFeed(feedCategory, true)}
                    disabled={feedLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-pill)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={feedLoading ? 'mic-active-pulse' : ''} /> Refresh
                  </button>

                  {/* Store Filter Pills */}
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {['all', 'amazon', 'flipkart', 'meesho'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStoreFilter(st)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: selectedStoreFilter === st ? '1px solid var(--primary, #2874f0)' : '1px solid #cbd5e1',
                          background: selectedStoreFilter === st ? 'var(--primary, #2874f0)' : 'var(--bg-pill, #f8fafc)',
                          color: selectedStoreFilter === st ? '#fff' : 'var(--text-main, #334155)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {st === 'all' ? 'All Stores' : st}
                      </button>
                    ))}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={feedSort}
                    aria-label="Sort products"
                    onChange={(e) => {
                      const newSort = e.target.value;
                      setFeedSort(newSort);
                      setFeedPage(1);
                      loadDashboardFeed(feedCategory, false, 1, feedSubCategory, newSort, selectedBrand);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#fff',
                      color: 'var(--text-main, #334155)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="discount">Biggest Discount</option>
                    <option value="newest">Newest First</option>
                  </select>

                  {/* View Switcher: Row vs Grid */}
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      title="List View"
                      onClick={() => setLayoutMode('row')}
                      style={{
                        padding: '5px 8px',
                        background: layoutMode === 'row' ? 'var(--primary, #2874f0)' : '#fff',
                        color: layoutMode === 'row' ? '#fff' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      title="Grid View"
                      onClick={() => setLayoutMode('grid')}
                      style={{
                        padding: '5px 8px',
                        background: layoutMode === 'grid' ? 'var(--primary, #2874f0)' : '#fff',
                        color: layoutMode === 'grid' ? '#fff' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Part B: Category Icon Tab Bar with Sub-Category Chips */}
              <CategoryIconTabBar
                selectedCategory={feedCategory}
                onSelectCategory={handleSelectCategory}
                selectedSubCategory={feedSubCategory}
                onSelectSubCategory={(sub) => {
                  setFeedSubCategory(sub);
                  setFeedPage(1);
                  loadDashboardFeed(feedCategory, false, 1, sub, feedSort, selectedBrand);
                }}
                lastUpdated={feedLastUpdated}
              />

              {/* Brands Row (When brands exist for category) */}
              {catalogBrands && catalogBrands.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '10px',
                    marginBottom: '12px',
                    scrollbarWidth: 'none'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>
                    Top Brands:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('all');
                      setFeedPage(1);
                      loadDashboardFeed(feedCategory, false, 1, feedSubCategory, feedSort, 'all');
                    }}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: selectedBrand === 'all' ? 700 : 500,
                      border: '1px solid',
                      borderColor: selectedBrand === 'all' ? '#1877f2' : '#cbd5e1',
                      background: selectedBrand === 'all' ? '#1877f2' : '#f8fafc',
                      color: selectedBrand === 'all' ? '#fff' : '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    All Brands
                  </button>
                  {catalogBrands.slice(0, 10).map((b) => (
                    <button
                      key={b.brand}
                      type="button"
                      onClick={() => {
                        const newBrand = selectedBrand === b.brand ? 'all' : b.brand;
                        setSelectedBrand(newBrand);
                        setFeedPage(1);
                        loadDashboardFeed(feedCategory, false, 1, feedSubCategory, feedSort, newBrand);
                      }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: selectedBrand === b.brand ? 700 : 500,
                        border: '1px solid',
                        borderColor: selectedBrand === b.brand ? '#1877f2' : '#cbd5e1',
                        background: selectedBrand === b.brand ? '#1877f2' : '#f8fafc',
                        color: selectedBrand === b.brand ? '#fff' : '#334155',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {b.brand} ({b.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Top Verified Deals Row */}
              {topDeals && topDeals.length > 0 && feedSubCategory === 'all' && feedPage === 1 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1rem' }}>🔥</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        Top Verified Deals
                      </h4>
                      <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        20%+ OFF
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                      scrollbarWidth: 'none'
                    }}
                  >
                    {topDeals.map((deal) => (
                      <div
                        key={`deal-${deal.store}-${deal.productId}`}
                        onClick={() => {
                          setSelectedProduct(deal);
                          navigate(`/product/${encodeURIComponent(deal.store)}/${encodeURIComponent(deal.productId)}`);
                        }}
                        style={{
                          minWidth: '180px',
                          maxWidth: '200px',
                          padding: '10px',
                          background: '#fff',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                        }}
                      >
                        <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                          <ProductImage
                            src={deal.imageUrl}
                            alt={deal.title}
                            store={deal.store}
                            productId={deal.productId}
                            style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {deal.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>₹{deal.price.toLocaleString('en-IN')}</span>
                          {deal.discountPct > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>{deal.discountPct}% off</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Content: Skeleton / Error / Products */}
              {feedLoading ? (
                <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={36} color="#6366f1" className="mic-active-pulse" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Real Store Products...</h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Fetching live catalog from Amazon, Flipkart & Meesho</p>
                </div>
              ) : feedError ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#ef4444', marginBottom: '16px' }}>{feedError}</p>
                  <button
                    type="button"
                    onClick={() => loadDashboardFeed(feedCategory, true)}
                    style={{
                      padding: '8px 18px',
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Retry Loading Feed
                  </button>
                </div>
              ) : feedProducts && feedProducts.length > 0 ? (
                <div>
                  {(() => {
                    const displayedFeed = feedProducts.filter((p) => {
                      if (selectedStoreFilter !== 'all' && p.store !== selectedStoreFilter) return false;
                      return true;
                    });

                    if (displayedFeed.length === 0) {
                      return (
                        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                          <p style={{ color: '#94a3b8' }}>No products found on {selectedStoreFilter.toUpperCase()} in this category.</p>
                        </div>
                      );
                    }

                    if (layoutMode === 'row') {
                      return (
                        <div
                          style={{
                            background: 'var(--bg-card, #fff)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          {displayedFeed.map((product, index) => {
                            const isCompared = comparedProducts.some(
                              (p) => p.productId === product.productId && p.store === product.store
                            );
                            const sid = (product as any).sessionId || `feed_session_${feedCategory}`;
                            return (
                              <ProductRow
                                key={`${product.store}-${product.productId}`}
                                product={product}
                                index={index}
                                sessionId={sid}
                                onAddToCart={handleAddToCart}
                                onSelectProduct={(p) => {
                                  setSelectedProduct(p);
                                  navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}?sid=${encodeURIComponent(sid)}`);
                                }}
                                onNavigateRoute={navigate}
                                isCompared={isCompared}
                                onToggleCompare={handleToggleCompare}
                              />
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <div className="products-grid">
                        {displayedFeed.map((product, index) => {
                          const sid = (product as any).sessionId || `feed_session_${feedCategory}`;
                          return (
                            <ProductCard
                              key={`${product.store}-${product.productId}`}
                              product={product}
                              index={index}
                              sessionId={sid}
                              onAddToCart={handleAddToCart}
                              onSelectProduct={(p) => {
                                setSelectedProduct(p);
                                navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}?sid=${encodeURIComponent(sid)}`);
                              }}
                              onNavigateRoute={navigate}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Pagination Controls */}
                  {feedTotalPages > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px', padding: '16px' }}>
                      <button
                        type="button"
                        disabled={feedPage <= 1}
                        onClick={() => {
                          const newPage = Math.max(1, feedPage - 1);
                          setFeedPage(newPage);
                          loadDashboardFeed(feedCategory, false, newPage, feedSubCategory, feedSort, selectedBrand);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: feedPage <= 1 ? '#f1f5f9' : '#fff',
                          color: feedPage <= 1 ? '#94a3b8' : '#1e293b',
                          fontWeight: 600,
                          cursor: feedPage <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        Page {feedPage} of {feedTotalPages} ({feedTotalProducts} products)
                      </span>
                      <button
                        type="button"
                        disabled={feedPage >= feedTotalPages}
                        onClick={() => {
                          const newPage = Math.min(feedTotalPages, feedPage + 1);
                          setFeedPage(newPage);
                          loadDashboardFeed(feedCategory, false, newPage, feedSubCategory, feedSort, selectedBrand);
                          window.scrollTo({ top: 380, behavior: 'smooth' });
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: feedPage >= feedTotalPages ? '#f1f5f9' : '#fff',
                          color: feedPage >= feedTotalPages ? '#94a3b8' : '#1e293b',
                          fontWeight: 600,
                          cursor: feedPage >= feedTotalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
                    No products found yet for this category. Catalog is still being built.
                  </p>
                  <button
                    type="button"
                    onClick={() => loadDashboardFeed(feedCategory, true)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 18px',
                      background: 'var(--primary)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Refresh Catalog
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Floating Compare Bar */}
          {comparedProducts.length >= 2 && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(99, 102, 241, 0.6)',
                borderRadius: '16px',
                padding: '12px 24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                maxWidth: '90vw',
                animation: 'slideUp 0.3s ease'
              }}
            >
              {/* Product Thumbnails in compare bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {comparedProducts.map((cp) => (
                  <div
                    key={`${cp.store}-${cp.productId}`}
                    style={{
                      position: 'relative',
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      background: '#fff',
                      padding: '2px',
                      border: '1px solid #475569'
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <ProductImage
                        src={cp.imageUrl}
                        images={cp.images}
                        thumbnail={(cp as any).thumbnail}
                        serpapi_thumbnail={(cp as any).serpapi_thumbnail}
                        alt={cp.title}
                        store={cp.store}
                        productId={cp.productId}
                        variantText={cp.variantText}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(cp)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                  Compare {comparedProducts.length} Products
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Side-by-side cross-store specs & pricing
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const first = comparedProducts[0];
                    const key = `${first.brand || ''}_${first.model || first.title.slice(0, 20)}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    navigate(`/compare/specs/${key}`);
                  }}
                  style={{
                    padding: '8px 18px',
                    background: 'linear-gradient(135deg, var(--primary, #2874f0), #4f46e5)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Layers size={16} /> Compare Now
                </button>

                <button
                  type="button"
                  onClick={() => setComparedProducts([])}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {activeTab === 'cart' && (
        <CartScreen
          cart={cart}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
          onCartUpdated={setCart}
          onAddToCart={handleAddToCart}
          onNavigateToOrders={(orderId) => {
            if (orderId) navigate(`/orders/${orderId}`);
            else navigate('/orders');
          }}
          initialPaymentTab={paymentTab}
          onOrderCompleted={(newOrder) => {
            setOrders((prev) => [newOrder, ...prev]);
          }}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersListPage
          onNavigateRoute={navigate}
          onAddToCart={handleAddToCart}
          language={language}
          showToast={showToast}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsScreen
          storeStatuses={storeStatuses}
          language={language}
          onLanguageChange={setLanguage}
          preference={filters.preference || 'balanced'}
          onPreferenceChange={(pref) => setFilters((f) => ({ ...f, preference: pref }))}
        />
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Real-time Voice Command Debug Panel */}
      <DebugPanel
        currentQuery={searchQuery}
        feedSource="Server Cached SerpApi Category Engine (3h TTL)"
        feedLastUpdated={feedLastUpdated}
        selectedProduct={selectedProduct}
        onConfirmYes={handleConfirmYes}
        onConfirmNo={handleConfirmNo}
      />

      {/* User Profile Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthPendingNotice(null);
          }}
          defaultMode={authModalMode}
          language={language}
          pendingNotice={authPendingNotice}
        />
      )}
    </div>
  );
};


