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
import { CategoriesPage } from './pages/CategoriesPage';
import { DealsPage } from './pages/DealsPage';
import { LayoutGrid, List, X, Layers, CloudLightning } from 'lucide-react';
import { CategoryIconTabBar } from './components/CategoryIconTabBar';
import { VoiceAssistantHub } from './components/VoiceAssistantHub';
import { DashboardLeftSidebar } from './components/dashboard/DashboardLeftSidebar';
import { DashboardHeroBanner } from './components/dashboard/DashboardHeroBanner';
import { CategoryQuickStrip } from './components/dashboard/CategoryQuickStrip';
import { DashboardFeaturedProducts } from './components/dashboard/DashboardFeaturedProducts';
import { DashboardPromoBanner } from './components/dashboard/DashboardPromoBanner';
import { DashboardPopularBrands } from './components/dashboard/DashboardPopularBrands';
import { DashboardExploreSection } from './components/dashboard/DashboardExploreSection';
import { DashboardRightSidebar } from './components/dashboard/DashboardRightSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useAuth } from './context/AuthContext';
import { PendingAuthAction } from './types/auth';
import { voiceStore } from './voice/voiceStore';
import { actionDispatcher, DispatcherHandlers } from './voice/dispatcher';
import { translations, SupportedLanguage, getStoredLanguage, setStoredLanguage, getTranslation } from './i18n/translations';

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
      if (cat === 'deals' || cat === 'for_you' || cat === 'for-you') {
        return 'all';
      }
      return cat || 'all';
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

  const [language, setLanguage] = useState<SupportedLanguage>(() => getStoredLanguage());
  const handleLanguageChange = useCallback((newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setStoredLanguage(newLang);
    voiceStore.setLanguage(newLang);
  }, []);

  const [paymentTab, setPaymentTab] = useState<'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking'>('upi');
  const [layoutMode, setLayoutMode] = useState<'row' | 'grid'>('grid');
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const t = getTranslation(language);

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

  const handleSelectCategory = (catId: string, subCatId?: string) => {
    if (catId === 'more') {
      navigate('/categories');
      return;
    }

    if (currentPath !== '/') {
      navigate('/');
    }

    if (catId === 'all') {
      setFeedCategory('all');
      setFeedSubCategory('all');
      setSelectedBrand('all');
      setFeedPage(1);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('category');
        url.searchParams.delete('subCategory');
        window.history.replaceState({}, '', url.toString());
      }
      handleClearSearch();
      return;
    }

    const cleanCat = catId === 'for_you' || catId === 'for-you' || catId === 'deals' ? 'all' : catId;
    setFeedCategory(cleanCat);
    setFeedSubCategory(subCatId || 'all');
    setSelectedBrand('all');
    setFeedPage(1);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('category', cleanCat);
      if (subCatId) {
        url.searchParams.set('subCategory', subCatId);
      } else {
        url.searchParams.delete('subCategory');
      }
      window.history.replaceState({}, '', url.toString());
    }

    // Do NOT open or populate the search bar! Keep search bar clean and show category items directly on dashboard
    setSearchQuery('');
    setSearchResponse(null);
    loadDashboardFeed(cleanCat, false, 1, subCatId || 'all', feedSort, 'all');
  };

  const loadDashboardFeed = useCallback(async (
    rawCat = feedCategory,
    refresh = false,
    page = feedPage,
    subCat = feedSubCategory,
    sort = feedSort,
    brand = selectedBrand
  ) => {
    const cat = rawCat === 'deals' || rawCat === 'for_you' || rawCat === 'for-you' || !rawCat ? 'all' : rawCat;
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
      handleLanguageChange(lang);
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
        onLanguageChange={handleLanguageChange}
        pendingNotice={authPendingNotice}
      />
    );
  }

  if (currentPath === '/signup') {
    return (
      <SignupPage
        onNavigate={navigate}
        language={language}
        onLanguageChange={handleLanguageChange}
        pendingNotice={authPendingNotice}
      />
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigate={navigate}
        language={language}
        onLanguageChange={handleLanguageChange}
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

  const commonNavbarProps = {
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    language,
    onLanguageChange: handleLanguageChange,
    onNavigate: navigate,
    onOpenAuth: (mode: 'login' | 'signup' | 'profile' = 'login', notice?: string) => {
      if (mode === 'signup') navigate('/signup');
      else if (mode === 'login') navigate('/login');
      else navigate('/account');
    },
    onProtectedAction: handleProtectedAction,
    searchQuery,
    onSearch: (q: string, cat?: string) => {
      if (currentPath !== '/') {
        navigate('/');
      }
      setActiveTab('home');
      if (cat && cat !== 'all') {
        setFeedCategory(cat);
      }
      setSearchQuery(q);
      handleSearch(q);
    },
    voiceHandlers: dispatcherHandlers,
    voiceContext: {
      selectedProduct: searchResponse?.topRecommendations?.bestOverall || selectedProduct,
      cart
    },
    selectedCategory: feedCategory,
    onCategoryChange: (cat: string) => {
      setFeedCategory(cat);
      loadDashboardFeed(cat);
    }
  };

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
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <OrderDetailPage
            orderId={orderIdParam}
            onNavigateRoute={navigate}
            onAddToCart={handleAddToCart}
            language={language}
            showToast={showToast}
          />
        </div>
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
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <OrdersListPage
            onNavigateRoute={navigate}
            onAddToCart={handleAddToCart}
            language={language}
            showToast={showToast}
          />
        </div>
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
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <AccountPage
            initialSection={subSection}
            onNavigateRoute={navigate}
            onLanguageChange={handleLanguageChange}
            currentLanguage={language}
            onNavigateToOrdersTab={() => {
              navigate('/orders');
              setActiveTab('orders');
            }}
          />
        </div>
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
          {...commonNavbarProps}
        />
        <div className="page-body-container">
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
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <CrossStoreComparisonPage
            productKey={productKeyParam || undefined}
            onNavigateRoute={navigate}
            onAddToCart={handleAddToCart}
            language={language}
            showToast={showToast}
          />
        </div>
      </div>
    );
  }

  if (currentPath === '/categories') {
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <CategoriesPage
            onNavigateRoute={navigate}
            onSelectCategory={(catId, subCatId) => {
              navigate(`/?category=${encodeURIComponent(catId)}${subCatId ? `&subCategory=${encodeURIComponent(subCatId)}` : ''}`);
              handleSelectCategory(catId, subCatId);
            }}
            language={language}
          />
        </div>
      </div>
    );
  }

  if (currentPath === '/deals' || currentPath === '/deals-offers') {
    return (
      <div className="app-container" style={{ fontFamily: language === 'kn' ? "'Noto Sans Kannada', 'Inter', sans-serif" : "'Inter', sans-serif" }}>
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => {
            navigate('/');
            setActiveTab(tab);
          }}
          {...commonNavbarProps}
        />
        <div className="page-body-container">
          <DealsPage
            onNavigateRoute={navigate}
            onAddToCart={handleAddToCart}
            onToggleCompare={handleToggleCompare}
            language={language}
            showToast={showToast}
            cart={cart}
            onRemoveFromCart={handleRemoveFromCart}
            onSearchPrompt={(q) => {
              navigate(`/?q=${encodeURIComponent(q)}`);
            }}
          />
        </div>
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
        {...commonNavbarProps}
      />

      {/* 3-Column AI Voice Marketplace Dashboard */}
      {(activeTab === 'home' || activeTab === 'search') && (
        <div className="dashboard-grid-container">
          {/* Column 1: Left Navigation Sidebar */}
          <div className="dashboard-left-sidebar">
            <DashboardLeftSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedCategory={feedCategory}
              onSelectCategory={handleSelectCategory}
              language={language}
              onLanguageChange={handleLanguageChange}
              currentPath={currentPath}
              onStartVoice={() => {
                const micBtn = (document.getElementById('right-sidebar-voice-mic-btn') ||
                  document.getElementById('navbar-voice-mic-btn')) as HTMLButtonElement | null;
                if (micBtn) micBtn.click();
              }}
              onNavigateRoute={navigate}
            />
          </div>

          {/* Column 2: Center Main Content */}
          <div className="dashboard-center-content">
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
                      {t.youSearchedFor}
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
                        <CheckCircle2 size={16} /> {t.exactMatchFound}
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
                        {t.similarOnlyFound}
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
                        {t.noExactResults}
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
                  language={language}
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
                          border: selectedStoreFilter === st ? '1px solid var(--primary, #2874f0)' : '1px solid var(--border-color)',
                          background: selectedStoreFilter === st ? 'var(--primary, #2874f0)' : 'var(--bg-card, #f8fafc)',
                          color: selectedStoreFilter === st ? '#fff' : 'var(--text-main, #334155)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {st === 'all' ? (language === 'kn' ? 'ಎಲ್ಲಾ ಅಂಗಡಿಗಳು' : language === 'hi' ? 'सभी स्टोर्स' : 'All Stores') : st}
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
                          background: filters.preference === pref.id ? 'var(--primary)' : 'var(--bg-card)',
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
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      type="button"
                      title="List View"
                      onClick={() => setLayoutMode('row')}
                      style={{
                        padding: '5px 8px',
                        background: layoutMode === 'row' ? 'var(--primary, #2874f0)' : 'var(--bg-card)',
                        color: layoutMode === 'row' ? '#fff' : 'var(--text-muted)',
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
                        background: layoutMode === 'grid' ? 'var(--primary, #2874f0)' : 'var(--bg-card)',
                        color: layoutMode === 'grid' ? '#fff' : 'var(--text-muted)',
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
                                language={language}
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
                            language={language}
                            onAddToCart={handleAddToCart}
                            onSelectProduct={(p) => {
                              setSelectedProduct(p);
                              navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}?sid=${encodeURIComponent(searchResponse.sessionId || '')}`);
                            }}
                            onNavigateRoute={navigate}
                            layout="grid"
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
            /* B. DEFAULT DASHBOARD: 5 HERO SECTIONS MATCHING USER REFERENCE IMAGE */
            <div>
              {/* 1. Hero Banner with Voice Visuals */}
              <DashboardHeroBanner
                language={language}
                onSearchPrompt={(q) => {
                  setSearchQuery(q);
                  handleSearch(q);
                }}
                onStartVoice={() => {
                  const micBtn = (document.getElementById('right-sidebar-voice-mic-btn') ||
                    document.getElementById('navbar-voice-mic-btn')) as HTMLButtonElement | null;
                  if (micBtn) micBtn.click();
                }}
                onNavigateRoute={navigate}
              />

              {/* 2. Quick Category Horizontal Pills */}
              <CategoryQuickStrip
                selectedCategory={feedCategory}
                onSelectCategory={handleSelectCategory}
                onNavigateRoute={navigate}
                language={language}
              />

              {/* 3. Featured / Category Products Grid */}
              <DashboardFeaturedProducts
                products={feedProducts}
                category={feedCategory}
                onResetCategory={() => handleSelectCategory('all')}
                language={language}
                onAddToCart={handleAddToCart}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}`);
                }}
                onNavigateRoute={navigate}
                onToggleCompare={handleToggleCompare}
                onViewAll={() => {
                  navigate('/deals');
                }}
              />

              {/* 4. Popular Brands */}
              <DashboardPopularBrands
                onSelectBrand={(brand) => {
                  setSearchQuery(brand);
                  handleSearch(brand);
                }}
                onViewAll={() => navigate('/categories')}
              />

              {/* 5. Explore Products & Popular Mobiles */}
              <DashboardExploreSection
                onAddToCart={handleAddToCart}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}`);
                }}
                onNavigateRoute={navigate}
                onSelectCategory={handleSelectCategory}
              />
            </div>
          )}
          </div> {/* End dashboard-center-content */}

          {/* Column 3: Right Sidebar (Permanent Voice Assistant Hub, Comparison & Cart Summary) */}
          <div className="dashboard-right-sidebar">
            <DashboardRightSidebar
              language={language}
              onLanguageChange={handleLanguageChange}
              handlers={dispatcherHandlers}
              searchResponse={searchResponse}
              recommendedProduct={searchResponse?.topRecommendations?.bestOverall || selectedProduct}
              selectedProduct={selectedProduct}
              cart={cart}
              onAddToCart={handleAddToCart}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                navigate(`/product/${encodeURIComponent(p.store)}/${encodeURIComponent(p.productId)}`);
              }}
              onNavigateToCart={() => setActiveTab('cart')}
              onNavigateToComparison={(pid) => {
                if (pid) navigate(`/compare?products=${encodeURIComponent(pid)}`);
                else navigate('/compare');
              }}
              onSearchPrompt={(q) => {
                setSearchQuery(q);
                handleSearch(q);
              }}
            />
          </div>
        </div>
      )}

      <div className={`page-body-container ${activeTab === 'cart' ? 'cart-page-wrapper' : ''}`}>

      {activeTab === 'cart' && (
        <CartScreen
          cart={cart}
          language={language}
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
          onLanguageChange={handleLanguageChange}
          preference={filters.preference || 'balanced'}
          onPreferenceChange={(pref) => setFilters((f) => ({ ...f, preference: pref }))}
        />
      )}
      </div> {/* End page-body-container */}

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

      {/* Smartphone Bottom Navigation Bar */}
      <MobileBottomNav
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
        onNavigateRoute={navigate}
        cartCount={cart.length}
        onStartVoice={() => {
          const micBtn = (document.getElementById('right-sidebar-voice-mic-btn') ||
            document.getElementById('navbar-voice-mic-btn')) as HTMLButtonElement | null;
          if (micBtn) micBtn.click();
        }}
        language={language}
      />
    </div>
  );
};


