import {
  Product,
  RankingPreference,
  SearchFilters,
  StoreComparisonSummary,
  StoreName,
  StoreStatus,
  ParsedProductQuery,
  ProductSpec,
  SearchDebugTrace,
  ScoredProductDetail
} from '../types/product';
import { querySpecExtractor } from './querySpecExtractor';
import { relevanceFilter, EvaluatedProduct, FilterOutcome } from './relevanceFilter';

interface WeightProfile {
  price: number;
  rating: number;
  quality: number;
  value: number;
  delivery: number;
}

const WEIGHT_PROFILES: Record<RankingPreference, WeightProfile> = {
  balanced: { price: 0.35, rating: 0.25, quality: 0.20, value: 0.10, delivery: 0.10 },
  cheapest: { price: 0.60, rating: 0.15, quality: 0.10, value: 0.10, delivery: 0.05 },
  best_rated: { price: 0.15, rating: 0.45, quality: 0.25, value: 0.05, delivery: 0.10 },
  fastest: { price: 0.25, rating: 0.20, quality: 0.15, value: 0.05, delivery: 0.35 }
};

export class RankingEngine {
  /**
   * Scores, ranks, gates by relevance, and attaches explainability and debug trace metadata.
   */
  public async rank(
    products: Product[],
    queryTextOrFilters?: string | SearchFilters,
    filtersOrStatuses?: SearchFilters | StoreStatus[],
    storeStatusesList: StoreStatus[] = [],
    preExtractedSpec?: ProductSpec,
    rawCounts?: Record<StoreName, number>,
    queriesSent?: { store: StoreName; queries: string[] }[]
  ): Promise<{
    parsedQuery: ParsedProductQuery;
    spec: ProductSpec;
    matchType: 'EXACT' | 'PARTIAL' | 'SIMILAR' | 'ALTERNATIVES' | 'NONE';
    isExactMatch: boolean;
    rankedProducts: Product[];
    exactMatches: Product[];
    alternativeMatches: Product[];
    similarProducts: Product[];
    topRecommendations: {
      bestOverall?: Product;
      lowestPrice?: Product;
      fastestDelivery?: Product;
      bestRated?: Product;
    };
    comparisonMatrix: StoreComparisonSummary[];
    debugTrace: SearchDebugTrace;
  }> {
    const startTime = Date.now();
    let queryText = '';
    let filters: SearchFilters = {};
    let storeStatuses: StoreStatus[] = storeStatusesList;

    if (typeof queryTextOrFilters === 'string') {
      queryText = queryTextOrFilters;
      if (filtersOrStatuses && !Array.isArray(filtersOrStatuses)) {
        filters = filtersOrStatuses;
      }
    } else if (queryTextOrFilters && typeof queryTextOrFilters === 'object') {
      filters = queryTextOrFilters;
      if (Array.isArray(filtersOrStatuses)) {
        storeStatuses = filtersOrStatuses;
      }
    }

    // 1. Extract Spec
    const spec = preExtractedSpec || (await querySpecExtractor.extractSpec(queryText));

    const parsedQuery: ParsedProductQuery = {
      rawQuery: spec.rawQuery,
      cleanQuery: spec.cleanSearchQuery,
      brand: spec.brand,
      product: spec.productType,
      model: spec.model,
      storage: spec.variant?.storage,
      ram: spec.variant?.ram,
      size: spec.variant?.size,
      color: spec.variant?.color,
      displayName: spec.cleanSearchQuery || spec.rawQuery,
      spec
    };

    if (!products || products.length === 0) {
      const emptyTrace: SearchDebugTrace = {
        requestId: filters.requestId || `req_${Date.now()}`,
        spec,
        queriesSent: queriesSent || [],
        rawCounts: rawCounts || { amazon: 0, flipkart: 0, meesho: 0, voicecart: 0 },
        filteredCounts: { amazon: 0, flipkart: 0, meesho: 0, voicecart: 0 },
        rejections: [],
        scoredProducts: [],
        top3: [],
        timingMs: Date.now() - startTime
      };

      return {
        parsedQuery,
        spec,
        matchType: 'NONE',
        isExactMatch: false,
        rankedProducts: [],
        exactMatches: [],
        alternativeMatches: [],
        similarProducts: [],
        topRecommendations: {},
        comparisonMatrix: this.buildComparisonMatrix([], [], storeStatuses, spec),
        debugTrace: emptyTrace
      };
    }

    // 2. RELEVANCE FILTERING & HARD REJECTIONS
    const filterOutcome: FilterOutcome = relevanceFilter.evaluateProducts(
      products,
      spec,
      filters.maxBudget,
      filters.minBudget
    );

    const filteredCounts: Record<StoreName, number> = {
      amazon: filterOutcome.allFilteredProducts.filter((p) => p.store === 'amazon').length,
      flipkart: filterOutcome.allFilteredProducts.filter((p) => p.store === 'flipkart').length,
      meesho: filterOutcome.allFilteredProducts.filter((p) => p.store === 'meesho').length,
      voicecart: filterOutcome.allFilteredProducts.filter((p) => p.store === 'voicecart').length
    };

    // 3. RANKING SCORES
    const preference: RankingPreference = filters.preference || spec.preference || 'balanced';
    const weights = WEIGHT_PROFILES[preference] || WEIGHT_PROFILES.balanced;

    const rankList = (list: Product[]): { ranked: Product[]; details: ScoredProductDetail[] } => {
      if (list.length === 0) return { ranked: [], details: [] };

      const totalCosts = list.map((p) => p.price + (p.shippingFee || 0));
      const minCost = Math.min(...totalCosts.filter((c) => c > 0));

      const scoredDetails: ScoredProductDetail[] = [];

      const scored = list.map((p) => {
        const totalCost = p.price + (p.shippingFee || 0);

        let priceScore = 100;
        if (filters.maxBudget && filters.maxBudget > 0) {
          priceScore = Math.max(10, Math.min(100, Math.round(100 * (1 - totalCost / (filters.maxBudget * 1.2)))));
        } else if (minCost > 0) {
          priceScore = Math.max(15, Math.min(100, Math.round((minCost / totalCost) * 100)));
        }

        const v = Math.min(p.ratingCount || 10, 500);
        const m = 25;
        const C = 4.0;
        const bayesianRating = (v * (p.rating || 4.0) + m * C) / (v + m);
        const ratingScore = (bayesianRating / 5.0) * 100;

        let qualityScore = 30;
        if (p.returnPolicy && !p.returnPolicy.toLowerCase().includes('no return')) qualityScore += 30;
        if (p.fulfilledByStore) qualityScore += 25;
        if (p.seller && !p.seller.toLowerCase().includes('generic')) qualityScore += 15;
        qualityScore = Math.min(qualityScore, 100);

        const discountBonus = Math.min(p.discountPct || 0, 50) * 1.5;
        const valueScore = Math.min(50 + discountBonus, 100);

        let deliveryScore = 50;
        if (p.deliveryDays <= 1) deliveryScore = 100;
        else if (p.deliveryDays === 2) deliveryScore = 85;
        else if (p.deliveryDays === 3) deliveryScore = 70;
        else if (p.deliveryDays <= 5) deliveryScore = 50;
        else deliveryScore = 30;

        const commercialScore = Math.round(
          priceScore * weights.price +
            ratingScore * weights.rating +
            qualityScore * weights.quality +
            valueScore * weights.value +
            deliveryScore * weights.delivery
        );

        const relScore = p.relevanceScore || 50;

        // RELEVANCE GATE: Final score is gated by relevance
        let finalScore = Math.round(relScore * 0.6 + commercialScore * 0.4);
        if (relScore < 70) {
          finalScore = Math.min(finalScore, Math.round(relScore * 0.9));
        }

        const matchReasons = p.reason ? [p.reason] : [];

        scoredDetails.push({
          productId: p.productId,
          title: p.title,
          store: p.store,
          price: p.price,
          relevanceScore: relScore,
          commercialScore,
          finalScore,
          isExactMatch: p.matchType === 'EXACT',
          matchReasons
        });

        return {
          ...p,
          score: finalScore
        };
      });

      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      return { ranked: scored, details: scoredDetails };
    };

    const exactOutcome = rankList(filterOutcome.exactMatches);
    const partialOutcome = rankList(filterOutcome.partialMatches);
    const similarOutcome = rankList(filterOutcome.similarProducts);

    const isExactMatch = exactOutcome.ranked.length > 0;
    const matchType: 'EXACT' | 'PARTIAL' | 'SIMILAR' | 'ALTERNATIVES' | 'NONE' = isExactMatch
      ? 'EXACT'
      : partialOutcome.ranked.length > 0
      ? 'PARTIAL'
      : similarOutcome.ranked.length > 0
      ? 'SIMILAR'
      : 'NONE';

    // Primary display list: Exact matches first, supplemented by partials/similars if needed
    let primaryList: Product[] = [];
    if (isExactMatch) {
      primaryList = [...exactOutcome.ranked];
      // If fewer than 3 exact matches, append similar products clearly labeled
      if (primaryList.length < 3) {
        primaryList = [...primaryList, ...partialOutcome.ranked, ...similarOutcome.ranked];
      }
    } else if (partialOutcome.ranked.length > 0) {
      primaryList = [...partialOutcome.ranked, ...similarOutcome.ranked];
    } else {
      primaryList = [...similarOutcome.ranked];
    }

    // Identify Standouts STRICTLY from products with Relevance Score >= 70
    const qualifiedPool = primaryList.filter((p) => (p.relevanceScore || 0) >= 70);
    const recommendationPool = qualifiedPool.length > 0 ? qualifiedPool : isExactMatch ? exactOutcome.ranked : [];

    const bestOverallProduct = recommendationPool.length > 0 ? recommendationPool[0] : undefined;

    const lowestPriceProduct =
      recommendationPool.length > 0
        ? [...recommendationPool].sort((a, b) => a.price + a.shippingFee - (b.price + b.shippingFee))[0]
        : undefined;

    const fastestDeliveryProduct =
      recommendationPool.length > 0
        ? [...recommendationPool].sort((a, b) => a.deliveryDays - b.deliveryDays)[0]
        : undefined;

    const bestRatedProduct =
      recommendationPool.length > 0
        ? [...recommendationPool].sort((a, b) => b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10))[0]
        : undefined;

    // Attach Badges & Explainability Reason
    primaryList.forEach((p, idx) => {
      const badges: string[] = [];
      const isBestOverall =
        bestOverallProduct && p.productId === bestOverallProduct.productId && p.store === bestOverallProduct.store;
      const isLowestPrice =
        lowestPriceProduct && p.productId === lowestPriceProduct.productId && p.store === lowestPriceProduct.store;
      const isFastest =
        fastestDeliveryProduct &&
        p.productId === fastestDeliveryProduct.productId &&
        p.store === fastestDeliveryProduct.store;
      const isTopRated =
        bestRatedProduct && p.productId === bestRatedProduct.productId && p.store === bestRatedProduct.store;

      if (p.matchType === 'EXACT' || (p.relevanceScore || 0) >= 80) {
        badges.push('Exact Match');
      }

      if (isBestOverall && (p.relevanceScore || 0) >= 70) badges.push('Best Overall');
      if (isLowestPrice && (p.relevanceScore || 0) >= 70) badges.push('Lowest Price');
      if (isFastest && !isBestOverall && (p.relevanceScore || 0) >= 70) badges.push('Fastest Delivery');
      if (isTopRated && !isBestOverall && !isLowestPrice && (p.relevanceScore || 0) >= 70) badges.push('Top Rated');

      if (idx === 0 && badges.length === 0) badges.push('Recommended');

      p.badges = badges;
      p.reason = this.generateReason(p, {
        isBestOverall: Boolean(isBestOverall),
        isLowestPrice: Boolean(isLowestPrice),
        isFastest: Boolean(isFastest),
        isTopRated: Boolean(isTopRated),
        spec
      });
    });

    // Build Strict Store Comparison Matrix
    const comparisonMatrix = this.buildComparisonMatrix(
      exactOutcome.ranked,
      primaryList,
      storeStatuses,
      spec,
      rawCounts
    );

    const allScoredDetails = [
      ...exactOutcome.details,
      ...partialOutcome.details,
      ...similarOutcome.details
    ];

    const debugTrace: SearchDebugTrace = {
      requestId: filters.requestId || `req_${Date.now()}`,
      spec,
      queriesSent: queriesSent || [],
      rawCounts: rawCounts || { amazon: products.filter(p => p.store === 'amazon').length, flipkart: products.filter(p => p.store === 'flipkart').length, meesho: products.filter(p => p.store === 'meesho').length, voicecart: 0 },
      filteredCounts,
      rejections: filterOutcome.rejections,
      scoredProducts: allScoredDetails,
      top3: primaryList.slice(0, 3),
      timingMs: Date.now() - startTime
    };

    // Console Logging (Without Logging Any Secret Keys)
    console.log(
      `🔍 [SEARCH DEBUG] Query: "${queryText}" | Spec: [${spec.brand || ''} ${spec.model || ''} (${spec.productType})] | Raw: ${products.length} -> Filtered: ${primaryList.length} | Top: ${primaryList[0]?.title || 'None'} (Score: ${primaryList[0]?.score || 0}, Rel: ${primaryList[0]?.relevanceScore || 0})`
    );

    return {
      parsedQuery,
      spec,
      matchType,
      isExactMatch,
      rankedProducts: primaryList,
      exactMatches: exactOutcome.ranked,
      alternativeMatches: partialOutcome.ranked,
      similarProducts: similarOutcome.ranked,
      topRecommendations: {
        bestOverall: bestOverallProduct,
        lowestPrice: lowestPriceProduct,
        fastestDelivery: fastestDeliveryProduct,
        bestRated: bestRatedProduct
      },
      comparisonMatrix,
      debugTrace
    };
  }

  private generateReason(
    product: Product,
    context: {
      isBestOverall: boolean;
      isLowestPrice: boolean;
      isFastest: boolean;
      isTopRated: boolean;
      spec: ProductSpec;
    }
  ): string {
    const storeDisplay = product.store === 'amazon' ? 'Amazon' : product.store === 'flipkart' ? 'Flipkart' : 'Meesho';
    const totalCost = product.price + product.shippingFee;

    if (context.isBestOverall) {
      return `Exact match & top pick on ${storeDisplay} at ₹${totalCost} with ${product.rating}★ rating and ${product.deliveryDays}-day delivery.`;
    }

    if (context.isLowestPrice) {
      return `Lowest price deal for exact item on ${storeDisplay} at ₹${totalCost} (${product.discountPct > 0 ? `${product.discountPct}% off MRP` : 'best unit pricing'}).`;
    }

    if (context.isFastest) {
      return `Fastest dispatch on ${storeDisplay}: arrives in ${product.deliveryDays} ${product.deliveryDays === 1 ? 'day' : 'days'}.`;
    }

    if (context.isTopRated) {
      return `Highest verified satisfaction on ${storeDisplay} (${product.rating}★ over ${product.ratingCount} reviews).`;
    }

    return `Available on ${storeDisplay} for ₹${totalCost} (${product.deliveryDays}d delivery).`;
  }

  private buildComparisonMatrix(
    exactProducts: Product[],
    fallbackProducts: Product[],
    storeStatuses: StoreStatus[],
    spec: ProductSpec,
    rawCounts?: Record<StoreName, number>
  ): StoreComparisonSummary[] {
    const stores: StoreName[] = ['amazon', 'flipkart', 'meesho'];
    const storeNames: Record<StoreName, string> = {
      amazon: 'Amazon India',
      flipkart: 'Flipkart',
      meesho: 'Meesho',
      voicecart: 'VoiceCart Direct'
    };

    return stores.map((store) => {
      const storeExact = exactProducts.filter((p) => p.store === store);
      const status = storeStatuses.find((s) => s.store === store);
      const rawCount = rawCounts ? rawCounts[store] || 0 : 0;

      if (exactProducts.length > 0) {
        if (storeExact.length === 0) {
          const storeFallback = fallbackProducts.filter((p) => p.store === store && (p.relevanceScore || 0) >= 35);
          if (storeFallback.length > 0) {
            const topItem = storeFallback[0];
            return {
              store,
              storeDisplayName: storeNames[store],
              topProductTitle: `Closest: ${topItem.title}`,
              lowestPrice: topItem.price + topItem.shippingFee,
              avgRating: topItem.rating,
              fastestDeliveryDays: topItem.deliveryDays,
              available: true,
              isExactMatch: false,
              affiliateUrl: topItem.affiliateUrl,
              notice: `No exact match (${Math.max(rawCount, storeFallback.length)} items checked)`
            };
          }

          return {
            store,
            storeDisplayName: storeNames[store],
            available: false,
            isExactMatch: false,
            notice: rawCount > 0 ? `No exact match (${rawCount} items checked)` : (status?.isAvailable === false ? 'Temporarily unavailable' : `No exact match on ${storeNames[store]}`)
          };
        }

        const topItem = storeExact[0];
        const lowestPrice = Math.min(...storeExact.map((p) => p.price + p.shippingFee));
        const avgRating = Number((storeExact.reduce((sum, p) => sum + p.rating, 0) / storeExact.length).toFixed(1));
        const fastestDays = Math.min(...storeExact.map((p) => p.deliveryDays));

        return {
          store,
          storeDisplayName: storeNames[store],
          topProductTitle: topItem.title,
          lowestPrice,
          avgRating,
          fastestDeliveryDays: fastestDays,
          available: true,
          isExactMatch: true,
          affiliateUrl: topItem.affiliateUrl
        };
      }

      // If no exact matches exist anywhere, check qualified fallback items
      const storeFallback = fallbackProducts.filter((p) => p.store === store && (p.relevanceScore || 0) >= 35);
      if (storeFallback.length === 0) {
        return {
          store,
          storeDisplayName: storeNames[store],
          available: false,
          isExactMatch: false,
          notice: rawCount > 0 ? `No exact match (${rawCount} items checked)` : (status?.isAvailable === false ? 'Temporarily unavailable' : 'No results')
        };
      }

      const topItem = storeFallback[0];
      const lowestPrice = Math.min(...storeFallback.map((p) => p.price + p.shippingFee));
      const avgRating = Number((storeFallback.reduce((sum, p) => sum + p.rating, 0) / storeFallback.length).toFixed(1));
      const fastestDays = Math.min(...storeFallback.map((p) => p.deliveryDays));

      return {
        store,
        storeDisplayName: storeNames[store],
        topProductTitle: `Closest: ${topItem.title}`,
        lowestPrice,
        avgRating,
        fastestDeliveryDays: fastestDays,
        available: true,
        isExactMatch: false,
        affiliateUrl: topItem.affiliateUrl,
        notice: `No exact match (${Math.max(rawCount, storeFallback.length)} items checked)`
      };
    });
  }
}

export const rankingEngine = new RankingEngine();
