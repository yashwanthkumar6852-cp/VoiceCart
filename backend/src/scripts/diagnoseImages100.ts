import axios from 'axios';
import { FALLBACK_CATALOG } from '../data/fallbackCatalog';
import { dashboardFeedService, DASHBOARD_CATEGORIES } from '../services/dashboardFeedService';
import { serpApiProvider } from '../providers/serpApiProvider';
import { compareService } from '../services/compareService';
import { orderTrackerService } from '../services/orderTrackerService';
import { cartService } from '../services/cartService';
import { Product, StoreName } from '../types/product';

interface DiagnosticItem {
  index: number;
  section: string; // category, search, comparison, cart, order
  categoryOrQuery: string;
  store: StoreName;
  productId: string;
  title: string;
  rawImageSources: {
    thumbnail?: string;
    serpapi_thumbnail?: string;
    images?: string[];
    imageUrls?: Record<string, string>;
    imagesPrimary?: string;
    productGallery?: string[];
    fallbackCatalogImageUrl?: string;
    rawImageField?: string;
  };
  chosenUrl: string;
  httpStatus?: number | string;
  failureReason: string;
  failureDetail: string;
}

async function checkUrl(url: string): Promise<{ status: number | string; ok: boolean; contentType?: string; isHotlinkBlocked?: boolean; isExpired?: boolean }> {
  if (!url || url.trim() === '') {
    return { status: 'MISSING', ok: false };
  }
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      timeout: 5000,
      responseType: 'arraybuffer',
      validateStatus: () => true
    });
    
    if (res.status === 200) {
      const ct = String(res.headers['content-type'] || '');
      return { status: 200, ok: true, contentType: ct };
    }
    if (res.status === 403) {
      return { status: 403, ok: false, isHotlinkBlocked: true };
    }
    if (res.status === 404 || res.status === 410) {
      return { status: res.status, ok: false, isExpired: url.includes('Expires=') || url.includes('Signature=') };
    }
    return { status: res.status, ok: false };
  } catch (err: any) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return { status: 'TIMEOUT', ok: false };
    }
    return { status: err.response?.status || err.code || 'ERR', ok: false };
  }
}

async function collectProducts(): Promise<DiagnosticItem[]> {
  const items: DiagnosticItem[] = [];
  const seenIds = new Set<string>();

  // 1. Collect from Categories across stores (Feed categories)
  const categoriesToSample = ['all', 'mobiles', 'electronics', 'fashion', 'footwear', 'beauty', 'home', 'appliances', 'groceries', 'laptops', 'earbuds', 'smartwatches'];
  
  for (const cat of categoriesToSample) {
    const catalogData = (FALLBACK_CATALOG as any)[cat];
    if (catalogData) {
      for (const store of ['amazon', 'flipkart', 'meesho'] as StoreName[]) {
        const prods: Product[] = catalogData[store] || [];
        for (const p of prods.slice(0, 3)) {
          if (!seenIds.has(p.productId) && items.length < 65) {
            seenIds.add(p.productId);
            items.push({
              index: items.length + 1,
              section: 'category',
              categoryOrQuery: cat,
              store: p.store,
              productId: p.productId,
              title: p.title,
              rawImageSources: {
                fallbackCatalogImageUrl: p.imageUrl,
                images: p.images || []
              },
              chosenUrl: p.imageUrl,
              failureReason: '',
              failureDetail: ''
            });
          }
        }
      }
    }
  }

  // 2. Collect from Live Search Results
  console.log('Sampling Search Results...');
  const searchQueries = ['iphone 15', 'running shoes', 'wireless earbuds boat', 'samsung smart tv', 'mixer grinder'];
  for (const q of searchQueries) {
    try {
      const searchRes = await serpApiProvider.searchAll(q);
      for (const store of ['amazon', 'flipkart', 'meesho'] as StoreName[]) {
        const prods = searchRes[store] || [];
        for (const p of prods.slice(0, 3)) {
          if (!seenIds.has(p.productId) && items.length < 80) {
            seenIds.add(p.productId);
            items.push({
              index: items.length + 1,
              section: 'search',
              categoryOrQuery: q,
              store: p.store,
              productId: p.productId,
              title: p.title,
              rawImageSources: {
                thumbnail: (p as any).thumbnail,
                serpapi_thumbnail: (p as any).serpapi_thumbnail,
                images: p.images,
                fallbackCatalogImageUrl: p.imageUrl
              },
              chosenUrl: p.imageUrl,
              failureReason: '',
              failureDetail: ''
            });
          }
        }
      }
    } catch (e: any) {
      console.warn(`Search error for ${q}:`, e.message);
    }
  }

  // 3. Collect from Comparison
  console.log('Sampling Comparison Products...');
  try {
    const compRes = await compareService.compareSpecs({ query: 'Apple iPhone 15 128GB' });
    const compStores = ['amazon', 'flipkart', 'meesho'] as const;
    for (const s of compStores) {
      const match = compRes.stores[s];
      if (match?.product && !seenIds.has(match.product.productId)) {
        seenIds.add(match.product.productId);
        items.push({
          index: items.length + 1,
          section: 'comparison',
          categoryOrQuery: 'Apple iPhone 15 128GB',
          store: match.product.store,
          productId: match.product.productId,
          title: match.product.title,
          rawImageSources: {
            images: match.product.images,
            fallbackCatalogImageUrl: match.product.imageUrl
          },
          chosenUrl: match.product.imageUrl,
          failureReason: '',
          failureDetail: ''
        });
      }
    }
  } catch (e: any) {
    console.warn('Comparison error:', e.message);
  }

  // 4. Collect from Orders
  console.log('Sampling Order Items...');
  try {
    const orders = await orderTrackerService.getOrders();
    for (const o of orders) {
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          const prod = (item as any).product || item;
          const pid = prod.productId || `order_item_${item.id}`;
          if (!seenIds.has(pid) && items.length < 90) {
            seenIds.add(pid);
            items.push({
              index: items.length + 1,
              section: 'orders',
              categoryOrQuery: 'past_orders',
              store: prod.store || 'amazon',
              productId: pid,
              title: prod.title || 'Ordered Product',
              rawImageSources: {
                fallbackCatalogImageUrl: prod.imageUrl
              },
              chosenUrl: prod.imageUrl || '',
              failureReason: '',
              failureDetail: ''
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.warn('Orders error:', e.message);
  }

  // 5. Sample from Cart Items / Catalog to complete 100 products
  console.log('Completing sample to reach 100 items...');
  const moreCategories = ['appliances', 'home', 'beauty', 'fashion', 'electronics', 'mobiles'];
  for (const cat of moreCategories) {
    const catalogData = (FALLBACK_CATALOG as any)[cat];
    if (catalogData) {
      for (const store of ['amazon', 'flipkart', 'meesho'] as StoreName[]) {
        const prods: Product[] = catalogData[store] || [];
        for (const p of prods) {
          if (!seenIds.has(p.productId) && items.length < 100) {
            seenIds.add(p.productId);
            items.push({
              index: items.length + 1,
              section: 'cart_and_catalog',
              categoryOrQuery: cat,
              store: p.store,
              productId: p.productId,
              title: p.title,
              rawImageSources: {
                fallbackCatalogImageUrl: p.imageUrl,
                images: p.images || []
              },
              chosenUrl: p.imageUrl,
              failureReason: '',
              failureDetail: ''
            });
          }
        }
      }
    }
  }

  return items;
}

async function runDiagnosis() {
  console.log('\n======================================================');
  console.log('🔬 STEP 1: IMAGE PIPELINE DIAGNOSIS (100 PRODUCTS)');
  console.log('======================================================\n');

  const items = await collectProducts();
  console.log(`Collected ${items.length} products across categories, search, comparison, orders & cart.\n`);

  // Track occurrences of chosen URLs to detect duplicates
  const urlProductMap = new Map<string, string[]>();
  for (const item of items) {
    if (item.chosenUrl && !item.chosenUrl.includes('unsplash.com')) {
      const existing = urlProductMap.get(item.chosenUrl) || [];
      existing.push(item.productId);
      urlProductMap.set(item.chosenUrl, existing);
    }
  }

  // Classify each product
  const reasonCounts: Record<string, number> = {
    no_url_in_record: 0,
    rejected_by_validator: 0,
    http_error: 0,
    hotlink_blocked: 0,
    expired_or_signed_url: 0,
    timeout: 0,
    wrong_product: 0,
    duplicate_image: 0,
    variant_mismatch: 0,
    cache_collision: 0,
    valid_unique: 0
  };

  const storeBreakdown: Record<string, Record<string, number>> = {
    amazon: {},
    flipkart: {},
    meesho: {}
  };

  const categoryBreakdown: Record<string, Record<string, number>> = {};

  const validatorRejections = {
    size_under_400: 0,
    non_cdn_domain: 0,
    stock_unsplash: 0,
    missing_protocol: 0
  };

  console.log('Testing HTTP reachability and classifying all 100 products...');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cat = item.categoryOrQuery;
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = {};
    if (!storeBreakdown[item.store]) storeBreakdown[item.store] = {};

    const url = item.chosenUrl;

    if (!url || url.trim() === '') {
      item.failureReason = 'no_url_in_record';
      item.failureDetail = 'No image URL exists in product or provider record';
    } else if (url.includes('unsplash.com')) {
      item.failureReason = 'wrong_product';
      item.failureDetail = 'Unsplash placeholder stock photo assigned to product';
      validatorRejections.stock_unsplash++;
    } else {
      // Test URL via HTTP
      const check = await checkUrl(url);
      item.httpStatus = check.status;

      if (check.status === 'TIMEOUT') {
        item.failureReason = 'timeout';
        item.failureDetail = `Image host timed out after 5000ms: ${url.slice(0, 60)}`;
      } else if (check.status === 403) {
        item.failureReason = 'hotlink_blocked';
        item.failureDetail = `HTTP 403 Forbidden (Hotlink blocked by origin CDN)`;
      } else if (check.status === 404 || check.status === 410) {
        if (check.isExpired) {
          item.failureReason = 'expired_or_signed_url';
          item.failureDetail = `Signed/expirable CDN URL returned ${check.status} Gone/NotFound`;
        } else {
          item.failureReason = 'http_error';
          item.failureDetail = `HTTP ${check.status} Not Found from store CDN`;
        }
      } else if (typeof check.status === 'number' && check.status >= 400) {
        item.failureReason = 'http_error';
        item.failureDetail = `HTTP ${check.status} Error`;
      } else {
        // HTTP 200 - now check if duplicate / shared image
        const sharingList = urlProductMap.get(url) || [];
        if (sharingList.length > 1) {
          item.failureReason = 'duplicate_image';
          item.failureDetail = `Identical URL shared across ${sharingList.length} distinct products (${sharingList.slice(0, 2).join(', ')})`;
        } else {
          // Check title match heuristics
          const lowerTitle = item.title.toLowerCase();
          if (lowerTitle.includes('speaker') && url.includes('headphone')) {
            item.failureReason = 'wrong_product';
            item.failureDetail = 'Image asset keywords mismatch product title';
          } else {
            item.failureReason = 'none (valid)';
            item.failureDetail = 'Real, unique, verified product image';
          }
        }
      }
    }

    const key = item.failureReason === 'none (valid)' ? 'valid_unique' : item.failureReason;
    reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    storeBreakdown[item.store][key] = (storeBreakdown[item.store][key] || 0) + 1;
    categoryBreakdown[cat][key] = (categoryBreakdown[cat][key] || 0) + 1;

    // Progress
    if ((i + 1) % 25 === 0 || i === items.length - 1) {
      console.log(`Processed ${i + 1}/${items.length} items...`);
    }
  }

  // Write full raw JSON report to disk
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.resolve(__dirname, '../../diagnosis_100_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    totalInspected: items.length,
    reasonCounts,
    storeBreakdown,
    categoryBreakdown,
    validatorRejections,
    items
  }, null, 2));

  console.log(`\nDiagnosis complete! Written to ${reportPath}\n`);
}

runDiagnosis().catch(console.error);
