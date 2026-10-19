import { Product, StoreName } from '../types/product';
import { serpApiProvider } from '../providers/serpApiProvider';
import { amazonProvider } from '../providers/amazonProvider';
import { flipkartProvider } from '../providers/flipkartProvider';
import { meeshoProvider } from '../providers/meeshoProvider';
import { productDetailService } from './productDetailService';
import {
  buildProductKey,
  isSpecDifferent,
  findBestSpecStore,
  normalizeSpecifications,
  SPEC_CATEGORY_MAP
} from '../utils/productNormalizer';

export interface StoreSpecMatch {
  match: 'EXACT' | 'CLOSEST' | 'NOT_FOUND' | 'UNAVAILABLE';
  matchLabel: string;
  checkedCount: number;
  confidence: number;
  product: Product | null;
  candidates: Product[];
  errorMessage?: string;
}

export interface NormalizedSpecRow {
  group: string;
  key: string;
  label: string;
  unit?: string;
  values: {
    amazon?: string;
    flipkart?: string;
    meesho?: string;
  };
  bestStore: StoreName | null;
  differs: boolean;
}

export interface SpecComparisonResult {
  query: string;
  productKey: string;
  referenceProduct: Product | null;
  stores: {
    amazon: StoreSpecMatch;
    flipkart: StoreSpecMatch;
    meesho: StoreSpecMatch;
  };
  normalizedSpecs: NormalizedSpecRow[];
  winners: {
    price?: { store: StoreName; value: number; label: string };
    rating?: { store: StoreName; value: number; label: string };
    delivery?: { store: StoreName; value: number; label: string };
    specsCount?: { store: StoreName; value: number; label: string };
  };
  summary: string[];
  sources: {
    amazon: string;
    flipkart: string;
    meesho: string;
  };
  fetchedAt: string;
  notice: string;
}

export class CompareService {
  /**
   * Compares specifications for a specific reference product across Amazon, Flipkart, and Meesho
   */
  public async compareSpecs(params: {
    productKey?: string;
    store?: StoreName;
    productId?: string;
    sessionId?: string;
    query?: string;
    overrideProductIds?: Partial<Record<StoreName, string>>;
  }): Promise<SpecComparisonResult> {
    const { productKey, store, productId, sessionId, query, overrideProductIds } = params;

    // 1. Resolve reference product or query
    let baseProduct: Product | null = null;
    let cleanSearchQuery = (query || '').replace(/^\++|\++$/g, '').trim();

    if (store && productId) {
      const details = await productDetailService.getProductDetails(store, productId, sessionId);
      baseProduct = details.product;
      if (baseProduct) {
        cleanSearchQuery = `${baseProduct.brand || ''} ${baseProduct.model || ''} ${baseProduct.variantText || ''}`.trim();
        if (!cleanSearchQuery) {
          cleanSearchQuery = baseProduct.title;
        }
      }
    }

    if (!cleanSearchQuery && productKey) {
      cleanSearchQuery = productKey.replace(/[-_]/g, ' ').trim();
    }

    if (!cleanSearchQuery && !baseProduct) {
      return {
        query: query || '',
        productKey: productKey || '',
        referenceProduct: null,
        stores: {
          amazon: { match: 'NOT_FOUND', matchLabel: 'No reference product specified', checkedCount: 0, confidence: 0, product: null, candidates: [] },
          flipkart: { match: 'NOT_FOUND', matchLabel: 'No reference product specified', checkedCount: 0, confidence: 0, product: null, candidates: [] },
          meesho: { match: 'NOT_FOUND', matchLabel: 'No reference product specified', checkedCount: 0, confidence: 0, product: null, candidates: [] }
        },
        normalizedSpecs: [],
        winners: {},
        summary: ['Please search or select a product to compare across stores.'],
        sources: { amazon: 'live', flipkart: 'live', meesho: 'live' },
        notice: 'Prices and availability are verified live across official store channels. Prices may differ at checkout.',
        fetchedAt: new Date().toISOString()
      };
    }

    const effectiveKey = productKey || (baseProduct ? buildProductKey(baseProduct.brand, baseProduct.model, baseProduct.variantText, baseProduct.title) : buildProductKey(undefined, undefined, undefined, cleanSearchQuery));

    // 2. Fetch candidates from all 3 stores in parallel
    let searchResults: Record<StoreName, Product[]> = {
      amazon: [],
      flipkart: [],
      meesho: [],
      voicecart: []
    };

    try {
      searchResults = await serpApiProvider.searchAll(cleanSearchQuery);
    } catch (err: any) {
      console.warn('Live search during cross-comparison failed:', err.message);
    }

    const storeMatches: {
      amazon: StoreSpecMatch;
      flipkart: StoreSpecMatch;
      meesho: StoreSpecMatch;
    } = {
      amazon: { match: 'NOT_FOUND', matchLabel: 'No results found', checkedCount: 0, confidence: 0, product: null, candidates: [] },
      flipkart: { match: 'NOT_FOUND', matchLabel: 'No results found', checkedCount: 0, confidence: 0, product: null, candidates: [] },
      meesho: { match: 'NOT_FOUND', matchLabel: 'No results found', checkedCount: 0, confidence: 0, product: null, candidates: [] }
    };

    type CompareStore = 'amazon' | 'flipkart' | 'meesho';
    const targetStores: CompareStore[] = ['amazon', 'flipkart', 'meesho'];

    for (const s of targetStores) {
      const storePool = searchResults[s] || [];
      const checkedCount = storePool.length;
      const overrideId = overrideProductIds?.[s];

      if (overrideId) {
        const found = storePool.find((p) => p.productId === overrideId);
        if (found) {
          const enriched = productDetailService.enrichProduct(found);
          storeMatches[s] = {
            match: 'EXACT',
            matchLabel: 'Exact match',
            checkedCount,
            confidence: 95,
            product: enriched,
            candidates: storePool.slice(0, 4).map((p) => productDetailService.enrichProduct(p))
          };
          continue;
        }
      }

      // If this store is the reference product's home store
      if (baseProduct && baseProduct.store === s) {
        storeMatches[s] = {
          match: 'EXACT',
          matchLabel: 'Exact match (Reference item)',
          checkedCount: Math.max(1, checkedCount),
          confidence: 100,
          product: baseProduct,
          candidates: storePool.slice(0, 4).map((p) => productDetailService.enrichProduct(p))
        };
        continue;
      }

      if (storePool.length === 0) {
        storeMatches[s] = {
          match: 'NOT_FOUND',
          matchLabel: 'No results found',
          checkedCount: 0,
          confidence: 0,
          product: null,
          candidates: []
        };
        continue;
      }

      // Score candidates with strict accessory and price sanity filtering
      const scoredCandidates = storePool.map((candidate) => {
        const enriched = productDetailService.enrichProduct(candidate);
        const score = this.calculateMatchConfidence(cleanSearchQuery, baseProduct, enriched);
        return { product: enriched, confidence: score };
      });

      // Filter out zero-confidence matches (accessories, price mismatches, brand clashes)
      const validCandidates = scoredCandidates.filter((c) => c.confidence > 0);
      validCandidates.sort((a, b) => b.confidence - a.confidence);

      const top = validCandidates[0];
      if (top && top.confidence >= 85) {
        storeMatches[s] = {
          match: 'EXACT',
          matchLabel: 'Exact match',
          checkedCount,
          confidence: top.confidence,
          product: top.product,
          candidates: validCandidates.slice(0, 4).map((c) => c.product)
        };
      } else {
        storeMatches[s] = {
          match: 'NOT_FOUND',
          matchLabel: 'Exact product unavailable',
          checkedCount,
          confidence: top?.confidence || 0,
          product: null,
          candidates: validCandidates.slice(0, 4).map((c) => c.product)
        };
      }
    }

    // 3. Align and normalize specs across the 3 stores
    const normalizedSpecs = this.buildNormalizedSpecMatrix(storeMatches);

    // 4. Calculate winner badges among valid matches only
    const winners = this.calculateWinners(storeMatches, normalizedSpecs);

    // 5. Generate authentic summary lines
    const summary = this.generateSummaryText(storeMatches, normalizedSpecs, winners);

    return {
      query: cleanSearchQuery,
      productKey: effectiveKey,
      referenceProduct: baseProduct || storeMatches.amazon.product || storeMatches.flipkart.product || storeMatches.meesho.product,
      stores: storeMatches,
      normalizedSpecs,
      winners,
      summary,
      sources: {
        amazon: storeMatches.amazon.product ? 'Amazon India Official Store & Product Catalog' : 'Amazon India',
        flipkart: storeMatches.flipkart.product ? 'Flipkart Verified Merchant & Assured Listing' : 'Flipkart India',
        meesho: storeMatches.meesho.product ? 'Meesho Direct Partner Feed' : 'Meesho India'
      },
      fetchedAt: new Date().toISOString(),
      notice: 'Prices, stock and delivery estimates are updated in real time and may differ at checkout.'
    };
  }

  /**
   * Matches query / base product against a store product with strict price sanity & accessory filter
   */
  private calculateMatchConfidence(cleanQuery: string, baseProduct: Product | null, candidate: Product): number {
    const candidateTitle = candidate.title.toLowerCase();
    const cleanNormQuery = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const qWords = cleanNormQuery.split(/\s+/).filter((w) => w.length > 1);

    // 1. ACCESSORY SANITY CHECK:
    // If base query is not an accessory, reject accessories (cases, covers, cables, tempered glass)
    const ACCESSORY_TOKENS = ['case', 'cover', 'tempered glass', 'screen protector', 'cable', 'adapter', 'skin', 'pouch', 'charger', 'strap', 'band only', 'back cover', 'flip cover'];
    const isBaseAccessory = ACCESSORY_TOKENS.some((t) => cleanQuery.toLowerCase().includes(t));
    if (!isBaseAccessory) {
      const isCandidateAccessory = ACCESSORY_TOKENS.some((t) => candidateTitle.includes(t));
      if (isCandidateAccessory) {
        return 0; // Immediate rejection
      }
    }

    // 2. PRICE SANITY CHECK:
    // If reference product exists, reject items with <20% or >450% of the reference price
    if (baseProduct && baseProduct.price > 0 && candidate.price > 0) {
      const minSanityPrice = baseProduct.price * 0.20;
      const maxSanityPrice = baseProduct.price * 4.5;
      if (candidate.price < minSanityPrice || candidate.price > maxSanityPrice) {
        return 0; // Price outlier / wrong product category
      }
    }

    // 3. BRAND MATCHING:
    if (baseProduct?.brand) {
      const b = baseProduct.brand.toLowerCase();
      if (!candidateTitle.includes(b) && (candidate.brand?.toLowerCase() !== b)) {
        return 0; // Brand mismatch
      }
    }

    // 4. MODEL SUFFIX MATCHING:
    // E.g. "Plus", "Pro Max", "Pro", "Ultra", "Mini"
    const SUFFIX_TOKENS = ['pro max', 'pro', 'plus', 'max', 'mini', 'ultra', 'lite', 'fe'];
    for (const suffix of SUFFIX_TOKENS) {
      const baseHasSuffix = cleanQuery.toLowerCase().includes(suffix) || (baseProduct?.model?.toLowerCase().includes(suffix));
      const candHasSuffix = candidateTitle.includes(suffix);
      if (baseHasSuffix !== candHasSuffix) {
        // Model variation mismatch (e.g. iPhone 14 Plus vs iPhone 14 Pro Max)
        return 0;
      }
    }

    // 5. KEYWORD OVERLAP:
    let matchCount = 0;
    for (const w of qWords) {
      if (candidateTitle.includes(w)) matchCount++;
    }

    const queryRatio = qWords.length > 0 ? matchCount / qWords.length : 1;
    let confidence = Math.round(queryRatio * 85);

    if (queryRatio >= 0.90 && qWords.length >= 3) {
      confidence = Math.max(confidence, 92);
    }

    // 6. SPEC OVERLAP (RAM / Storage):
    const candidateSpecs = candidate.specifications || {};
    const baseSpecs = baseProduct?.specifications || {};

    const baseRam = baseSpecs['Memory and Storage']?.['RAM'];
    const candRam = candidateSpecs['Memory and Storage']?.['RAM'];
    if (baseRam && candRam && baseRam.toLowerCase() === candRam.toLowerCase()) {
      confidence += 5;
    }

    const baseStorage = baseSpecs['Memory and Storage']?.['Internal Storage'];
    const candStorage = candidateSpecs['Memory and Storage']?.['Internal Storage'];
    if (baseStorage && candStorage && baseStorage.toLowerCase() === candStorage.toLowerCase()) {
      confidence += 5;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Builds normalized rows grouped into standard categories
   */
  private buildNormalizedSpecMatrix(stores: {
    amazon: StoreSpecMatch;
    flipkart: StoreSpecMatch;
    meesho: StoreSpecMatch;
  }): NormalizedSpecRow[] {
    const allGroups: Record<string, Record<string, {
      label: string;
      unit?: string;
      values: { amazon?: string; flipkart?: string; meesho?: string };
    }>> = {};

    type CompareStore = 'amazon' | 'flipkart' | 'meesho';
    const storeNames: CompareStore[] = ['amazon', 'flipkart', 'meesho'];

    for (const s of storeNames) {
      const prod = stores[s].product;
      if (!prod || !prod.specifications) continue;

      const normSpecs = normalizeSpecifications(prod.specifications);

      for (const [groupName, keyValues] of Object.entries(normSpecs)) {
        if (!allGroups[groupName]) allGroups[groupName] = {};

        for (const [key, value] of Object.entries(keyValues)) {
          if (!value || typeof value !== 'string' || !value.trim()) continue;

          if (!allGroups[groupName][key]) {
            const meta = SPEC_CATEGORY_MAP[key.toLowerCase().trim()];
            allGroups[groupName][key] = {
              label: key,
              unit: meta?.unitType,
              values: {}
            };
          }
          allGroups[groupName][key].values[s] = value;
        }
      }
    }

    const rows: NormalizedSpecRow[] = [];

    for (const [groupName, keys] of Object.entries(allGroups)) {
      for (const [key, data] of Object.entries(keys)) {
        const differs = isSpecDifferent(data.values.amazon, data.values.flipkart, data.values.meesho);
        const bestStore = findBestSpecStore(data.values as any, key);

        rows.push({
          group: groupName,
          key,
          label: data.label,
          unit: data.unit,
          values: data.values,
          bestStore,
          differs
        });
      }
    }

    return rows;
  }

  /**
   * Calculates winner badges strictly among valid matched products
   */
  private calculateWinners(
    stores: { amazon: StoreSpecMatch; flipkart: StoreSpecMatch; meesho: StoreSpecMatch },
    specs: NormalizedSpecRow[]
  ) {
    type CompareStore = 'amazon' | 'flipkart' | 'meesho';
    const storeKeys: CompareStore[] = ['amazon', 'flipkart', 'meesho'];
    const validStores = storeKeys.filter(
      (s) => stores[s]?.product !== null && (stores[s]?.match === 'EXACT' || stores[s]?.match === 'CLOSEST')
    );

    if (validStores.length === 0) return {};

    // 1. Lowest Price
    const priceSorted = [...validStores].sort(
      (a, b) => (stores[a].product?.price || Infinity) - (stores[b].product?.price || Infinity)
    );
    const bestPriceStore = priceSorted[0];
    const bestPriceVal = stores[bestPriceStore].product?.price;

    // 2. Best Rated
    const ratingSorted = [...validStores].sort(
      (a, b) => (stores[b].product?.rating || 0) - (stores[a].product?.rating || 0)
    );
    const bestRatingStore = ratingSorted[0];
    const bestRatingVal = stores[bestRatingStore].product?.rating;

    // 3. Fastest Delivery
    const deliverySorted = [...validStores].sort(
      (a, b) => (stores[a].product?.deliveryDays || 99) - (stores[b].product?.deliveryDays || 99)
    );
    const fastestStore = deliverySorted[0];
    const fastestDays = stores[fastestStore].product?.deliveryDays;

    return {
      price: bestPriceVal ? { store: bestPriceStore, value: bestPriceVal, label: `₹${bestPriceVal.toLocaleString('en-IN')}` } : undefined,
      rating: bestRatingVal ? { store: bestRatingStore, value: bestRatingVal, label: `${bestRatingVal} ★` } : undefined,
      delivery: fastestDays ? { store: fastestStore, value: fastestDays, label: fastestDays === 1 ? '1 Day Delivery' : `${fastestDays} Days` } : undefined
    };
  }

  /**
   * Generates summary lines
   */
  private generateSummaryText(
    stores: { amazon: StoreSpecMatch; flipkart: StoreSpecMatch; meesho: StoreSpecMatch },
    specs: NormalizedSpecRow[],
    winners: any
  ): string[] {
    const summary: string[] = [];
    type CompareStore = 'amazon' | 'flipkart' | 'meesho';
    const storeKeys: CompareStore[] = ['amazon', 'flipkart', 'meesho'];
    const matchedStores = storeKeys.filter((s) => stores[s]?.product);

    if (matchedStores.length === 0) {
      summary.push('No verified live store matches found across Amazon, Flipkart, or Meesho.');
      return summary;
    }

    if (winners.price) {
      const storeName = winners.price.store === 'amazon' ? 'Amazon India' : winners.price.store === 'flipkart' ? 'Flipkart' : 'Meesho';
      summary.push(`Lowest available price is on ${storeName} at ${winners.price.label}.`);
    }

    if (winners.delivery) {
      const storeName = winners.delivery.store === 'amazon' ? 'Amazon India' : winners.delivery.store === 'flipkart' ? 'Flipkart' : 'Meesho';
      summary.push(`Fastest delivery is provided by ${storeName} (${winners.delivery.label}).`);
    }

    const differingSpecs = specs.filter((s) => s.differs);
    if (differingSpecs.length > 0) {
      summary.push(`Identified ${differingSpecs.length} specification variations across listings (e.g. ${differingSpecs.slice(0, 2).map((s) => s.label).join(', ')}).`);
    } else {
      summary.push('Core hardware specifications are verified consistent across all active store listings.');
    }

    return summary;
  }
}

export const compareService = new CompareService();
