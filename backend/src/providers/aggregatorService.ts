import crypto from 'crypto';
import { IStoreProvider } from './storeProvider.interface';
import { amazonProvider } from './amazonProvider';
import { flipkartProvider } from './flipkartProvider';
import { meeshoProvider } from './meeshoProvider';
import { Product, SearchFilters, StoreName, StoreStatus, ProductSpec } from '../types/product';
import { cacheService } from '../cache/redisClient';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function productKey(p: Product): string {
  const base = p.productId
    ? String(p.productId)
    : crypto
        .createHash('md5')
        .update(`${p.productUrl ?? ''}|${p.title ?? ''}`)
        .digest('hex')
        .slice(0, 12);
  return `${p.store}-${base}`;
}

function completeness(p: Product): number {
  return [p.imageUrl, p.rating, p.ratingCount, p.deliveryDays, p.seller, p.productUrl].filter(Boolean).length;
}

export function dedupeProducts(products: Product[]): Product[] {
  const map = new Map<string, Product>();

  for (const p of products) {
    const key = productKey(p);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, p);
      continue;
    }

    const newPrice = toNumber(p.price);
    const oldPrice = toNumber(existing.price);

    const newIsCheaper = newPrice > 0 && (oldPrice === 0 || newPrice < oldPrice);
    const samePriceMoreData = newPrice === oldPrice && completeness(p) > completeness(existing);

    if (newIsCheaper || samePriceMoreData) map.set(key, p);
  }

  return Array.from(map.values());
}

export class AggregatorService {
  private providers: Map<StoreName, IStoreProvider> = new Map();
  // Request isolation tracking: maps sessionId/requestId to latest active search
  private activeSearches: Map<string, string> = new Map();

  constructor() {
    this.providers.set('amazon', amazonProvider);
    this.providers.set('flipkart', flipkartProvider);
    this.providers.set('meesho', meeshoProvider);
  }

  public async getStoreStatuses(): Promise<StoreStatus[]> {
    const statuses: StoreStatus[] = [];
    for (const [store, provider] of this.providers.entries()) {
      const health = await provider.checkHealth();
      statuses.push({
        store,
        name: provider.displayName,
        isAvailable: health.isAvailable,
        itemCount: 0,
        message: health.message
      });
    }
    return statuses;
  }

  /**
   * Builds canonical cache key from normalized spec attributes.
   */
  public buildSpecCacheKey(spec: ProductSpec, filters: SearchFilters = {}): string {
    const pType = (spec.productType || 'any').toLowerCase();
    const brand = (spec.brand || 'any').toLowerCase();
    const model = (spec.model || 'any').toLowerCase();
    const variantStr = JSON.stringify(spec.variant || {});
    const budgetRange = `${filters.minBudget || spec.budgetMin || 0}-${filters.maxBudget || spec.budgetMax || 0}`;
    const pref = filters.preference || spec.preference || 'balanced';
    const stores = (filters.stores || ['amazon', 'flipkart', 'meesho']).sort().join(',');

    return `spec_v4:${pType}:${brand}:${model}:${crypto.createHash('md5').update(variantStr).digest('hex').slice(0, 8)}:${budgetRange}:${pref}:${stores}`;
  }

  public async searchAllStores(
    query: string,
    filters: SearchFilters = {},
    spec?: ProductSpec
  ): Promise<{
    products: Product[];
    storeStatuses: StoreStatus[];
    rawCounts: Record<StoreName, number>;
    queriesSent: { store: StoreName; queries: string[] }[];
  }> {
    const requestId = filters.requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Build Cache Key from Normalized Spec
    let cacheKey = '';
    if (spec) {
      cacheKey = this.buildSpecCacheKey(spec, filters);
      const cached = await cacheService.get<{
        products: Product[];
        storeStatuses: StoreStatus[];
        rawCounts: Record<StoreName, number>;
        queriesSent: { store: StoreName; queries: string[] }[];
      }>(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const storesToQuery: StoreName[] =
      filters.stores && filters.stores.length > 0 ? filters.stores : ['amazon', 'flipkart', 'meesho'];

    // Determine query variations: primary clean query + 1-2 alternatives
    const searchQueries: string[] = [];
    if (spec && spec.cleanSearchQuery) {
      searchQueries.push(spec.cleanSearchQuery);
      if (spec.alternativeQueries && spec.alternativeQueries.length > 0) {
        searchQueries.push(...spec.alternativeQueries.slice(0, 2));
      }
    } else {
      searchQueries.push(query);
    }

    const queriesSent: { store: StoreName; queries: string[] }[] = [];
    const rawCounts: Record<StoreName, number> = {
      amazon: 0,
      flipkart: 0,
      meesho: 0,
      voicecart: 0
    };

    const searchPromises = storesToQuery.map(async (storeName) => {
      const provider = this.providers.get(storeName);
      queriesSent.push({ store: storeName, queries: [...searchQueries] });

      if (!provider) {
        return {
          store: storeName,
          name: storeName,
          products: [],
          status: {
            store: storeName,
            name: storeName,
            isAvailable: false,
            itemCount: 0,
            message: 'Provider not registered'
          }
        };
      }

      const startTime = Date.now();
      const isConfigured = provider.isConfigured();

      if (!isConfigured) {
        const health = await provider.checkHealth();
        return {
          store: storeName,
          name: provider.displayName,
          products: [],
          status: {
            store: storeName,
            name: provider.displayName,
            isAvailable: false,
            itemCount: 0,
            message: health.message || 'Credentials not configured in .env',
            responseTimeMs: 0
          }
        };
      }

      try {
        // Fast path: Query primary search query first
        let storeProducts: Product[] = [];
        try {
          storeProducts = await provider.search(searchQueries[0], filters);
        } catch {
          storeProducts = [];
        }

        // If primary query returned no products and alternative queries exist, query alternatives as fallback
        if (storeProducts.length === 0 && searchQueries.length > 1) {
          const altPromises = searchQueries.slice(1).map((q) => provider.search(q, filters));
          const settled = await Promise.allSettled(altPromises);
          for (const res of settled) {
            if (res.status === 'fulfilled') {
              storeProducts.push(...res.value);
            }
          }
        }

        const dedupedStoreProducts = dedupeProducts(storeProducts);
        const duration = Date.now() - startTime;
        rawCounts[storeName] = dedupedStoreProducts.length;

        return {
          store: storeName,
          name: provider.displayName,
          products: dedupedStoreProducts,
          status: {
            store: storeName,
            name: provider.displayName,
            isAvailable: true,
            itemCount: dedupedStoreProducts.length,
            message:
              dedupedStoreProducts.length > 0
                ? `Found ${dedupedStoreProducts.length} live items`
                : 'No live items matched filters',
            responseTimeMs: duration
          }
        };
      } catch (err: any) {
        const duration = Date.now() - startTime;
        return {
          store: storeName,
          name: provider.displayName,
          products: [],
          status: {
            store: storeName,
            name: provider.displayName,
            isAvailable: false,
            itemCount: 0,
            message: `API Error: ${err.message}`,
            responseTimeMs: duration
          }
        };
      }
    });

    const outcomes = await Promise.allSettled(searchPromises);
    const aggregatedProducts: Product[] = [];
    const storeStatuses: StoreStatus[] = [];

    for (const outcome of outcomes) {
      if (outcome.status === 'fulfilled') {
        aggregatedProducts.push(...outcome.value.products);
        storeStatuses.push(outcome.value.status);
      }
    }

    // Cross-store image inheritance: if a product has no image, inherit from identical matching model on another store
    for (const prod of aggregatedProducts) {
      if (!prod.imageUrl || prod.imageUrl.trim() === '') {
        const match = aggregatedProducts.find((other) => {
          if (other === prod || !other.imageUrl || other.imageUrl.trim() === '') return false;
          // Must match brand first if available
          if (prod.brand && other.brand && prod.brand.toLowerCase() !== other.brand.toLowerCase()) return false;

          // Strongest match: exact model identifier
          if (prod.model && other.model && prod.model.trim().length >= 3) {
            return prod.model.toLowerCase().trim() === other.model.toLowerCase().trim();
          }

          // Strict title similarity (exact clean prefix of at least 30 chars, not just brand)
          const cleanP = prod.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
          const cleanO = other.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
          const tokensP = cleanP.split(/\s+/).filter(t => t.length > 2);
          const tokensO = cleanO.split(/\s+/).filter(t => t.length > 2);
          if (tokensP.length >= 3 && tokensO.length >= 3) {
            const common = tokensP.filter(t => tokensO.includes(t));
            return common.length >= Math.min(tokensP.length, tokensO.length) * 0.8;
          }
          return false;
        });
        if (match) {
          prod.imageUrl = match.imageUrl;
          prod.images = match.images && match.images.length > 0 ? [...match.images] : [match.imageUrl];
        }
      }
    }

    const dedupedProducts = dedupeProducts(aggregatedProducts).map(p => {
      const { productDetailService } = require('../services/productDetailService');
      return productDetailService.enrichProduct(p);
    });

    // Background catalog enrichment: persist discovered real products to catalog database
    setImmediate(async () => {
      try {
        const { catalogDb } = require('../catalog/catalogDb');
        for (const p of dedupedProducts) {
          await catalogDb.upsertProduct(p);
        }
      } catch {}
    });

    const result = {
      products: dedupedProducts,
      storeStatuses,
      rawCounts,
      queriesSent
    };

    if (cacheKey && dedupedProducts.length > 0) {
      await cacheService.set(cacheKey, result, 300); // 5 min TTL
    }

    return result;
  }

  public dedupeProducts(products: Product[]): Product[] {
    return dedupeProducts(products);
  }

  public async getProductLive(store: StoreName, productId: string): Promise<Product | null> {
    const provider = this.providers.get(store);
    if (!provider) return null;
    return provider.getProduct(productId);
  }
}

export const aggregatorService = new AggregatorService();
