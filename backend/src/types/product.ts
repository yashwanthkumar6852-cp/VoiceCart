export type StoreName = 'amazon' | 'flipkart' | 'meesho' | 'voicecart';

export type RankingPreference = 'balanced' | 'cheapest' | 'best_rated' | 'fastest';

export interface QualityBreakdown {
  ratingWeight: number;
  sellerWeight: number;
  policyBonus: number;
  warrantyBonus: number;
  fulfilledBonus: number;
  sentimentBonus: number;
}

export interface ProductQuality {
  score: number; // 0 to 10
  hasEnoughData: boolean;
  signals: string[]; // e.g. ["Brand Assured", "7-day replacement", "1 year warranty", "Seller rating 4.5"]
  basis: string; // e.g. "Based on ratings, seller and policies"
  breakdown?: QualityBreakdown;
}

export interface ProductQuantityInfo {
  packSize?: string; // e.g. "Pack of 2", "500 g", "1 Unit"
  unit?: string;
  unitsInPack?: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  stockCount?: number;
  pricePerUnit?: number;
}

export interface ProductDeliveryInfo {
  date: string; // e.g. "Tomorrow", "Delivery by Friday, 10 Oct"
  charge: number; // 0 for Free delivery
  isFree: boolean;
}

export interface ProductSellerInfo {
  name: string;
  rating?: number;
  isAssured?: boolean;
}

export interface ProductVariantOption {
  label: string;
  productId?: string;
  price?: number;
  imageUrl?: string;
  inStock?: boolean;
  selected?: boolean;
}

export interface ProductVariantGroup {
  type: string; // "Color" | "Storage" | "Size" | "Pack"
  options: ProductVariantOption[];
}

export interface ProductReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  author: string;
  date: string;
  verified: boolean;
}

export interface RatingBreakdown {
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}

export interface Product {
  store: StoreName;
  productId: string;
  title: string;
  brand?: string;
  model?: string;
  variantText?: string;
  imageUrl: string;
  images?: string[];
  price: number;
  mrp: number;
  discountPct: number;
  currency?: string;
  rating: number;
  ratingCount: number;
  reviewCount?: number;
  ratingBreakdown?: RatingBreakdown;
  deliveryDays: number;
  shippingFee: number;
  delivery?: ProductDeliveryInfo;
  seller: string;
  sellerInfo?: ProductSellerInfo;
  inStock: boolean;
  quantity?: string;
  quantityInfo?: ProductQuantityInfo;
  quality?: ProductQuality;
  highlights?: string[];
  specifications?: Record<string, Record<string, string>>;
  offers?: string[];
  variants?: ProductVariantGroup[];
  reviews?: ProductReview[];
  description?: string;
  productUrl: string;
  affiliateUrl: string;
  returnPolicy?: string;
  warranty?: string;
  fulfilledByStore?: boolean;
  score?: number;
  relevanceScore?: number;
  badges?: string[];
  reason?: string;
  matchType?: 'EXACT' | 'PARTIAL' | 'SIMILAR' | 'NONE';
  rejectionReason?: string;
  source?: string;
  fetchedAt?: string;
  category?: string;
  subCategory?: string;
  matchGroupId?: string;
  priceUpdatedAt?: string;
}

export interface StoreStatus {
  store: StoreName;
  name: string;
  isAvailable: boolean;
  itemCount: number;
  message?: string;
  responseTimeMs?: number;
}

export interface SearchFilters {
  maxBudget?: number;
  minBudget?: number;
  brand?: string;
  preference?: RankingPreference;
  stores?: StoreName[];
  inStockOnly?: boolean;
  requestId?: string;
}

export interface ProductSpec {
  rawQuery: string;
  englishQuery: string;
  productType: string;
  brand?: string;
  model?: string;
  variant?: {
    storage?: string;
    ram?: string;
    color?: string;
    size?: string;
    pack?: string;
    fold?: string;
    generation?: string;
    [key: string]: any;
  };
  mustInclude: string[];
  mustExclude: string[];
  budgetMin?: number;
  budgetMax?: number;
  preference?: RankingPreference;
  isSpecific: boolean;
  cleanSearchQuery: string;
  alternativeQueries: string[];
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
}

export interface ParsedProductQuery {
  rawQuery: string;
  cleanQuery: string;
  brand?: string;
  product?: string;
  model?: string;
  modelNumber?: string;
  variant?: string;
  storage?: string;
  ram?: string;
  size?: string;
  color?: string;
  generation?: string;
  quantity?: number;
  displayName: string;
  spec?: ProductSpec;
}

export interface RejectionRecord {
  title: string;
  store: StoreName;
  price: number;
  rejectionReason: string;
  relevanceScore: number;
}

export interface ScoredProductDetail {
  productId: string;
  title: string;
  store: StoreName;
  price: number;
  relevanceScore: number;
  commercialScore: number;
  finalScore: number;
  isExactMatch: boolean;
  matchReasons: string[];
}

export interface SearchDebugTrace {
  requestId: string;
  transcript?: string;
  englishQuery?: string;
  spec: ProductSpec;
  queriesSent: { store: StoreName; queries: string[] }[];
  rawCounts: Record<StoreName, number>;
  filteredCounts: Record<StoreName, number>;
  rejections: RejectionRecord[];
  scoredProducts: ScoredProductDetail[];
  top3: Product[];
  timingMs: number;
}

export interface StoreComparisonSummary {
  store: StoreName;
  storeDisplayName: string;
  topProductTitle?: string;
  lowestPrice?: number;
  avgRating?: number;
  fastestDeliveryDays?: number;
  available: boolean;
  affiliateUrl?: string;
  notice?: string;
  isExactMatch?: boolean;
}

export interface StoreOutcome {
  store: StoreName;
  state: 'matched' | 'no_match' | 'no_results' | 'unavailable';
  rawCheckedCount: number;
  matchedCount: number;
  closestItem?: Product;
  message: string;
}

export type SearchOutcomeStatus = 'exact_found' | 'similar_only' | 'none' | 'sources_unavailable';

export interface SearchOutcome {
  searchId: string;
  sessionId?: string;
  status: SearchOutcomeStatus;
  cleanProductName: string;
  exactMatches: Product[];
  similarAlternatives: Product[];
  bestRecommendation: SearchRecommendation | null;
  banner: {
    state: 'exact_found' | 'similar_only' | 'none';
    title: string;
    subtitle: string;
  };
  writtenReply: string;
  spokenReply: string;
  perStore: Record<StoreName, StoreOutcome>;
  comparisonMatrix: StoreComparisonSummary[];
  debugTrace?: SearchDebugTrace;
  timestamp: string;
}

export interface SearchRecommendation {
  productId: string;
  store: StoreName;
  title: string;
  brand?: string;
  imageUrl: string;
  price: number;
  mrp?: number;
  rating: number;
  ratingCount: number;
  pack?: string;
  qualityScore?: number;
  hasQualityData?: boolean;
  productUrl: string;
  affiliateUrl?: string;
  deliveryDays: number;
  shippingFee: number;
  reason?: string;
  badges: string[];
}

export interface SearchResponse {
  searchId?: string;
  sessionId?: string;
  query: string;
  parsedQuery: ParsedProductQuery;
  spec?: ProductSpec;
  matchType: 'EXACT' | 'PARTIAL' | 'SIMILAR' | 'ALTERNATIVES' | 'NONE';
  isExactMatch: boolean;
  filters: SearchFilters;
  totalResults: number;
  products: Product[];
  exactMatches: Product[];
  alternativeMatches: Product[];
  similarProducts?: Product[];
  recommendation?: SearchRecommendation | null;
  replyText?: string;
  spokenText?: string;
  topRecommendations: {
    bestOverall?: Product;
    lowestPrice?: Product;
    fastestDelivery?: Product;
    bestRated?: Product;
  };
  comparisonMatrix: StoreComparisonSummary[];
  storeStatuses: StoreStatus[];
  outcome?: SearchOutcome;
  debugTrace?: SearchDebugTrace;
  timestamp: string;
}

export interface VoiceIntentResult {
  intent:
    | 'SEARCH'
    | 'COMPARE'
    | 'ADD_TO_CART'
    | 'REMOVE_FROM_CART'
    | 'VIEW_CART'
    | 'BUY_NOW'
    | 'PAY_WITH_UPI'
    | 'PAY_WITH_COD'
    | 'PAY_WITH_CARD'
    | 'PAY_WITH_WALLET'
    | 'PAY_WITH_QR'
    | 'TRACK_ORDER'
    | 'READ_DETAILS'
    | 'CLARIFY_BUDGET'
    | 'UNKNOWN';
  language: 'en' | 'hi' | 'kn';
  productQuery?: string;
  maxBudget?: number;
  brand?: string;
  quantity?: number;
  preference?: RankingPreference;
  orderId?: string;
  missingSlot?: 'budget' | 'product';
  clarificationNeeded?: boolean;
  clarifyingQuestion?: string;
  spokenResponse: string;
  spec?: ProductSpec;
  actionPayload?: any;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  addedPrice: number;
  currentPrice: number;
  priceChanged: boolean;
  priceDelta: number;
  addedAt: string;
  isOwnStore?: boolean;
}

export type OrderStatus =
  | 'PLACED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_PENDING'
  | 'COD_PENDING'
  | 'CREATED'
  | 'PENDING_VERIFICATION'
  | 'PAID'
  | 'FAILED'
  | 'PENDING'
  | 'ORDERED';

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  brand?: string;
  variant?: {
    color?: string;
    size?: string;
    storage?: string;
    ram?: string;
    pack?: string;
    [key: string]: any;
  };
  imageUrl: string;
  price: number;
  mrp: number;
  discountPct: number;
  quantity: number;
  store: StoreName;
  seller?: string;
  returnPolicy?: string;
  productUrl?: string;
  affiliateUrl?: string;
  inStock?: boolean;
}

export interface OrderPriceBreakdown {
  itemsTotal: number;
  discountSavings: number;
  deliveryCharges: number;
  codFee: number;
  taxes: number;
  grandTotal: number;
}

export interface OrderPaymentDetails {
  method: string;
  methodCode?: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'COD' | 'REFUNDED' | 'REFUND_INITIATED';
  paymentId?: string;
  transactionTime?: string;
  cardBrand?: string;
  cardLast4?: string;
  isDemo?: boolean;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
}

export interface OrderDeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  type?: 'Home' | 'Work' | 'Other';
}

export interface OrderComparisonItem {
  store: StoreName;
  price: number;
  isChosen: boolean;
  productUrl?: string;
  deliveryDays?: number;
}

export interface OrderPriceComparisonSummary {
  storesCompared: OrderComparisonItem[];
  chosenStore: StoreName;
  savingsVsHighest: number;
  highestPrice: number;
  lowestPrice: number;
}

export interface OrderTimelineStep {
  stage: 'Ordered' | 'Packed' | 'Shipped' | 'Out for delivery' | 'Delivered' | 'Cancelled' | string;
  description: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface OrderActivityLogEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type?: 'created' | 'payment' | 'status_change' | 'cancellation' | 'refund' | 'info';
}

export interface OrderRecord {
  id: string;
  orderId: string;
  userId?: string;
  store: StoreName;
  productTitle: string;
  productImage?: string;
  totalAmount: number;
  status: OrderStatus;
  orderedAt: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  trackingUrl: string;
  storeUrl: string;
  isExternal?: boolean;
  isDemo?: boolean;
  canCancel?: boolean;
  paymentId?: string;
  paymentOrderId?: string;
  paymentMethod?: string;
  paymentMode?: 'test' | 'live';
  paidAt?: string;
  utrNumber?: string;
  items?: (CartItem | OrderItem)[];
  orderItems?: OrderItem[];
  priceBreakdown?: OrderPriceBreakdown;
  paymentDetails?: OrderPaymentDetails;
  deliveryAddress?: OrderDeliveryAddress;
  deliveryMethod?: string;
  priceComparisonSummary?: OrderPriceComparisonSummary;
  timeline: OrderTimelineStep[];
  activityLog?: OrderActivityLogEntry[];
}

