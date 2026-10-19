import { Product, StoreName } from '../types/product';
import { serpApiProvider } from '../providers/serpApiProvider';
import { productDetailService } from './productDetailService';
import { searchSessionService } from './searchSessionService';
import { cacheService } from '../cache/redisClient';
import { VALID_FEED_CATEGORIES, FeedCategory } from '../constants/routes';
import { catalogDb } from '../catalog/catalogDb';

export interface FeedCategoryInfo {
  id: FeedCategory;
  label: string;
  query: string;
  icon?: string;
}

export const DASHBOARD_CATEGORIES: FeedCategoryInfo[] = [
  { id: 'all', label: 'For You', query: 'trending top deals electronics lifestyle india' },
  { id: 'fashion', label: 'Fashion', query: 'trending fashion clothing apparel' },
  { id: 'fashion_men', label: "Men's Fashion", query: 'trending mens clothing shirts jeans tshirts india' },
  { id: 'fashion_women', label: "Women's Fashion", query: 'trending womens kurtis sarees dresses clothing india' },
  { id: 'mobiles', label: 'Mobiles', query: 'best selling 5G smartphones india' },
  { id: 'electronics', label: 'Electronics', query: 'best laptops bluetooth electronics accessories' },
  { id: 'laptops', label: 'Laptops', query: 'best laptops gaming work notebook computers' },
  { id: 'tablets', label: 'Tablets', query: 'apple ipad samsung tab lenovo tablet' },
  { id: 'tvs', label: 'Smart TVs', query: '4K smart TV Sony Bravia Samsung LG' },
  { id: 'cameras', label: 'Cameras', query: 'dslr mirrorless camera canon sony nikon gopro' },
  { id: 'gaming', label: 'Gaming', query: 'playstation 5 xbox nintendo switch gaming console' },
  { id: 'audio', label: 'Audio', query: 'wireless bluetooth earbuds headphones speakers' },
  { id: 'earbuds', label: 'Earbuds', query: 'wireless bluetooth earbuds TWS headphones' },
  { id: 'smartwatches', label: 'Smartwatches', query: 'smartwatch fitness tracker smart wearable' },
  { id: 'appliances', label: 'Appliances', query: 'kitchen appliances washing machine refrigerator microwave' },
  { id: 'beauty', label: 'Beauty', query: 'skincare beauty personal care cosmetics' },
  { id: 'health', label: 'Health', query: 'health supplements vitamins monitors wellness' },
  { id: 'home', label: 'Home', query: 'home decor living essentials furniture' },
  { id: 'home_kitchen', label: 'Home & Kitchen', query: 'cookware kitchenware home essentials storage' },
  { id: 'furniture', label: 'Furniture', query: 'office chair study table sofa bed' },
  { id: 'toys', label: 'Toys', query: 'kids toys board games educational toys' },
  { id: 'toys_baby', label: 'Toys & Baby', query: 'kids baby products educational toys' },
  { id: 'kids', label: 'Kids & Baby', query: 'kids clothing baby essentials toys care' },
  { id: 'bags', label: 'Bags & Luggage', query: 'backpacks trolley luggage laptop bags travel duffle' },
  { id: 'food_health', label: 'Food & Health', query: 'healthy nutrition supplements food groceries' },
  { id: 'auto', label: 'Auto Accessories', query: 'car bike riding helmets automotive accessories' },
  { id: 'sports_fitness', label: 'Sports & Fitness', query: 'fitness gym equipment sports badminton cricket' },
  { id: 'sports', label: 'Sports', query: 'fitness gym equipment sports badminton cricket' },
  { id: 'footwear', label: 'Footwear', query: 'top sneakers running shoes footwear' },
  { id: 'groceries', label: 'Groceries', query: 'daily grocery pantry food items cooking essentials' },
  { id: 'books_stationery', label: 'Books & Stationery', query: 'bestseller books notebooks pens stationery' }
];

export type FeedStatus = 'ready' | 'building' | 'unavailable';

export interface DashboardFeedResponse {
  category: string;
  categories: { id: string; label: string }[];
  items: Product[];
  products: Product[]; // Backwards-compatible alias for items
  total: number;
  updatedAt: string;
  lastUpdated: string; // Backwards-compatible alias for updatedAt
  status: FeedStatus;
  source: 'live' | 'cache' | 'building' | 'stale';
  message?: string;
}

export class DashboardFeedService {
  private cacheTTLSeconds = 3 * 60 * 60; // 3 Hours TTL
  private inMemoryFeeds: Map<string, { data: DashboardFeedResponse; expiresAt: number }> = new Map();
  private allFeedProducts: Map<string, Product> = new Map();
  private buildingCategories: Set<string> = new Set();

  /**
   * Fast synchronous lookup of any feed product by store and productId
   */
  public getCachedProduct(store: string, productId: string): Product | null {
    const cleanStore = (store || '').toLowerCase();
    const cleanId = (productId || '').trim();
    const decodedId = decodeURIComponent(cleanId);

    return (
      this.allFeedProducts.get(`${cleanStore}:${cleanId}`) ||
      this.allFeedProducts.get(`${cleanStore}:${decodedId}`) ||
      this.allFeedProducts.get(cleanId) ||
      this.allFeedProducts.get(decodedId) ||
      null
    );
  }

  /**
   * Normalizes category aliases (e.g. for-you -> all, toys-baby -> toys_baby, sports -> sports_fitness)
   */
  public normalizeCategory(cat?: string): FeedCategory {
    if (!cat || !cat.trim()) return 'all';
    const clean = cat.trim().toLowerCase();
    if (clean === 'for-you' || clean === 'for_you') return 'all';
    if (clean === 'toys-baby' || clean === 'toys_baby') return 'toys_baby';
    if (clean === 'food-health' || clean === 'food_health') return 'food_health';
    if (clean === 'sports' || clean === 'sports-fitness' || clean === 'sports_fitness') return 'sports_fitness';
    return (VALID_FEED_CATEGORIES as readonly string[]).includes(clean) ? (clean as FeedCategory) : 'all';
  }

  /**
   * Returns cache summary state for health checks
   */
  public getCacheState(): { cachedCategories: string[]; buildingCategories: string[]; totalCachedProducts: number } {
    const cachedCategories = Array.from(this.inMemoryFeeds.keys());
    const buildingCategories = Array.from(this.buildingCategories);
    return {
      cachedCategories,
      buildingCategories,
      totalCachedProducts: this.allFeedProducts.size
    };
  }

  /**
   * Validates if a category identifier is supported
   */
  public isValidCategory(cat: string): boolean {
    if (!cat) return true;
    const clean = cat.trim().toLowerCase();
    return (VALID_FEED_CATEGORIES as readonly string[]).includes(clean);
  }

  /**
   * Retrieves or builds the trending feed for a category. Never returns 404 for empty data.
   */
  public async getFeed(categoryId = 'all', storeFilter?: string, refresh = false): Promise<DashboardFeedResponse> {
    const rawCat = (categoryId || 'all').trim().toLowerCase();

    if (!this.isValidCategory(rawCat)) {
      throw new Error(`Invalid category: "${categoryId}". Valid categories: ${VALID_FEED_CATEGORIES.join(', ')}`);
    }

    const normalizedCat = this.normalizeCategory(rawCat);
    const catConfig = DASHBOARD_CATEGORIES.find((c) => c.id === normalizedCat) || DASHBOARD_CATEGORIES[0];
    const cacheKey = `dashboard_feed_v2:${catConfig.id}`;

    // If force refreshed, invalidate existing cache entries
    if (refresh) {
      this.inMemoryFeeds.delete(catConfig.id);
      try {
        await cacheService.delete(cacheKey);
      } catch {}
    }

    // 1. Check in-memory feed cache (unless force-refreshed)
    const memEntry = this.inMemoryFeeds.get(catConfig.id);
    if (!refresh && memEntry && memEntry.expiresAt > Date.now() && memEntry.data.items.length > 0) {
      for (const p of memEntry.data.items) {
        this.allFeedProducts.set(`${p.store.toLowerCase()}:${p.productId}`, p);
        this.allFeedProducts.set(p.productId, p);
      }
      const filtered = this.filterByStore(memEntry.data.items, storeFilter);
      return {
        ...memEntry.data,
        items: filtered,
        products: filtered,
        total: filtered.length,
        status: 'ready',
        source: 'cache'
      };
    }

    // 2. Check persistent database/redis cache
    if (!refresh) {
      try {
        const cached = await cacheService.get<DashboardFeedResponse>(cacheKey);
        const cachedItems = cached?.items || cached?.products || [];
        if (cached && cachedItems.length > 0) {
          for (const p of cachedItems) {
            this.allFeedProducts.set(`${p.store.toLowerCase()}:${p.productId}`, p);
            this.allFeedProducts.set(p.productId, p);
          }
          const payload: DashboardFeedResponse = {
            category: catConfig.id,
            categories: DASHBOARD_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
            items: cachedItems,
            products: cachedItems,
            total: cachedItems.length,
            updatedAt: cached.updatedAt || cached.lastUpdated || new Date().toISOString(),
            lastUpdated: cached.updatedAt || cached.lastUpdated || new Date().toISOString(),
            status: 'ready',
            source: 'cache'
          };

          this.inMemoryFeeds.set(catConfig.id, {
            data: payload,
            expiresAt: Date.now() + this.cacheTTLSeconds * 1000
          });

          const filtered = this.filterByStore(cachedItems, storeFilter);
          return {
            ...payload,
            items: filtered,
            products: filtered,
            total: filtered.length
          };
        }
      } catch (err: any) {
        console.warn(`[FeedCache] Warning reading cache for ${catConfig.id}:`, err.message);
      }
    }

    // 3. Cache Miss: Check if already building in background (and not a force refresh)
    if (!refresh && this.buildingCategories.has(catConfig.id)) {
      return {
        category: catConfig.id,
        categories: DASHBOARD_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
        items: [],
        products: [],
        total: 0,
        updatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'building',
        source: 'building',
        message: `Feed for "${catConfig.label}" is being built in the background.`
      };
    }

    // 4. Build feed synchronously (for refresh or testing or instant population)
    await this.buildFeedInBackground(catConfig);
    const builtMemEntry = this.inMemoryFeeds.get(catConfig.id);
    if (builtMemEntry && builtMemEntry.data.items.length > 0) {
      const filtered = this.filterByStore(builtMemEntry.data.items, storeFilter);
      return {
        ...builtMemEntry.data,
        items: filtered,
        products: filtered,
        total: filtered.length,
        status: 'ready',
        source: 'live'
      };
    }

    // Fallback response if still processing
    return {
      category: catConfig.id,
      categories: DASHBOARD_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
      items: [],
      products: [],
      total: 0,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'building',
      source: 'building',
      message: `Feed for "${catConfig.label}" is being built in the background.`
    };
  }

  /**
   * Synchronous / Background builder that fetches live products and populates the cache
   */
  public async buildFeedInBackground(catConfig: FeedCategoryInfo): Promise<Product[]> {
    this.buildingCategories.add(catConfig.id);
    const cacheKey = `dashboard_feed_v2:${catConfig.id}`;

    try {
      const query = catConfig.query;
      let rawResults: Record<StoreName, Product[]> = {
        amazon: [],
        flipkart: [],
        meesho: [],
        voicecart: []
      };

      try {
        rawResults = await serpApiProvider.searchAll(query);
      } catch (err: any) {
        console.warn(`[FeedBuild] Live search failed for ${catConfig.id}:`, err.message);
      }

      const pool: Product[] = [];
      const stores: StoreName[] = ['amazon', 'flipkart', 'meesho'];

      const maxPerStore = Math.max(
        rawResults.amazon?.length || 0,
        rawResults.flipkart?.length || 0,
        rawResults.meesho?.length || 0
      );

      for (let i = 0; i < maxPerStore; i++) {
        for (const st of stores) {
          const item = rawResults[st]?.[i];
          if (item) {
            const enriched = productDetailService.enrichProduct(item);
            const targetCat = catConfig.id !== 'all' ? catConfig.id : (enriched.category || 'general');
          pool.push({
            ...enriched,
            category: targetCat,
            feedId: `feed_${catConfig.id}_${enriched.store}_${enriched.productId}`,
            sessionId: `feed_session_${catConfig.id}`
          } as any);
        }
      }
    }

    // If live results were empty, use catalog database first
    if (pool.length === 0) {
      try {
        const dbRes = await catalogDb.queryCatalog({
          category: catConfig.id === 'all' ? undefined : catConfig.id,
          limit: 30
        });
        if (dbRes.products.length > 0) {
          for (const p of dbRes.products) {
            const enriched = productDetailService.enrichProduct(p);
            const targetCat = catConfig.id !== 'all' ? catConfig.id : (enriched.category || 'general');
            pool.push({
              ...enriched,
              category: targetCat,
              feedId: `feed_${catConfig.id}_${enriched.store}_${enriched.productId}`,
              sessionId: `feed_session_${catConfig.id}`
            } as any);
          }
        }
      } catch {}
    }

    // If still empty, use curated catalog fallback
    if (pool.length === 0) {
      const fallback = serpApiProvider.getFallbackProducts(catConfig.query);
      const fallbackItems = [...fallback.amazon, ...fallback.flipkart, ...fallback.meesho];
      for (const p of fallbackItems) {
        const targetCat = catConfig.id !== 'all' ? catConfig.id : (p.category || 'general');
        pool.push({
          ...p,
          category: targetCat,
          feedId: `feed_${catConfig.id}_${p.store}_${p.productId}`,
          sessionId: `feed_session_${catConfig.id}`
        } as any);
      }
    }

    // Secondary safety: if still empty, use 'all' trending products
    if (pool.length === 0) {
      const defaultFallback = serpApiProvider.getFallbackProducts('all');
      const defaultItems = [...defaultFallback.amazon, ...defaultFallback.flipkart, ...defaultFallback.meesho];
      for (const p of defaultItems) {
        pool.push({
          ...p,
          category: catConfig.id !== 'all' ? catConfig.id : (p.category || 'general'),
          feedId: `feed_${catConfig.id}_${p.store}_${p.productId}`,
          sessionId: `feed_session_${catConfig.id}`
        } as any);
      }
    }

    // De-duplicate by store + productId
    const seen = new Set<string>();
    const uniqueProducts: Product[] = [];
    for (const p of pool) {
      const k = `${p.store.toLowerCase()}:${p.productId}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniqueProducts.push(p);
        this.allFeedProducts.set(k, p);
        this.allFeedProducts.set(p.productId, p);

        // Background catalog upsert only if specific category
        if (catConfig.id !== 'all') {
          catalogDb.upsertProduct({
            ...p,
            category: catConfig.id
          }).catch(() => {});
        }
      }
    }

      const now = new Date().toISOString();
      const resultPayload: DashboardFeedResponse = {
        category: catConfig.id,
        categories: DASHBOARD_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
        items: uniqueProducts,
        products: uniqueProducts,
        total: uniqueProducts.length,
        updatedAt: now,
        lastUpdated: now,
        status: uniqueProducts.length > 0 ? 'ready' : 'unavailable',
        source: 'live',
        message: uniqueProducts.length === 0 ? 'Live products temporarily unavailable for this category.' : undefined
      };

      // Save in persistent & memory cache
      await cacheService.set(cacheKey, resultPayload, this.cacheTTLSeconds);
      this.inMemoryFeeds.set(catConfig.id, {
        data: resultPayload,
        expiresAt: Date.now() + this.cacheTTLSeconds * 1000
      });

      // Register feed snapshot session
      try {
        await searchSessionService.createSession({
          searchId: `feed_search_${catConfig.id}`,
          sessionId: `feed_session_${catConfig.id}`,
          rawQuery: catConfig.query,
          language: 'en',
          spec: {
            rawQuery: catConfig.query,
            englishQuery: catConfig.query,
            cleanSearchQuery: catConfig.query,
            productType: catConfig.label,
            mustInclude: [],
            mustExclude: [],
            isSpecific: false
          } as any,
          products: uniqueProducts,
          topRecommendations: {
            bestOverall: uniqueProducts[0]
          }
        });
      } catch {}

      console.log(`✅ [FeedBuild] Built feed for "${catConfig.id}": ${uniqueProducts.length} products`);
      return uniqueProducts;
    } catch (err: any) {
      console.error(`❌ [FeedBuild] Failed to build feed for ${catConfig.id}:`, err.message);
      return [];
    } finally {
      this.buildingCategories.delete(catConfig.id);
    }
  }

  private startBackgroundBuild(catConfig: FeedCategoryInfo): void {
    if (this.buildingCategories.has(catConfig.id)) return;
    this.buildFeedInBackground(catConfig).catch((err) => {
      console.error(`[FeedBackgroundBuild] Error:`, err);
    });
  }

  private filterByStore(products: Product[], storeFilter?: string): Product[] {
    if (!storeFilter || storeFilter === 'all') return products;
    return products.filter((p) => p.store.toLowerCase() === storeFilter.toLowerCase());
  }
}

export const dashboardFeedService = new DashboardFeedService();
