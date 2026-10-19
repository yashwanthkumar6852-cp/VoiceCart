import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  CartItem,
  OrderRecord,
  PaymentConfig,
  Product,
  SearchFilters,
  SearchResponse,
  StoreStatus,
  VoiceIntentResult
} from '../types';
import { API_ROUTES } from '../constants/routes';

/**
 * Resolves and normalizes the API base URL.
 * Throws a build error if localhost is used in a production build.
 */
export function resolveApiBaseUrl(rawUrl?: string, isProd = import.meta.env.PROD): string {
  if (isProd && rawUrl && /localhost|127\.0\.0\.1/i.test(rawUrl)) {
    throw new Error(
      `[VoiceCart Build Error] VITE_API_URL cannot contain "localhost" in production build! Received: "${rawUrl}". Please use same-origin "/api" or your public HTTPS backend URL.`
    );
  }

  if (!rawUrl || !rawUrl.trim() || rawUrl.trim() === '/api') {
    return '';
  }

  let clean = rawUrl.trim();
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');

  // If baseUrl ends with /api, strip it so it combines cleanly with routes starting with /api
  if (clean.endsWith('/api')) {
    clean = clean.slice(0, -4);
  }

  return clean;
}

export const API_BASE = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

// Server Wake & Cold Start Notification System
export interface ServerWakeStatus {
  wakingUp: boolean;
  message?: string;
  attempt?: number;
}

type ServerStatusListener = (status: ServerWakeStatus) => void;
const serverStatusListeners = new Set<ServerStatusListener>();

export function subscribeServerStatus(listener: ServerStatusListener): () => void {
  serverStatusListeners.add(listener);
  return () => {
    serverStatusListeners.delete(listener);
  };
}

let activeSlowRequests = 0;
function notifyServerStatus(status: ServerWakeStatus) {
  serverStatusListeners.forEach((fn) => {
    try {
      fn(status);
    } catch {}
  });
}

// Persistent Guest Session ID
export function getGuestSessionId(): string {
  let guestId = localStorage.getItem('voicecart_guest_session_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('voicecart_guest_session_id', guestId);
  }
  return guestId;
}

// In-memory access token storage
let currentAccessToken: string | null = localStorage.getItem('voicecart_access_token');

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem('voicecart_access_token', token);
  } else {
    localStorage.removeItem('voicecart_access_token');
  }
}

export function getAccessToken(): string | null {
  return currentAccessToken || localStorage.getItem('voicecart_access_token');
}

/**
 * Format human-readable API error messages
 */
export function formatApiErrorMessage(error: any, endpointName = 'Endpoint'): string {
  if (!error) return 'An unexpected error occurred.';

  const status = error.response?.status;
  const serverMsg = error.response?.data?.error || error.response?.data?.message;

  if (status === 404) {
    return `404 Not Found: ${endpointName} is unavailable. Check server routing.`;
  }
  if (status === 400) {
    return serverMsg || `400 Bad Request on ${endpointName}.`;
  }
  if (status === 401 || status === 403) {
    return serverMsg || 'Session expired. Please log in again.';
  }
  if (status === 429) {
    return serverMsg || 'Search rate limit reached. Please wait a moment before trying again.';
  }
  if (status >= 500) {
    return serverMsg || `Server error (${status}) on ${endpointName}. Retrying...`;
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return `Connection timed out while connecting to ${endpointName}.`;
  }
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return `Network connection failed. Connecting to ${API_BASE}...`;
  }

  return serverMsg || error.message || 'Request failed.';
}

/**
 * Global API Debug state and check
 */
export function isApiDebugEnabled(): boolean {
  if (import.meta.env.PROD) return false;
  if (import.meta.env.VITE_DEBUG_API === 'true') return true;
  if (typeof window !== 'undefined') {
    if ((window as any).__VOICECART_DEBUG_API__ === true) return true;
    try {
      if (localStorage.getItem('voicecart_debug_api') === 'true') return true;
    } catch {}
  }
  return false;
}

export function setApiDebugEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    (window as any).__VOICECART_DEBUG_API__ = enabled;
    try {
      localStorage.setItem('voicecart_debug_api', enabled ? 'true' : 'false');
    } catch {}
  }
}

/**
 * Global Axios Client with credentials, timeout, and cold-start retry interceptors
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// In-flight request deduplication & short-lived response cache
const inFlightRequests = new Map<string, Promise<AxiosResponse>>();
const responseCache = new Map<string, { response: AxiosResponse; expiresAt: number }>();

export function clearApiCache(urlPattern?: string): void {
  if (!urlPattern) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(urlPattern)) {
      responseCache.delete(key);
    }
  }
}

const defaultAdapter = axios.getAdapter(httpClient.defaults.adapter || ['xhr', 'fetch']);

httpClient.defaults.adapter = async (config) => {
  const method = (config.method || 'get').toUpperCase();
  const rawUrl = `${config.baseURL || ''}${config.url || ''}`;

  // Deduplicate GET requests and the /api/auth/refresh POST request
  const isDeduplicatable = method === 'GET' || (method === 'POST' && rawUrl.includes('/api/auth/refresh'));
  const cacheKey = `${method}:${rawUrl}:${JSON.stringify(config.params || '')}`;

  // Cache hit check for GET requests (TTL: 4000ms)
  if (method === 'GET' && !config.headers?.['x-skip-cache']) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.response, config };
    }
  }

  // Return existing promise if already in-flight
  if (isDeduplicatable && inFlightRequests.has(cacheKey)) {
    const res = await inFlightRequests.get(cacheKey)!;
    return { ...res, config };
  }

  const exec = (async () => {
    try {
      const response = await defaultAdapter(config);
      if (method === 'GET') {
        responseCache.set(cacheKey, { response, expiresAt: Date.now() + 4000 });
      }
      if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        if (rawUrl.includes('/cart')) clearApiCache('/cart');
        if (rawUrl.includes('/orders')) clearApiCache('/orders');
        if (rawUrl.includes('/auth')) clearApiCache('/auth');
      }
      return response;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  if (isDeduplicatable) {
    inFlightRequests.set(cacheKey, exec);
  }

  return exec;
};

httpClient.interceptors.request.use(async (config: InternalAxiosRequestConfig & { __timerId?: any }) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['x-guest-session-id'] = getGuestSessionId();

  // Log outgoing request only when debug is explicitly enabled (no emojis, no sensitive data)
  if (isApiDebugEnabled()) {
    const cleanPath = (config.url || '').split('?')[0];
    console.log(`[API Request] ${config.method?.toUpperCase()} ${cleanPath}`);
  }

  // Cold start timer trigger
  config.__timerId = setTimeout(() => {
    activeSlowRequests++;
    notifyServerStatus({
      wakingUp: true,
      message: 'Connecting to cloud backend... Waking up free instance (may take ~30s on cold start).'
    });
  }, 2500);

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    if (config?.__timerId) {
      clearTimeout(config.__timerId);
    }
    if (activeSlowRequests > 0) {
      activeSlowRequests = 0;
      notifyServerStatus({ wakingUp: false });
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as any;
    if (config?.__timerId) {
      clearTimeout(config.__timerId);
    }

    const cleanPath = (config?.url || '').split('?')[0];
    if (isApiDebugEnabled() || !import.meta.env.PROD) {
      console.warn(`[API Error] ${config?.method?.toUpperCase()} ${cleanPath} -> Status: ${error.response?.status || error.code}`);
    }

    // Identify cold start errors (502, 503, 504, ECONNABORTED, ERR_NETWORK)
    const isColdStart =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response && [502, 503, 504].includes(error.response.status));

    if (isColdStart && config && !config._isRetry && (!config.signal || !config.signal.aborted)) {
      config._isRetry = true;
      config._retryCount = (config._retryCount || 0) + 1;

      if (config._retryCount <= 2) {
        notifyServerStatus({
          wakingUp: true,
          message: `Waking up server... (Attempt ${config._retryCount + 1}/3)`
        });

        // Exponential backoff wait (2.5s, 5s)
        await new Promise((resolve) => setTimeout(resolve, config._retryCount * 2500));
        return httpClient(config);
      }
    }

    if (activeSlowRequests > 0) {
      activeSlowRequests = 0;
      notifyServerStatus({ wakingUp: false });
    }

    return Promise.reject(error);
  }
);

// Typed API Client
export const api = {
  // Feed Endpoint (GET /api/feed)
  getDashboardFeed: async (
    category = 'all',
    store?: string,
    refresh = false
  ): Promise<{
    category: string;
    items: Product[];
    products: Product[];
    total: number;
    updatedAt: string;
    lastUpdated: string;
    status: 'ready' | 'building' | 'unavailable';
    message?: string;
  }> => {
    const params: any = { category };
    if (store && store !== 'all') params.store = store;
    if (refresh) params.refresh = 'true';

    const res = await httpClient.get<any>(API_ROUTES.FEED, { params });
    const data = res.data;

    const items = data.items || data.products || [];
    return {
      category: data.category || category,
      items,
      products: items,
      total: data.total || items.length,
      updatedAt: data.updatedAt || data.lastUpdated || new Date().toISOString(),
      lastUpdated: data.updatedAt || data.lastUpdated || new Date().toISOString(),
      status: data.status || (items.length > 0 ? 'ready' : 'building'),
      message: data.message
    };
  },

  // Health Check (GET /api/health)
  checkHealth: async (): Promise<any> => {
    const res = await httpClient.get(API_ROUTES.HEALTH);
    return res.data;
  },

  // Authentication
  login: async (payload: { identifier: string; password?: string; rememberMe?: boolean }): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/login`, payload);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  signup: async (payload: { name: string; email?: string; mobile?: string; password?: string; language?: string }): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/signup`, payload);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  demoLogin: async (): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/demo-login`);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  googleLogin: async (payload: { email: string; name?: string; avatarUrl?: string; googleId?: string }): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/google`, payload);
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  refreshSession: async (refreshToken?: string): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/refresh`, { refreshToken });
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  logout: async (): Promise<any> => {
    try {
      const res = await httpClient.post(`${API_ROUTES.AUTH}/logout`);
      setAccessToken(null);
      return res.data;
    } catch {
      setAccessToken(null);
      return { success: true };
    }
  },

  logoutAll: async (): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/logout-all`);
    setAccessToken(null);
    return res.data;
  },

  forgotPassword: async (identifier: string): Promise<{ success: boolean; resetToken?: string; resetUrl?: string; message: string }> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/forgot-password`, { identifier });
    return res.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/reset-password`, { token, newPassword });
    return res.data;
  },

  getAuthDebug: async (email?: string): Promise<any> => {
    const res = await httpClient.get(`${API_ROUTES.AUTH}/debug`, { params: { email } });
    return res.data;
  },

  // Email & Mobile OTP Authentication
  sendOtp: async (req: string | { identifier?: string; userId?: string }): Promise<{ success: boolean; message: string; identifier: string; maskedIdentifier?: string; type: 'email' | 'mobile'; resendCooldownSeconds: number; demoOtp?: string }> => {
    const payload = typeof req === 'string' ? { identifier: req } : req;
    const res = await httpClient.post(`${API_ROUTES.AUTH}/otp/send`, payload);
    return res.data;
  },

  verifyOtp: async (params: { identifier: string; otp: string; fullName?: string; preferredLanguage?: string; rememberMe?: boolean }): Promise<{ success: boolean; user: any; session?: any; isNewUser: boolean; identifier: string; message: string }> => {
    const res = await httpClient.post(`${API_ROUTES.AUTH}/otp/verify`, params);
    if (res.data?.session?.accessToken) {
      setAccessToken(res.data.session.accessToken);
    }
    return res.data;
  },

  checkOtpStatus: async (identifier: string): Promise<{ verified: boolean; session?: any; refreshToken?: string }> => {
    const res = await httpClient.get(`${API_ROUTES.AUTH}/otp/status`, {
      params: { identifier }
    });
    if (res.data?.verified && res.data?.session?.accessToken) {
      setAccessToken(res.data.session.accessToken);
    }
    return res.data;
  },

  magicVerifyOtp: async (token: string): Promise<{ success: boolean; user: any; session?: any; message: string }> => {
    const res = await httpClient.get(`${API_ROUTES.AUTH}/otp/magic-verify`, {
      params: { token },
      headers: { Accept: 'application/json' }
    });
    if (res.data?.session?.accessToken) {
      setAccessToken(res.data.session.accessToken);
    }
    return res.data;
  },

  getOtpChannels: async (): Promise<{ channels: { email: boolean; sms: boolean } }> => {
    const res = await httpClient.get(`${API_ROUTES.AUTH}/otp/channels`);
    return res.data;
  },

  // Search
  search: async (query: string, filters: SearchFilters = {}): Promise<SearchResponse> => {
    const params: any = { q: query };
    if (filters.maxBudget) params.budget = filters.maxBudget;
    if (filters.minBudget) params.minBudget = filters.minBudget;
    if (filters.brand) params.brand = filters.brand;
    if (filters.preference) params.preference = filters.preference;
    if (filters.stores) params.stores = filters.stores.join(',');
    if (filters.inStockOnly !== undefined) params.inStockOnly = filters.inStockOnly;
    if (filters.requestId) params.searchId = filters.requestId;
    if ((filters as any).language) params.lang = (filters as any).language;

    const res = await httpClient.get<SearchResponse>(API_ROUTES.SEARCH, {
      params,
      signal: (filters as any)?.signal
    });
    return res.data;
  },

  getStatuses: async (): Promise<StoreStatus[]> => {
    const res = await httpClient.get<{ storeStatuses: StoreStatus[] }>(API_ROUTES.SEARCH_STATUS);
    return res.data.storeStatuses;
  },

  getProductDetails: async (store: string, productId: string, sessionId?: string): Promise<{ product: Product; comparison: Product[] }> => {
    const params = sessionId ? { sid: sessionId } : undefined;
    const res = await httpClient.get<{ product: Product; comparison: Product[] }>(
      `${API_ROUTES.SEARCH_PRODUCT}/${encodeURIComponent(store)}/${encodeURIComponent(productId)}`,
      { params }
    );
    return res.data;
  },

  getFullProductDetails: async (store: string, productId: string, sessionId?: string): Promise<any> => {
    const params = sessionId ? { sid: sessionId } : undefined;
    const res = await httpClient.get<any>(
      `${API_ROUTES.PRODUCT_DETAILS}/${encodeURIComponent(store)}/${encodeURIComponent(productId)}/details`,
      { params }
    );
    return res.data;
  },

  getSpecComparison: async (params: { productKey?: string; store?: string; productId?: string; sessionId?: string; query?: string; overrideProductIds?: any }): Promise<any> => {
    const res = await httpClient.get<any>(API_ROUTES.COMPARE_SPECS, { params });
    return res.data;
  },

  // Voice
  transcribeAudioBlob: async (
    formData: FormData
  ): Promise<{ text: string; transcript: string; provider: string; lang: string; durationMs?: number }> => {
    const res = await httpClient.post(API_ROUTES.VOICE_TRANSCRIBE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  transcribeAudio: async (
    audioBase64: string,
    mimeType = 'audio/webm',
    language = 'en'
  ): Promise<{ transcript: string }> => {
    const res = await httpClient.post(API_ROUTES.VOICE_TRANSCRIBE, { audioBase64, mimeType, language });
    return res.data;
  },

  processVoice: async (
    transcript: string,
    context?: any
  ): Promise<{
    intentResult: VoiceIntentResult;
    voiceConfig: any;
    searchData?: SearchResponse;
    cartData?: { cart: CartItem[]; addedItem?: CartItem };
    orderData?: OrderRecord;
  }> => {
    const res = await httpClient.post(API_ROUTES.VOICE_PROCESS, { transcript, context });
    return res.data;
  },

  routeVoiceCommand: async (
    transcript: string,
    context?: any,
    language?: 'en' | 'hi' | 'kn'
  ): Promise<{ success: boolean; result: any }> => {
    const res = await httpClient.post(API_ROUTES.VOICE_COMMAND, { transcript, context, language });
    return res.data;
  },

  parseAiCommand: async (payload: {
    transcript: string;
    language?: 'en' | 'hi' | 'kn';
    context?: any;
  }): Promise<any> => {
    const res = await httpClient.post(API_ROUTES.VOICE_COMMAND, payload);
    return res.data.result;
  },

  // Cart
  getCart: async (): Promise<CartItem[]> => {
    const res = await httpClient.get<{ items: CartItem[] }>(API_ROUTES.CART);
    return res.data.items;
  },

  addToCart: async (product: Product, quantity = 1): Promise<{ item: CartItem; cart: CartItem[] }> => {
    const res = await httpClient.post(API_ROUTES.CART_ADD, { product, quantity });
    return res.data;
  },

  removeFromCart: async (id: string): Promise<{ success: boolean; cart: CartItem[] }> => {
    const res = await httpClient.delete(`${API_ROUTES.CART}/${id}`);
    return res.data;
  },

  verifyCartPrices: async (): Promise<{
    items: CartItem[];
    hasPriceChanges: boolean;
    totalSavingsOrIncrease: number;
  }> => {
    const res = await httpClient.post(API_ROUTES.CART_VERIFY);
    return res.data;
  },

  clearCart: async (): Promise<void> => {
    await httpClient.delete(API_ROUTES.CART);
  },

  mergeGuestCart: async (): Promise<{ success: boolean; items: CartItem[] }> => {
    const guestSessionId = getGuestSessionId();
    const res = await httpClient.post<{ success: boolean; items: CartItem[] }>(API_ROUTES.CART_MERGE, { guestSessionId });
    return res.data;
  },

  // Orders
  getOrders: async (filters: {
    status?: string;
    store?: string;
    dateRange?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
    page?: number;
    limit?: number;
  } = {}): Promise<{ orders: OrderRecord[]; total: number; page: number; limit: number; totalPages: number }> => {
    const res = await httpClient.get<{ orders: OrderRecord[]; total: number; page: number; limit: number; totalPages: number }>(
      API_ROUTES.ORDERS,
      { params: filters }
    );
    return res.data;
  },

  getMyOrders: async (): Promise<{ user: any; orders: OrderRecord[] }> => {
    const res = await httpClient.get<{ user: any; orders: OrderRecord[] }>(`${API_ROUTES.ORDERS}/user/me`);
    return res.data;
  },

  getOrderById: async (orderId: string): Promise<OrderRecord> => {
    const res = await httpClient.get<{ success: boolean; order: OrderRecord }>(`${API_ROUTES.ORDERS}/${orderId}`);
    return res.data.order;
  },

  cancelOrder: async (orderId: string, reason?: string): Promise<{ success: boolean; message: string; order: OrderRecord }> => {
    const res = await httpClient.post<{ success: boolean; message: string; order: OrderRecord }>(`${API_ROUTES.ORDERS}/${orderId}/cancel`, { reason });
    return res.data;
  },

  reorderOrder: async (orderId: string): Promise<{ success: boolean; message: string; cart: CartItem[]; itemsAdded: number }> => {
    const res = await httpClient.post<{ success: boolean; message: string; cart: CartItem[]; itemsAdded: number }>(`${API_ROUTES.ORDERS}/${orderId}/reorder`);
    return res.data;
  },

  addOrder: async (orderData: Partial<OrderRecord>): Promise<{ success: boolean; order: OrderRecord }> => {
    const res = await httpClient.post(`${API_ROUTES.ORDERS}/add`, orderData);
    return res.data;
  },

  addExternalOrder: async (orderData: Partial<OrderRecord>): Promise<{ success: boolean; order: OrderRecord }> => {
    const res = await httpClient.post(`${API_ROUTES.ORDERS}/external`, orderData);
    return res.data;
  },

  parseOrderSMS: async (text: string): Promise<{ success: boolean; parsed: any; order: OrderRecord }> => {
    const res = await httpClient.post(`${API_ROUTES.ORDERS}/parse-message`, { text });
    return res.data;
  },

  // Payment Gateway
  getPaymentConfig: async (): Promise<PaymentConfig> => {
    const res = await httpClient.get<PaymentConfig>(`${API_ROUTES.PAYMENTS}/config`);
    return res.data;
  },

  createDemoOrder: async (payload: {
    items?: CartItem[];
    notes?: Record<string, string>;
    receiptId?: string;
  }): Promise<{
    success: boolean;
    order: {
      id: string;
      amount: number;
      amountInr: number;
      currency: string;
      receipt: string;
      status: string;
      createdAt: string;
    };
    calculatedAmount: number;
    internalOrderId: string;
    gateway: string;
  }> => {
    const res = await httpClient.post(`${API_ROUTES.PAYMENTS}/create`, payload);
    return res.data;
  },

  confirmDemoPayment: async (payload: {
    orderId: string;
    method: string;
    demoResult?: 'SUCCESS' | 'FAILED' | 'PENDING';
    failureReason?: string;
    paymentDetails?: any;
  }): Promise<{
    success: boolean;
    status: string;
    isPaid: boolean;
    isCodPending?: boolean;
    isPending: boolean;
    isFailed: boolean;
    order?: OrderRecord;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    paidAt?: string;
    method?: string;
    message?: string;
    error?: string;
  }> => {
    const res = await httpClient.post(`${API_ROUTES.PAYMENTS}/confirm`, payload);
    return res.data;
  },

  pollOrderStatus: async (orderId: string): Promise<{
    success: boolean;
    orderId: string;
    status: string;
    isPaid: boolean;
    isPending: boolean;
    isFailed: boolean;
    paymentId?: string;
    paymentMethod?: string;
    totalAmount: number;
    paidAt?: string;
    order?: OrderRecord;
  }> => {
    const res = await httpClient.get(`${API_ROUTES.PAYMENTS}/${orderId}/status`);
    return res.data;
  },

  validateCard: async (cardNumber: string): Promise<{ isValid: boolean; cardNumber: string }> => {
    const res = await httpClient.post(`${API_ROUTES.PAYMENTS}/validate-card`, { cardNumber });
    return res.data;
  },

  requestRefund: async (payload: {
    orderId: string;
    amount?: number;
    reason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    refundId: string;
    amount: number;
    order?: OrderRecord;
  }> => {
    const res = await httpClient.post(`${API_ROUTES.PAYMENTS}/refund`, payload);
    return res.data;
  },

  // Account & Profile
  getAccountSummary: async (): Promise<any> => {
    const res = await httpClient.get(API_ROUTES.ACCOUNT);
    return res.data;
  },

  updateAccountProfile: async (patch: any): Promise<any> => {
    const res = await httpClient.patch(`${API_ROUTES.ACCOUNT}/profile`, patch);
    return res.data;
  },

  updateAvatar: async (avatarUrl: string): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/avatar`, { avatarUrl });
    return res.data;
  },

  getAddresses: async (): Promise<any> => {
    const res = await httpClient.get(`${API_ROUTES.ACCOUNT}/addresses`);
    return res.data.addresses;
  },

  addAddress: async (addressData: any): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/addresses`, addressData);
    return res.data;
  },

  updateAddress: async (id: string, addressData: any): Promise<any> => {
    const res = await httpClient.patch(`${API_ROUTES.ACCOUNT}/addresses/${id}`, addressData);
    return res.data;
  },

  deleteAddress: async (id: string): Promise<any> => {
    const res = await httpClient.delete(`${API_ROUTES.ACCOUNT}/addresses/${id}`);
    return res.data;
  },

  setDefaultAddress: async (id: string): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/addresses/${id}/default`);
    return res.data;
  },

  getSavedPaymentMethods: async (): Promise<any> => {
    const res = await httpClient.get(`${API_ROUTES.ACCOUNT}/payment-methods`);
    return res.data.paymentMethods;
  },

  addSavedPaymentMethod: async (paymentData: any): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/payment-methods`, paymentData);
    return res.data;
  },

  deleteSavedPaymentMethod: async (id: string): Promise<any> => {
    const res = await httpClient.delete(`${API_ROUTES.ACCOUNT}/payment-methods/${id}`);
    return res.data;
  },

  changePassword: async (passwords: { currentPassword: string; newPassword: string }): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/change-password`, passwords);
    return res.data;
  },

  logoutAllDevices: async (): Promise<any> => {
    const res = await httpClient.post(`${API_ROUTES.ACCOUNT}/logout-all`);
    return res.data;
  },

  exportAccountData: async (): Promise<any> => {
    const res = await httpClient.get(`${API_ROUTES.ACCOUNT}/export`);
    return res.data;
  },

  deleteAccount: async (confirmationText: string): Promise<any> => {
    const res = await httpClient.delete(API_ROUTES.ACCOUNT, { data: { confirmationText } });
    return res.data;
  },

  // Catalog APIs
  browseCatalog: async (params: {
    category?: string;
    subCategory?: string;
    store?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    minDiscount?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number; lastUpdated: string }> => {
    const res = await httpClient.get('/api/catalog/browse', { params });
    return res.data;
  },

  searchCatalog: async (params: {
    q: string;
    category?: string;
    subCategory?: string;
    store?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    minDiscount?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number; lastUpdated: string }> => {
    const res = await httpClient.get('/api/catalog/search', { params });
    return res.data;
  },

  getTopDeals: async (category?: string, limit?: number): Promise<Product[]> => {
    const res = await httpClient.get('/api/catalog/top-deals', { params: { category, limit } });
    return res.data?.deals || [];
  },

  getCatalogBrands: async (category?: string): Promise<{ brand: string; count: number }[]> => {
    const res = await httpClient.get('/api/catalog/brands', { params: { category } });
    return res.data?.brands || [];
  },

  getCatalogFilters: async (category?: string, subCategory?: string): Promise<any> => {
    const res = await httpClient.get('/api/catalog/filters', { params: { category, subCategory } });
    return res.data?.filters || {};
  },

  getCatalogProductDetails: async (store: string, productId: string): Promise<any> => {
    const res = await httpClient.get(`/api/catalog/product/${store}/${productId}`);
    return res.data;
  },

  refreshCatalogProduct: async (store: string, productId: string): Promise<any> => {
    const res = await httpClient.post(`/api/catalog/product/${store}/${productId}/refresh`);
    return res.data;
  },

  getCatalogStatus: async (): Promise<any> => {
    const res = await httpClient.get('/api/catalog/status');
    return res.data;
  }
};
