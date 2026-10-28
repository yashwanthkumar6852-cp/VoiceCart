import { CartItem, OrderRecord, Product, SearchResponse } from '../types';
import { SupportedLanguage } from '../i18n/translations';
import { AssistantResponse, CommandDebugEntry, CommandParams, ConversationContext, PaymentMethodCode, VoiceAction } from './types';

type Listener = () => void;

export interface ActiveSearchState {
  searchId: string;
  query: string;
  spec?: any;
  results: Product[];
  recommendation: any | null;
  replyText: string;
  spokenText: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  timestamp: string;
}

class VoiceStore {
  private currentScreen: 'home' | 'search' | 'cart' | 'orders' | 'settings' = 'home';
  private searchResults: SearchResponse | null = null;
  private activeSearch: ActiveSearchState = {
    searchId: '',
    query: '',
    results: [],
    recommendation: null,
    replyText: '',
    spokenText: '',
    status: 'idle',
    timestamp: new Date().toISOString()
  };
  private selectedProduct: Product | null = null;
  private cart: CartItem[] = [];
  private orders: OrderRecord[] = [];
  private language: SupportedLanguage = 'en';
  private activePaymentTab: 'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking' = 'upi';
  private pendingConfirmation: {
    action: VoiceAction;
    params: CommandParams;
    prompt: string;
    targetTitle?: string;
    targetPrice?: number;
  } | null = null;

  private lastAssistantResponse: AssistantResponse | null = null;
  private debugLogs: CommandDebugEntry[] = [];
  private showDebugPanel: boolean = false;
  private listeners: Set<Listener> = new Set();

  constructor() {
    try {
      const savedDebug = localStorage.getItem('voicecart_debug_panel');
      if (savedDebug === 'true') this.showDebugPanel = true;
    } catch { }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public getState(): ConversationContext & {
    orders: OrderRecord[];
    activeSearch: ActiveSearchState;
    debugLogs: CommandDebugEntry[];
    showDebugPanel: boolean;
    lastAssistantResponse: AssistantResponse | null;
  } {
    return {
      currentScreen: this.currentScreen,
      searchResults: this.searchResults,
      activeSearch: this.activeSearch,
      selectedProduct: this.selectedProduct,
      cart: this.cart,
      orders: this.orders,
      lastOrder: this.orders.length > 0 ? this.orders[0] : null,
      language: this.language,
      activePaymentTab: this.activePaymentTab,
      pendingConfirmation: this.pendingConfirmation,
      debugLogs: this.debugLogs,
      showDebugPanel: this.showDebugPanel,
      lastAssistantResponse: this.lastAssistantResponse
    };
  }

  public getAssistantResponse(): AssistantResponse | null {
    return this.lastAssistantResponse;
  }

  public setAssistantResponse(res: AssistantResponse | null): void {
    this.lastAssistantResponse = res;
    this.notify();
  }

  public getContext(): ConversationContext {
    return {
      currentScreen: this.currentScreen,
      searchResults: this.searchResults,
      selectedProduct: this.selectedProduct,
      cart: this.cart,
      lastOrder: this.orders.length > 0 ? this.orders[0] : null,
      language: this.language,
      activePaymentTab: this.activePaymentTab,
      pendingConfirmation: this.pendingConfirmation
    };
  }

  public getActiveSearch(): ActiveSearchState {
    return this.activeSearch;
  }

  // Atomic Search State Transitions
  public startSearch(searchId: string, query: string): void {
    this.activeSearch = {
      searchId,
      query,
      results: [],
      recommendation: null,
      replyText: '',
      spokenText: '',
      status: 'loading',
      timestamp: new Date().toISOString()
    };
    this.notify();
  }

  public completeSearch(response: SearchResponse): void {
    this.searchResults = response;
    this.activeSearch = {
      searchId: response.searchId || '',
      query: response.query,
      spec: response.spec,
      results: response.products || [],
      recommendation: response.recommendation || response.topRecommendations?.bestOverall || null,
      replyText: response.replyText || '',
      spokenText: response.spokenText || '',
      status: 'success',
      timestamp: response.timestamp || new Date().toISOString()
    };
    this.notify();
  }

  public failSearch(searchId: string, errorMsg: string): void {
    if (this.activeSearch.searchId === searchId || !this.activeSearch.searchId) {
      this.activeSearch = {
        ...this.activeSearch,
        status: 'error',
        error: errorMsg,
        timestamp: new Date().toISOString()
      };
      this.notify();
    }
  }

  // Setters
  public setCurrentScreen(screen: 'home' | 'search' | 'cart' | 'orders' | 'settings') {
    this.currentScreen = screen;
    this.notify();
  }

  public setSearchResults(results: SearchResponse | null) {
    this.searchResults = results;
    if (results) {
      this.activeSearch = {
        searchId: results.searchId || '',
        query: results.query,
        spec: results.spec,
        results: results.products || [],
        recommendation: results.recommendation || results.topRecommendations?.bestOverall || null,
        replyText: results.replyText || '',
        spokenText: results.spokenText || '',
        status: 'success',
        timestamp: results.timestamp || new Date().toISOString()
      };
    }
    this.notify();
  }

  public setSelectedProduct(product: Product | null) {
    this.selectedProduct = product;
    this.notify();
  }

  public setCart(cart: CartItem[]) {
    this.cart = cart;
    this.notify();
  }

  public setOrders(orders: OrderRecord[]) {
    this.orders = orders;
    this.notify();
  }

  public setLanguage(lang: SupportedLanguage) {
    this.language = lang;
    this.notify();
  }

  public setActivePaymentTab(tab: 'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking') {
    this.activePaymentTab = tab;
    this.notify();
  }

  public setPendingConfirmation(
    confirmation: {
      action: VoiceAction;
      params: CommandParams;
      prompt: string;
      targetTitle?: string;
      targetPrice?: number;
    } | null
  ) {
    this.pendingConfirmation = confirmation;
    this.notify();
  }

  public setShowDebugPanel(show: boolean) {
    this.showDebugPanel = show;
    try {
      localStorage.setItem('voicecart_debug_panel', show ? 'true' : 'false');
    } catch { }
    this.notify();
  }

  public addDebugLog(entry: Omit<CommandDebugEntry, 'id' | 'timestamp'>) {
    const newEntry: CommandDebugEntry = {
      ...entry,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    this.debugLogs = [newEntry, ...this.debugLogs].slice(0, 50);

    // Browser Console Logging
    console.groupCollapsed(`🎙️ [VoiceCart Command] [${entry.layer.toUpperCase()}] ${entry.action}`);
    console.log('Transcript:', entry.transcript);
    console.log('Action:', entry.action);
    console.log('Params:', entry.params);
    console.log('Confidence:', entry.confidence);
    console.log('Result:', entry.executionResult);
    console.log('Spoken Reply:', entry.reply);
    console.groupEnd();

    this.notify();
  }

  public clearDebugLogs() {
    this.debugLogs = [];
    this.notify();
  }
}

export const voiceStore = new VoiceStore();
