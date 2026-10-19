import crypto from 'crypto';
import {
  Product,
  ProductSpec,
  SearchResponse,
  StoreName,
  StoreStatus,
  SearchOutcome,
  SearchOutcomeStatus,
  StoreOutcome,
  StoreComparisonSummary,
  SearchRecommendation
} from '../types/product';
export { SearchRecommendation, SearchOutcome, SearchOutcomeStatus, StoreOutcome };
import { cacheService } from '../cache/redisClient';
import { dbClient } from '../db/dbClient';

export interface SearchSession {
  searchId: string;
  sessionId: string;
  rawQuery: string;
  normalizedQuery: string;
  language: 'en' | 'hi' | 'kn';
  spec: ProductSpec;
  results: Product[];
  recommendation: SearchRecommendation | null;
  replyText: string;
  spokenText: string;
  storeStatuses?: StoreStatus[];
  createdAt: string;
}

export class SearchSessionService {
  private inMemorySessions: Map<string, SearchSession> = new Map();

  /**
   * Cleans product/query string by removing command words, fillers, and normalizing known brand/model capitalization.
   */
  public cleanProductName(raw: string, spec?: ProductSpec): string {
    const BRAND_CAPS: Record<string, string> = {
      iphone: 'iPhone',
      boat: 'boAt',
      samsung: 'Samsung',
      apple: 'Apple',
      oneplus: 'OnePlus',
      xiaomi: 'Xiaomi',
      redmi: 'Redmi',
      realme: 'Realme',
      oppo: 'OPPO',
      vivo: 'Vivo',
      sony: 'Sony',
      noise: 'Noise',
      boult: 'Boult',
      ptron: 'pTron',
      livesmart: 'Livesmart'
    };

    const capitalizeText = (txt: string): string => {
      const words = txt.split(/\s+/);
      return words
        .map((w) => {
          const lower = w.toLowerCase();
          if (BRAND_CAPS[lower]) return BRAND_CAPS[lower];
          if (/^iphone$/i.test(lower)) return 'iPhone';
          if (/^(plus|pro|max|mini|ultra|fe|se|lite|5g|4g)$/i.test(lower)) {
            if (lower === '5g') return '5G';
            if (lower === '4g') return '4G';
            if (lower === 'se') return 'SE';
            if (lower === 'fe') return 'FE';
            return lower.charAt(0).toUpperCase() + lower.slice(1);
          }
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ')
        .trim();
    };

    if (spec?.model && /^iphone/i.test(spec.model)) {
      return capitalizeText(spec.model);
    }

    if (spec?.brand && spec?.productType && spec.productType !== 'product') {
      const pType = spec.productType === 'smart tv' ? 'LED TV' : spec.productType;
      if (spec.model) {
        if (spec.model.toLowerCase().includes(spec.brand.toLowerCase())) {
          return capitalizeText(`${spec.model} ${pType}`);
        }
        return capitalizeText(`${spec.brand} ${spec.model} ${pType}`);
      }
      return capitalizeText(`${spec.brand} ${pType}`);
    }

    if (spec?.cleanSearchQuery && spec.brand && spec.model) {
      if (spec.model.toLowerCase().includes(spec.brand.toLowerCase())) {
        return capitalizeText(spec.model);
      }
      return capitalizeText(`${spec.brand} ${spec.model}`);
    }

    let text = (raw || '').trim();
    // Strip command and filler words
    const FILLERS = [
      /\b(?:i want to buy|i want|want to buy|want|i need|need|show me|show|find me|find|get me|get|give me|give|look for|search for|search|compare|buy me|buy|please|can you show|can you get|for me|the best|best|cheapest|good|top rated|recommended)\b/gi,
      /\b(?:the|a|an|this|that|these|those)\b/gi,
      /\b(?:mujhe chahiye|chahiye|dikhao|batao|dhundo|khojo|lao|de do|kharidna hai|tulanatmak|achha|sabse sasta|saste)\b/gi,
      /\b(?:torisu|nodisu|beku|kodi|thoo|huduku|kharidisi|nodbeku|heli|serisu|atyuttama|kadime bele)\b/gi,
      /\b(?:under|below|less than|ke andar|ke niche|olage|kadime)\s*(?:₹|rs|rupees|inr)?\s*\d+\b/gi,
      /\b(?:on|in|from|at)\s+(?:amazon|flipkart|meesho)\b/gi,
      /\b(?:amazon|flipkart|meesho)\b/gi,
      /\b(?:on|in|from|by|at|for|of)\s+(?=(?:mi|xiaomi|redmi|boat|apple|samsung|sony|lg)\b)/gi,
      /\b(?:on|in|from|by|at)\b/gi
    ];

    for (const p of FILLERS) {
      text = text.replace(p, ' ');
    }
    text = text.replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡!"']/g, ' ').replace(/\s+/g, ' ').trim();

    return capitalizeText(text) || raw || 'item';
  }

  /**
   * Runtime Guard: Verifies recommendation title complies with parsed brand, model, and category.
   */
  public validateRecommendation(
    rec: SearchRecommendation | null,
    spec: ProductSpec
  ): boolean {
    if (!rec) return false;
    const titleLower = rec.title.toLowerCase();

    // 1. If brand is specified, title must contain the brand
    if (spec.brand) {
      const brandLower = spec.brand.toLowerCase();
      if (['mi', 'xiaomi', 'redmi'].includes(brandLower)) {
        if (!titleLower.includes('mi') && !titleLower.includes('xiaomi') && !titleLower.includes('redmi')) {
          return false;
        }
      } else if (brandLower === 'boat' && !titleLower.includes('boat')) {
        return false;
      } else if (brandLower === 'apple' && !titleLower.includes('apple') && !titleLower.includes('iphone')) {
        return false;
      } else if (!titleLower.includes(brandLower)) {
        return false;
      }
    }

    // 2. If model is specified, required tokens must be present
    if (spec.mustInclude && spec.mustInclude.length > 0) {
      const missingTokens = spec.mustInclude.filter((tok) => {
        const tLower = tok.toLowerCase();
        if (['the', 'a', 'an', 'for', 'with', 'in', 'on', 'by', 'at', 'of'].includes(tLower)) return false;
        return !titleLower.includes(tLower);
      });
      if (missingTokens.some((t) => /\d+/.test(t))) {
        return false;
      }
    }

    // 3. Exclude accessories if looking for main item
    if (spec.mustExclude && spec.mustExclude.length > 0) {
      for (const exc of spec.mustExclude) {
        if (titleLower.includes(exc.toLowerCase())) return false;
      }
    }

    return true;
  }

  /**
   * Generates a single, coherent SearchOutcome object driving voice, text, banner, table, and alternatives.
   */
  public buildOutcome(params: {
    searchId: string;
    sessionId?: string;
    rawQuery: string;
    language?: 'en' | 'hi' | 'kn';
    spec: ProductSpec;
    products: Product[];
    exactMatches: Product[];
    similarAlternatives: Product[];
    topRecommendations: {
      bestOverall?: Product;
      lowestPrice?: Product;
      fastestDelivery?: Product;
      bestRated?: Product;
    };
    rawCounts?: Record<StoreName, number>;
    storeStatuses?: StoreStatus[];
    debugTrace?: any;
  }): SearchOutcome {
    const {
      searchId,
      rawQuery,
      spec,
      products,
      exactMatches,
      similarAlternatives,
      topRecommendations,
      rawCounts = { amazon: 0, flipkart: 0, meesho: 0, voicecart: 0 },
      storeStatuses = [],
      debugTrace
    } = params;
    const language = params.language || 'en';
    const cleanProductName = this.cleanProductName(rawQuery, spec);

    // 1. Determine Global Search Outcome Status
    let status: SearchOutcomeStatus = 'none';
    const allProvidersUnavailable = storeStatuses.length > 0 && storeStatuses.every((s) => !s.isAvailable);

    if (exactMatches.length > 0) {
      status = 'exact_found';
    } else if (similarAlternatives.length > 0 || (products.length > 0 && products.some(p => (p.relevanceScore || 0) >= 40))) {
      status = 'similar_only';
    } else if (allProvidersUnavailable) {
      status = 'sources_unavailable';
    } else {
      status = 'none';
    }

    // 2. Build Recommendation Candidate
    let bestRecProduct: Product | undefined = undefined;
    if (status === 'exact_found') {
      bestRecProduct = topRecommendations.bestOverall || exactMatches[0];
    } else if (status === 'similar_only') {
      const candidates = [
        topRecommendations.bestOverall,
        similarAlternatives[0],
        products.find((p) => (p.relevanceScore || 0) >= 45),
        products[0]
      ].filter(Boolean) as Product[];

      if (spec.brand) {
        bestRecProduct = candidates.find(p => {
          const rec: SearchRecommendation = { ...p, pack: '1 Unit', badges: [] } as any;
          return this.validateRecommendation(rec, spec);
        });
      } else {
        bestRecProduct = candidates[0];
      }
    }

    let bestRecommendation: SearchRecommendation | null = null;
    if (bestRecProduct) {
      bestRecommendation = {
        productId: bestRecProduct.productId,
        store: bestRecProduct.store,
        title: bestRecProduct.title,
        brand: bestRecProduct.brand,
        imageUrl: bestRecProduct.imageUrl,
        price: bestRecProduct.price,
        mrp: bestRecProduct.mrp,
        rating: bestRecProduct.rating,
        ratingCount: bestRecProduct.ratingCount,
        pack: bestRecProduct.quantityInfo?.packSize || bestRecProduct.quantity || '1 Unit',
        qualityScore: bestRecProduct.quality?.score,
        hasQualityData: bestRecProduct.quality?.hasEnoughData,
        productUrl: bestRecProduct.productUrl,
        affiliateUrl: bestRecProduct.affiliateUrl,
        deliveryDays: bestRecProduct.deliveryDays,
        shippingFee: bestRecProduct.shippingFee || 0,
        reason: bestRecProduct.reason,
        badges: bestRecProduct.badges || []
      };
    }

    // 3. Build Synchronized Written & Spoken Replies
    let writtenReply = '';
    let spokenReply = '';

    const recStoreDisplay = bestRecommendation?.store === 'amazon' ? 'Amazon' : bestRecommendation?.store === 'flipkart' ? 'Flipkart' : 'Meesho';
    const recShortTitle = bestRecommendation ? (bestRecommendation.title.split(/[,(-]/)[0].trim() || bestRecommendation.title.slice(0, 36)) : '';
    const recPriceStr = bestRecommendation ? `₹${bestRecommendation.price.toLocaleString('en-IN')}` : '';
    const recRatingStr = bestRecommendation && bestRecommendation.rating > 0 ? `${bestRecommendation.rating}★` : 'Highly rated';

    if (status === 'exact_found' && bestRecommendation) {
      const discountStr = bestRecProduct?.discountPct && bestRecProduct.discountPct > 0 ? ` (${bestRecProduct.discountPct}% off)` : '';
      const specsList = (bestRecProduct?.highlights && bestRecProduct.highlights.length > 0)
        ? bestRecProduct.highlights.slice(0, 3).join(', ')
        : (bestRecProduct?.description ? bestRecProduct.description.slice(0, 60) : '');
      const specsStr = specsList ? ` Key features: ${specsList}.` : '';
      const qualityStr = bestRecommendation.qualityScore ? ` Quality score: ${bestRecommendation.qualityScore} out of 10.` : '';
      const deliveryStr = bestRecProduct?.deliveryDays ? ` Delivery in ${bestRecProduct.deliveryDays === 1 ? '1 day' : `${bestRecProduct.deliveryDays} days`}.` : '';
      const lowestStore = topRecommendations.lowestPrice ? topRecommendations.lowestPrice.store.toUpperCase() : recStoreDisplay;
      const bestStoreStr = ` Lowest price on ${lowestStore}.`;
      const reasonStr = bestRecommendation.reason ? ` ${bestRecommendation.reason}.` : '';

      if (language === 'hi') {
        writtenReply = `${recShortTitle} ${recStoreDisplay} पर ${recPriceStr} में उपलब्ध है। रेटिंग: ${bestRecommendation.rating}★। पैक: ${bestRecommendation.pack || '1 Unit'}।${qualityStr}`.trim();
        spokenReply = `अनुशंसित उत्पाद: ${recStoreDisplay} पर ${recPriceStr}${discountStr} में ${recShortTitle}। रेटिंग: ${bestRecommendation.rating} स्टार्स।${specsStr ? ` मुख्य विशेषताएं: ${specsList}।` : ''}${qualityStr ? ` क्वालिटी स्कोर: ${bestRecommendation.qualityScore}/10।` : ''} सबसे कम कीमत ${lowestStore} पर है। क्या आप और जानकारी चाहते हैं, दूसरा विकल्प देखना चाहते हैं, या इसे बुक करें?`.replace(/\s+/g, ' ').trim();
      } else if (language === 'kn') {
        writtenReply = `${recShortTitle}, ${recStoreDisplay} ನಲ್ಲಿ ${recPriceStr}, ರೇಟಿಂಗ್: ${bestRecommendation.rating}★, ಪ್ಯಾಕ್: ${bestRecommendation.pack || '1 Unit'}.${qualityStr}`.trim();
        spokenReply = `ಶಿಫಾರಸು ಮಾಡಿದ ಉತ್ಪನ್ನ: ${recStoreDisplay} ನಲ್ಲಿ ${recPriceStr}${discountStr} ಕ್ಕೆ ${recShortTitle}. ರೇಟಿಂಗ್: ${bestRecommendation.rating} ಸ್ಟಾರ್ಸ್.${specsStr ? ` ಮುಖ್ಯ ವಿವರಗಳು: ${specsList}.` : ''}${qualityStr ? ` ಗುಣಮಟ್ಟ: ${bestRecommendation.qualityScore}/10.` : ''} ಕಡಿಮೆ ಬೆಲೆ ${lowestStore} ನಲ್ಲಿದೆ. ಹೆಚ್ಚಿನ ವಿವರ ತಿಳಿಯಲು, ಬೇರೆ ಆಯ್ಕೆ ನೋಡಲು ಅಥವಾ ಬುಕ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಾ?`.replace(/\s+/g, ' ').trim();
      } else {
        writtenReply = `${recShortTitle} on ${recStoreDisplay} for ${recPriceStr}. Rated ${bestRecommendation.rating}★ (${bestRecommendation.ratingCount.toLocaleString('en-IN')} ratings). Pack: ${bestRecommendation.pack || '1 Unit'}.${qualityStr}`.trim();
        spokenReply = `Recommended: ${recShortTitle} on ${recStoreDisplay} for ${recPriceStr}${discountStr}, rated ${bestRecommendation.rating} stars.${specsStr}${qualityStr}${deliveryStr}${bestStoreStr}${reasonStr} Would you like to know more, see another option, or book this?`.replace(/\s+/g, ' ').trim();
      }
    } else if (status === 'similar_only' && bestRecommendation) {
      if (language === 'hi') {
        writtenReply = `मुझे अभी "${cleanProductName}" का सटीक उत्पाद नहीं मिला, लेकिन ${recStoreDisplay} पर ${recShortTitle} ${recPriceStr} में ${bestRecommendation.rating}★ रेटिंग के साथ उपलब्ध है। क्या आप इसे देखना चाहते हैं?`;
        spokenReply = `मुझे अभी ${cleanProductName} नहीं मिला, लेकिन ${recStoreDisplay} पर ${recShortTitle} ${recPriceStr} में उपलब्ध है। क्या आप इसे देखना चाहते हैं?`;
      } else if (language === 'kn') {
        writtenReply = `ಕ್ಷಮಿಸಿ, "${cleanProductName}" ನಿಖರ ಫಲಿತಾಂಶ ಲಭ್ಯವಿಲ್ಲ, ಆದರೆ ${recStoreDisplay} ನಲ್ಲಿ ${recPriceStr} ಕ್ಕೆ ${recShortTitle} (${bestRecommendation.rating}★) ಲಭ್ಯವಿದೆ. ನೀವು ಇದನ್ನು ನೋಡಲು ಬಯಸುವಿರಾ?`;
        spokenReply = `ಕ್ಷಮಿಸಿ, ${cleanProductName} ನಿಖರ ಫಲಿತಾಂಶ ಲಭ್ಯವಿಲ್ಲ, ಆದರೆ ${recStoreDisplay} ನಲ್ಲಿ ${recPriceStr} ಕ್ಕೆ ${recShortTitle} ಲಭ್ಯವಿದೆ. ನೀವು ಇದನ್ನು ನೋಡಲು ಬಯಸುವಿರಾ?`;
      } else {
        writtenReply = `I couldn't find the exact ${cleanProductName} right now, but I found the ${recShortTitle} on ${recStoreDisplay} for ${recPriceStr}, rated ${bestRecommendation.rating} stars. Would you like to see it?`;
        spokenReply = `I couldn't find the exact ${cleanProductName} right now, but I found the ${recShortTitle} on ${recStoreDisplay} for ${recPriceStr}, rated ${bestRecommendation.rating} stars. Would you like to see it?`;
      }
    } else if (status === 'sources_unavailable') {
      if (language === 'hi') {
        writtenReply = `शॉपिंग स्टोर्स से अभी संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।`;
        spokenReply = writtenReply;
      } else if (language === 'kn') {
        writtenReply = `ಶಾಪಿಂಗ್ ಸ್ಟೋರ್‌ಗಳನ್ನು ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಮರುಪ್ರಯತ್ನಿಸಿ.`;
        spokenReply = writtenReply;
      } else {
        writtenReply = `Some shopping sources could not be reached right now. Please retry in a moment.`;
        spokenReply = writtenReply;
      }
    } else {
      if (language === 'hi') {
        writtenReply = `मुझे अमेज़न, फ्लिपकार्ट या मीशो पर अभी "${cleanProductName}" नहीं मिला। अधिक व्यापक खोज का प्रयास करें।`;
        spokenReply = `मुझे अमेज़न, फ्लिपकार्ट या मीशो पर अभी "${cleanProductName}" नहीं मिला।`;
      } else if (language === 'kn') {
        writtenReply = `ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಅಥವಾ ಮೀಶೋನಲ್ಲಿ "${cleanProductName}" ಕಂಡುಬಂದಿಲ್ಲ.`;
        spokenReply = writtenReply;
      } else {
        writtenReply = `I couldn't find '${cleanProductName}' on Amazon, Flipkart or Meesho right now. Try searching for a broader term.`;
        spokenReply = `I couldn't find '${cleanProductName}' on Amazon, Flipkart or Meesho right now.`;
      }
    }

    // 4. Build Banner Content
    let bannerState: 'exact_found' | 'similar_only' | 'none' = 'none';
    let bannerTitle = 'No results';

    if (status === 'exact_found') {
      bannerState = 'exact_found';
      bannerTitle = 'Exact Match Found ✓';
    } else if (status === 'similar_only' && bestRecommendation) {
      bannerState = 'similar_only';
      bannerTitle = 'Exact product not found, showing similar';
    } else {
      bannerState = 'none';
      bannerTitle = 'No results';
    }

    // 5. Build perStore Outcomes
    const stores: StoreName[] = ['amazon', 'flipkart', 'meesho'];
    const perStore: Record<StoreName, StoreOutcome> = {
      amazon: { store: 'amazon', state: 'no_results', rawCheckedCount: 0, matchedCount: 0, message: 'No results' },
      flipkart: { store: 'flipkart', state: 'no_results', rawCheckedCount: 0, matchedCount: 0, message: 'No results' },
      meesho: { store: 'meesho', state: 'no_results', rawCheckedCount: 0, matchedCount: 0, message: 'No results' },
      voicecart: { store: 'voicecart', state: 'no_results', rawCheckedCount: 0, matchedCount: 0, message: 'No results' }
    };

    for (const store of stores) {
      const storeExact = exactMatches.filter((p) => p.store === store);
      const storeSimilar = similarAlternatives.filter((p) => p.store === store && (p.relevanceScore || 0) >= 40);
      const rawCount = rawCounts[store] || 0;
      const statusItem = storeStatuses.find((s) => s.store === store);

      if (storeExact.length > 0) {
        perStore[store] = {
          store,
          state: 'matched',
          rawCheckedCount: rawCount,
          matchedCount: storeExact.length,
          closestItem: storeExact[0],
          message: `${storeExact.length} exact item${storeExact.length > 1 ? 's' : ''} available`
        };
      } else if (statusItem && !statusItem.isAvailable) {
        perStore[store] = {
          store,
          state: 'unavailable',
          rawCheckedCount: 0,
          matchedCount: 0,
          message: 'Temporarily unavailable'
        };
      } else if (rawCount > 0 || storeSimilar.length > 0) {
        perStore[store] = {
          store,
          state: 'no_match',
          rawCheckedCount: Math.max(rawCount, storeSimilar.length),
          matchedCount: 0,
          closestItem: storeSimilar[0],
          message: `No exact match (${Math.max(rawCount, storeSimilar.length)} items checked)`
        };
      } else {
        perStore[store] = {
          store,
          state: 'no_results',
          rawCheckedCount: 0,
          matchedCount: 0,
          message: 'No results'
        };
      }
    }

    // 6. Build Comparison Matrix from perStore
    const storeDisplayNames: Record<StoreName, string> = {
      amazon: 'Amazon India',
      flipkart: 'Flipkart',
      meesho: 'Meesho',
      voicecart: 'VoiceCart Direct'
    };

    const comparisonMatrix: StoreComparisonSummary[] = stores.map((store) => {
      const storeData = perStore[store];
      const item = storeData.closestItem;

      if (storeData.state === 'matched' && item) {
        const storeExact = exactMatches.filter((p) => p.store === store);
        const lowestPrice = Math.min(...storeExact.map((p) => p.price + p.shippingFee));
        const avgRating = Number((storeExact.reduce((sum, p) => sum + p.rating, 0) / storeExact.length).toFixed(1));
        const fastestDays = Math.min(...storeExact.map((p) => p.deliveryDays));

        return {
          store,
          storeDisplayName: storeDisplayNames[store],
          topProductTitle: item.title,
          lowestPrice,
          avgRating,
          fastestDeliveryDays: fastestDays,
          available: true,
          isExactMatch: true,
          affiliateUrl: item.affiliateUrl
        };
      }

      if (storeData.state === 'no_match' && item) {
        return {
          store,
          storeDisplayName: storeDisplayNames[store],
          topProductTitle: `Closest: ${item.title}`,
          lowestPrice: item.price + (item.shippingFee || 0),
          avgRating: item.rating,
          fastestDeliveryDays: item.deliveryDays,
          available: true,
          isExactMatch: false,
          affiliateUrl: item.affiliateUrl,
          notice: storeData.message
        };
      }

      return {
        store,
        storeDisplayName: storeDisplayNames[store],
        topProductTitle: undefined,
        available: false,
        isExactMatch: false,
        notice: storeData.message
      };
    });

    return {
      searchId,
      sessionId: params.sessionId,
      status,
      cleanProductName,
      exactMatches,
      similarAlternatives,
      bestRecommendation,
      banner: {
        state: bannerState,
        title: bannerTitle,
        subtitle: writtenReply
      },
      writtenReply,
      spokenReply,
      perStore,
      comparisonMatrix,
      debugTrace,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Builds and saves a SearchSession with full SearchOutcome
   */
  public async createSession(params: {
    searchId: string;
    sessionId?: string;
    rawQuery: string;
    language?: 'en' | 'hi' | 'kn';
    spec: ProductSpec;
    products: Product[];
    exactMatches?: Product[];
    similarAlternatives?: Product[];
    topRecommendations: {
      bestOverall?: Product;
      lowestPrice?: Product;
      fastestDelivery?: Product;
      bestRated?: Product;
    };
    rawCounts?: Record<StoreName, number>;
    storeStatuses?: StoreStatus[];
    debugTrace?: any;
  }): Promise<SearchSession> {
    const { searchId, rawQuery, spec, products, topRecommendations, storeStatuses, rawCounts, debugTrace } = params;
    const language = params.language || 'en';
    const sessionId = params.sessionId || `ses_${crypto.createHash('md5').update(`${searchId}_${Date.now()}`).digest('hex').slice(0, 12)}`;

    const exactMatches = params.exactMatches || products.filter((p) => p.matchType === 'EXACT');
    const similarAlternatives =
      params.similarAlternatives || products.filter((p) => p.matchType === 'PARTIAL' || p.matchType === 'SIMILAR');

    const outcome = this.buildOutcome({
      searchId,
      sessionId,
      rawQuery,
      language,
      spec,
      products,
      exactMatches,
      similarAlternatives,
      topRecommendations,
      rawCounts,
      storeStatuses,
      debugTrace
    });

    const session: SearchSession = {
      searchId,
      sessionId,
      rawQuery,
      normalizedQuery: spec.cleanSearchQuery || rawQuery,
      language,
      spec,
      results: products,
      recommendation: outcome.bestRecommendation,
      replyText: outcome.writtenReply,
      spokenText: outcome.spokenReply,
      storeStatuses,
      createdAt: new Date().toISOString()
    };

    // Store in memory Map
    this.inMemorySessions.set(searchId, session);
    this.inMemorySessions.set(sessionId, session);

    // Store in Redis cache if available
    try {
      await cacheService.set(`search_session:${searchId}`, session, 3600);
      await cacheService.set(`search_session:${sessionId}`, session, 3600);
    } catch {}

    // Store in DB for persistence (PostgreSQL / SQLite)
    try {
      await dbClient.saveSearchSession(session);
    } catch {}

    return session;
  }

  /**
   * Retrieves a SearchSession by searchId or sessionId
   */
  public async getSession(id: string): Promise<SearchSession | null> {
    if (!id) return null;

    // Check Memory
    if (this.inMemorySessions.has(id)) {
      return this.inMemorySessions.get(id)!;
    }

    // Check Redis
    try {
      const cached = await cacheService.get<SearchSession>(`search_session:${id}`);
      if (cached) {
        this.inMemorySessions.set(id, cached);
        return cached;
      }
    } catch {}

    // Check DB
    try {
      const dbSession = await dbClient.getSearchSession(id);
      if (dbSession) {
        this.inMemorySessions.set(id, dbSession);
        return dbSession;
      }
    } catch {}

    return null;
  }

  /**
   * Finds a product snapshot within a session
   */
  public async findProductInSession(
    sessionId: string,
    store: StoreName,
    productId: string
  ): Promise<Product | null> {
    const session = await this.getSession(sessionId);
    if (!session || !session.results) return null;

    const decodedId = decodeURIComponent(productId);
    const found = session.results.find(
      (p) =>
        p.store.toLowerCase() === store.toLowerCase() &&
        (p.productId === productId || p.productId === decodedId)
    );

    return found || null;
  }
}

export const searchSessionService = new SearchSessionService();
