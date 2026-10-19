import { imageCacheService } from '../images/cache';
import { FALLBACK_CATALOG } from '../data/fallbackCatalog';
import { dbClient } from '../db/dbClient';
import { Product } from '../types/product';

interface CategoryStats {
  total: number;
  stored: number;
  skipped: number;
  failed: number;
}

interface FailureDetail {
  category: string;
  store: string;
  productId: string;
  title: string;
  reason: string;
}

async function runImageCacheJob() {
  console.log('===============================================================');
  console.log('🚀 VoiceCart Image Cache Engine - Starting Batch Job');
  console.log('===============================================================\n');

  const categoryStats: Record<string, CategoryStats> = {};
  const failures: FailureDetail[] = [];
  const processedKeys = new Set<string>();

  let overallStored = 0;
  let overallSkipped = 0;
  let overallFailed = 0;

  // 1. Priority 1: Dashboard Categories from FALLBACK_CATALOG
  const priorityCategories = [
    'all',
    'mobiles',
    'earbuds',
    'smartwatches',
    'laptops',
    'tv_appliances',
    'fashion',
    'footwear',
    'home_kitchen',
    'beauty',
    'groceries',
    'toys'
  ];

  const allCatalogCats = Array.from(new Set([...priorityCategories, ...Object.keys(FALLBACK_CATALOG)]));

  // Queue of items to process: { cat, product, storeName }
  const queue: { cat: string; product: Product; storeName: string }[] = [];

  for (const cat of allCatalogCats) {
    const storeObj = FALLBACK_CATALOG[cat];
    if (!storeObj) continue;
    categoryStats[cat] = { total: 0, stored: 0, skipped: 0, failed: 0 };

    for (const [storeName, prodList] of Object.entries(storeObj)) {
      if (!Array.isArray(prodList)) continue;
      for (const product of prodList) {
        categoryStats[cat].total++;
        queue.push({ cat, product, storeName });
      }
    }
  }

  // 2. Priority 2: Search Cache Sessions
  try {
    const sessionRows = dbClient.all('SELECT results_json FROM search_sessions LIMIT 50');
    categoryStats['search_cache'] = { total: 0, stored: 0, skipped: 0, failed: 0 };

    for (const row of sessionRows) {
      if (!row.results_json) continue;
      try {
        const products: Product[] = JSON.parse(row.results_json);
        if (Array.isArray(products)) {
          for (const product of products) {
            categoryStats['search_cache'].total++;
            queue.push({ cat: 'search_cache', product, storeName: product.store });
          }
        }
      } catch {}
    }
  } catch {}

  // 3. Priority 3: Cart Items
  try {
    const cartRows = dbClient.all('SELECT payload FROM cart_items');
    categoryStats['carts'] = { total: 0, stored: 0, skipped: 0, failed: 0 };

    for (const row of cartRows) {
      if (!row.payload) continue;
      try {
        const item: any = JSON.parse(row.payload);
        const prod = item.product || item;
        if (prod && prod.productId) {
          categoryStats['carts'].total++;
          queue.push({ cat: 'carts', product: prod, storeName: prod.store });
        }
      } catch {}
    }
  } catch {}

  // 4. Priority 4: Orders
  try {
    const orderRows = dbClient.all('SELECT payload FROM orders');
    categoryStats['orders'] = { total: 0, stored: 0, skipped: 0, failed: 0 };

    for (const row of orderRows) {
      if (!row.payload) continue;
      try {
        const order: any = JSON.parse(row.payload);
        const items = order.items || [];
        for (const it of items) {
          const prod = it.product || it;
          if (prod && prod.productId) {
            categoryStats['orders'].total++;
            queue.push({ cat: 'orders', product: prod, storeName: prod.store });
          }
        }
      } catch {}
    }
  } catch {}

  // Process items in chunks of 5 (max concurrency = 5)
  const chunkSize = 5;
  for (let i = 0; i < queue.length; i += chunkSize) {
    const chunk = queue.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async ({ cat, product, storeName }) => {
        const key = `${(product.store || storeName).toLowerCase()}_${product.productId}`;
        if (processedKeys.has(key)) {
          categoryStats[cat].skipped++;
          overallSkipped++;
          return;
        }
        processedKeys.add(key);

        try {
          const res = await imageCacheService.cacheProductImage(product);
          if (res.stored) {
            categoryStats[cat].stored++;
            overallStored++;
          } else if (res.skipped) {
            categoryStats[cat].skipped++;
            overallSkipped++;
          } else {
            categoryStats[cat].failed++;
            overallFailed++;
            failures.push({
              category: cat,
              store: product.store || storeName,
              productId: product.productId,
              title: product.title?.slice(0, 40) || 'Unknown',
              reason: res.reason || 'download_or_validation_failed'
            });
          }
        } catch (err: any) {
          categoryStats[cat].failed++;
          overallFailed++;
          failures.push({
            category: cat,
            store: product.store || storeName,
            productId: product.productId,
            title: product.title?.slice(0, 40) || 'Unknown',
            reason: err.message
          });
        }
      })
    );
  }

  // Print Summary Table
  console.log('\n===============================================================');
  console.log('📊 CATEGORY CACHING SUMMARY');
  console.log('===============================================================');
  console.log(
    'Category'.padEnd(20) +
    'Total'.padStart(8) +
    'Stored'.padStart(10) +
    'Skipped'.padStart(10) +
    'Failed'.padStart(10)
  );
  console.log('-'.repeat(58));

  for (const [cat, stats] of Object.entries(categoryStats)) {
    if (stats.total === 0) continue;
    console.log(
      cat.padEnd(20) +
      String(stats.total).padStart(8) +
      String(stats.stored).padStart(10) +
      String(stats.skipped).padStart(10) +
      String(stats.failed).padStart(10)
    );
  }
  console.log('-'.repeat(58));
  console.log(
    'TOTAL'.padEnd(20) +
    String(processedKeys.size).padStart(8) +
    String(overallStored).padStart(10) +
    String(overallSkipped).padStart(10) +
    String(overallFailed).padStart(10)
  );

  if (failures.length > 0) {
    console.log('\n===============================================================');
    console.log(`⚠️ FAILED PRODUCTS (${failures.length})`);
    console.log('===============================================================');
    for (const f of failures.slice(0, 20)) {
      console.log(`- [${f.category}] ${f.store} | ${f.productId} | ${f.title} -> Reason: ${f.reason}`);
    }
    if (failures.length > 20) {
      console.log(`... and ${failures.length - 20} more failed downloads.`);
    }
  }

  // Final status from imageCacheService
  const status = imageCacheService.getStatus();
  console.log('\n===============================================================');
  console.log('📦 STORAGE METRICS');
  console.log('===============================================================');
  console.log(`Total Stored in Images Table: ${status.totalStored}`);
  console.log(`Total Suspicious (Collisions): ${status.totalSuspicious}`);
  console.log(`Disk Storage Used:            ${status.totalMb} MB / ${status.storageCapMb} MB limit`);
  console.log(`Storage Driver:               ${status.storageDriver}`);
  console.log('===============================================================\n');

  process.exit(0);
}

runImageCacheJob().catch((err) => {
  console.error('Fatal error during image caching:', err);
  process.exit(1);
});
