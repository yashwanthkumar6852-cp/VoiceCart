import { dashboardFeedService, DASHBOARD_CATEGORIES } from '../services/dashboardFeedService';
import { querySpecExtractor } from '../ranking/querySpecExtractor';
import { aggregatorService } from '../providers/aggregatorService';
import { rankingEngine } from '../ranking/rankingEngine';
import { searchSessionService } from '../services/searchSessionService';
import { cacheService } from '../cache/redisClient';
import { dbClient } from '../db/dbClient';

const POPULAR_SEARCH_QUERIES = [
  'boAt earbuds under 2000',
  'iPhone 14',
  'wireless headphones with mic',
  'smart watch with amoled display',
  'running shoes for men'
];

async function warmCache() {
  console.log('🔥 [WarmCache] Starting post-deploy cache warming...');
  const startTime = Date.now();

  // 1. Warm Dashboard Category Feeds
  console.log('📦 1/2 Warming Trending Category Feeds...');
  const keyCategories = ['all', 'mobiles', 'electronics', 'fashion', 'appliances'];
  for (const cat of keyCategories) {
    try {
      const feed = await dashboardFeedService.getFeed(cat, undefined, true);
      console.log(`  ✓ Category "${cat}": cached ${feed.products.length} live products (updated: ${feed.lastUpdated})`);
    } catch (err: any) {
      console.warn(`  ⚠️ Category "${cat}" feed error:`, err.message);
    }
  }

  // 2. Warm Popular Real Product Searches
  console.log('🔍 2/2 Warming Popular Live Product Searches...');
  for (const q of POPULAR_SEARCH_QUERIES) {
    try {
      const spec = await querySpecExtractor.extractSpec(q, 'en');
      const filters = {
        maxBudget: spec.budgetMax,
        minBudget: spec.budgetMin,
        brand: spec.brand,
        preference: spec.preference || 'balanced'
      };

      const { products, storeStatuses, rawCounts, queriesSent } = await aggregatorService.searchAllStores(q, filters, spec);
      const ranked = await rankingEngine.rank(products, q, filters, storeStatuses, spec, rawCounts, queriesSent);

      const searchId = `warm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await searchSessionService.createSession({
        searchId,
        rawQuery: q,
        language: 'en',
        spec,
        products: ranked.rankedProducts,
        exactMatches: ranked.exactMatches,
        similarAlternatives: ranked.alternativeMatches,
        topRecommendations: ranked.topRecommendations,
        rawCounts,
        storeStatuses,
        debugTrace: ranked.debugTrace
      });

      console.log(`  ✓ Query "${q}": cached ${ranked.rankedProducts.length} ranked products`);
    } catch (err: any) {
      console.warn(`  ⚠️ Query "${q}" search error:`, err.message);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 [WarmCache] Cache warming complete in ${durationSec}s! First visitors will receive instant cached responses.`);
  process.exit(0);
}

warmCache().catch((err) => {
  console.error('❌ Cache warming encountered error:', err);
  process.exit(0); // non-fatal on deploy
});
