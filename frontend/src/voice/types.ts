import { CartItem, OrderRecord, Product, SearchResponse, StoreName } from '../types';
import { SupportedLanguage } from '../i18n/translations';

export type VoiceAction =
  | 'search'
  | 'compare'
  | 'open_cart'
  | 'open_orders'
  | 'open_home'
  | 'open_settings'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'clear_cart'
  | 'increase_quantity'
  | 'continue_shopping'
  | 'proceed_to_payment'
  | 'buy'
  | 'pay'
  | 'track_order'
  | 'cancel_order'
  | 'buy_again'
  | 'read_details'
  | 'get_specifications'
  | 'get_battery_life'
  | 'compare_prices'
  | 'show_next_option'
  | 'get_rating'
  | 'get_quantity'
  | 'get_quality'
  | 'change_language'
  | 'go_back'
  | 'stop'
  | 'help'
  | 'confirm_yes'
  | 'confirm_no'
  | 'whoami'
  | 'logout'
  | 'login'
  | 'login_as'
  | 'select_category'
  | 'signup'
  | 'greeting'
  | 'chat';


export type PaymentMethodCode = 'cod' | 'upi' | 'qr' | 'wallet' | 'card' | 'netbanking';

export interface CommandParams {
  query?: string;
  maxBudget?: number;
  brand?: string;
  preference?: 'balanced' | 'cheapest' | 'fastest' | 'best_rated';
  targetRef?: 'this' | 'best' | 'cheapest' | 'second' | 'third' | 'first' | 'last' | string;
  store?: StoreName;
  index?: number;
  itemTitle?: string;
  orderId?: string;
  paymentMethod?: PaymentMethodCode;
  language?: SupportedLanguage;
  quantity?: number;
  [key: string]: any;
}

export interface AssistantResponse {
  spokenResponse: string;
  displayText: string;
  suggestionText?: string;
  suggestedCommands?: string[];
  mood?: 'helpful' | 'enthusiastic' | 'informative' | 'alert' | string;
  provider?: 'gemini' | 'rule_fallback';
}

export interface CommandResult {
  action: VoiceAction;
  params: CommandParams;
  layer: 'rule' | 'ai';
  confidence: number;
  language: SupportedLanguage;
  reply: string;
  assistantResponse?: AssistantResponse;
  needsClarification?: boolean;
  needsConfirmation?: boolean;
  confirmationPrompt?: string;
  pendingAction?: {
    action: VoiceAction;
    params: CommandParams;
    targetTitle?: string;
    targetPrice?: number;
    targetStore?: StoreName;
  };
}

export interface ConversationContext {
  currentScreen: 'home' | 'search' | 'cart' | 'orders' | 'settings';
  searchResults?: SearchResponse | null;
  selectedProduct?: Product | null;
  cart?: CartItem[];
  lastOrder?: OrderRecord | null;
  language?: SupportedLanguage;
  activePaymentTab?: 'cod' | 'upi' | 'qr' | 'wallet' | 'card_netbanking';
  pendingConfirmation?: {
    action: VoiceAction;
    params: CommandParams;
    prompt: string;
    targetTitle?: string;
    targetPrice?: number;
  } | null;
}

export interface CommandDebugEntry {
  id: string;
  timestamp: string;
  transcript: string;
  layer: 'rule' | 'ai';
  action: VoiceAction;
  params: CommandParams;
  confidence: number;
  language: SupportedLanguage;
  reply: string;
  executionResult: string;
  status: 'success' | 'clarification' | 'confirmation_required' | 'error';
}
