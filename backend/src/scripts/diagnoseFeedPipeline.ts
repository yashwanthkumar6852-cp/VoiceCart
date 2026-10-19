import axios from 'axios';
import { config } from '../config';
import { serpApiProvider } from '../providers/serpApiProvider';
import { dashboardFeedService, DASHBOARD_CATEGORIES } from '../services/dashboardFeedService';
import { cacheService } from '../cache/redisClient';

const TARGET_CATEGORY_IDS = [
  'all',
  'for-you',
  'fashion',
  'mobiles',
  'electronics',
  'beauty',
  'home',
  'appliances',
  'toys-baby',
  'food-health',
  'auto',
  'sports'
];

async function runDiagnosis() {
  console.log('================================================================');
  console.log('       VOICECART LIVE FEED PIPELINE DIAGNOSIS REPORT           ');
  console.log('================================================================\n');

  // 1. Check SerpApi Account Status
  console.log('--- 1. PROVIDER CREDENTIALS & QUOTA CHECK ---');
  let serpAccountStatus: any = null;
  if (!config.serpApiKey) {
    console.log('SerpApi Key: MISSING in .env');
  } else {
    try {
      const accRes = await axios.get(`https://serpapi.com/account.json?api_key=${config.serpApiKey}`, { timeout: 8000 });
      serpAccountStatus = accRes.data;
      console.log(`SerpApi Key Status: CONFIGURED & VALID`);
      console.log(`Account Email: ${serpAccountStatus.account_email || 'N/A'}`);
      console.log(`Plan: ${serpAccountStatus.plan_name || serpAccountStatus.plan_id || 'Free/Developer'}`);
      console.log(`Searches Total / Month: ${serpAccountStatus.total_searches_left ?? serpAccountStatus.plan_searches_left ?? 'N/A'}`);
      console.log(`Searches Remaining This Month: ${serpAccountStatus.total_searches_left ?? serpAccountStatus.searches_per_month ?? 'N/A'}`);
      console.log(`This Month Usage: ${serpAccountStatus.this_month_usage ?? 'N/A'}`);
    } catch (err: any) {
      console.log(`SerpApi Key Status: INVALID OR FAILED (${err.response?.status || err.message})`);
      if (err.response?.data) {
        console.log(`SerpApi Error Response:`, JSON.stringify(err.response.data));
      }
    }
  }

  console.log(`Apify Token: ${config.apifyToken ? 'CONFIGURED' : 'MISSING'}`);
  console.log(`Amazon PA-API: ${config.amazon.accessKey ? 'CONFIGURED' : 'UNCONFIGURED (using SerpApi fallback)'}`);
  console.log(`Flipkart Affiliate: ${config.flipkart.affiliateId ? 'CONFIGURED' : 'UNCONFIGURED (using SerpApi fallback)'}`);
  console.log('');

  // 2. Trace Pipeline For Each Category
  console.log('--- 2. CATEGORY-BY-CATEGORY FEED TRACE ---');
  const resultsTable: any[] = [];

  for (const catId of TARGET_CATEGORY_IDS) {
    console.log(`\n======================================================`);
    console.log(`>>> TRACING CATEGORY: "${catId}"`);
    console.log(`======================================================`);

    const normalizedId = dashboardFeedService.normalizeCategory(catId);
    const catConfig = DASHBOARD_CATEGORIES.find(c => c.id === normalizedId);
    console.log(`Normalized Category ID: "${normalizedId}"`);
    console.log(`Config Found: ${catConfig ? JSON.stringify({ id: catConfig.id, label: catConfig.label, query: catConfig.query }) : 'NONE'}`);

    const queryUsed = catConfig?.query || (catId === 'all' || catId === 'for-you' ? 'trending top deals electronics lifestyle india' : catId);
    console.log(`Search Query Used: "${queryUsed}"`);
    console.log(`Provider Target: SerpApi (Google Shopping India - amazon.in, flipkart.com, meesho.com)`);

    let rawResults: any = null;
    let providerError: string | null = null;
    let rawItemCount = 0;
    let rawShoppingList: any[] = [];

    try {
      const serpUrl = 'https://serpapi.com/search.json';
      const serpResp = await axios.get(serpUrl, {
        params: {
          engine: 'google_shopping',
          q: queryUsed,
          google_domain: 'google.co.in',
          gl: 'in',
          hl: 'en',
          location: 'India',
          direct_link: 'true',
          api_key: config.serpApiKey
        },
        timeout: 9000
      });
      rawShoppingList = serpResp.data?.shopping_results || [];
      rawItemCount = rawShoppingList.length;
      console.log(`Raw Shopping Results from SerpApi: ${rawItemCount} items`);
    } catch (err: any) {
      providerError = err.response?.data?.error || err.message;
      console.log(`Provider Error: ${providerError}`);
    }

    // Trace step-by-step filter counts
    let afterRequiredFields: any[] = [];
    const droppedRequiredFieldsReasons: string[] = [];

    for (const item of rawShoppingList) {
      const title = item.title;
      const price = item.extracted_price || item.price;
      const image = item.thumbnail || item.thumbnail_url;
      const link = item.link || item.product_link;

      if (!title) {
        droppedRequiredFieldsReasons.push(`Dropped: Missing title`);
      } else if (!image) {
        droppedRequiredFieldsReasons.push(`Dropped "${title.slice(0, 30)}...": Missing image`);
      } else if (price === undefined || price === null || price <= 0 || isNaN(Number(price))) {
        droppedRequiredFieldsReasons.push(`Dropped "${title.slice(0, 30)}...": Invalid price (${price})`);
      } else if (!link) {
        droppedRequiredFieldsReasons.push(`Dropped "${title.slice(0, 30)}...": Missing store link`);
      } else {
        afterRequiredFields.push(item);
      }
    }

    // Accessory filter trace (only if applicable)
    let afterAccessoryFilter = [...afterRequiredFields];
    const droppedAccessoryReasons: string[] = [];
    const isDeviceCategory = ['mobiles', 'laptops'].includes(normalizedId);
    if (isDeviceCategory) {
      afterAccessoryFilter = afterRequiredFields.filter(item => {
        const titleLower = (item.title || '').toLowerCase();
        const isAccessory = titleLower.includes('case') || titleLower.includes('cover') || titleLower.includes('tempered glass') || titleLower.includes('screen protector') || titleLower.includes('pouch');
        if (isAccessory) {
          droppedAccessoryReasons.push(`Dropped accessory in device category: "${item.title.slice(0, 35)}"`);
          return false;
        }
        return true;
      });
    }

    // Price sanity check
    let afterPriceSanity = afterAccessoryFilter.filter(item => {
      const price = Number(item.extracted_price || item.price || 0);
      return price > 0 && price < 10000000;
    });

    // Deduplication trace
    const seenTitles = new Set<string>();
    const afterDedupe: any[] = [];
    const droppedDedupeReasons: string[] = [];
    for (const item of afterPriceSanity) {
      const key = (item.title || '').toLowerCase().trim();
      if (seenTitles.has(key)) {
        droppedDedupeReasons.push(`Duplicate item dropped: "${item.title.slice(0, 30)}"`);
      } else {
        seenTitles.add(key);
        afterDedupe.push(item);
      }
    }

    // Feed API response test
    let apiStatus: any = null;
    try {
      // Call feed endpoint directly via service
      const feedRes = await dashboardFeedService.getFeed(catId);
      apiStatus = {
        status: feedRes.status,
        source: feedRes.source,
        updatedAt: feedRes.updatedAt,
        itemsCount: feedRes.items?.length || 0,
        message: feedRes.message
      };
    } catch (err: any) {
      apiStatus = { error: err.message };
    }

    console.log(`\n--- FILTER PIPELINE BREAKDOWN FOR "${catId}" ---`);
    console.log(`1. Raw Live Items: ${rawItemCount}`);
    console.log(`2. After Required Fields (title, image, price, link): ${afterRequiredFields.length} (Dropped: ${droppedRequiredFieldsReasons.length})`);
    if (droppedRequiredFieldsReasons.length > 0) {
      console.log(`   Sample Reasons: ${droppedRequiredFieldsReasons.slice(0, 3).join('; ')}`);
    }
    console.log(`3. After Accessory Filter: ${afterAccessoryFilter.length} (Dropped: ${droppedAccessoryReasons.length})`);
    if (droppedAccessoryReasons.length > 0) {
      console.log(`   Sample Reasons: ${droppedAccessoryReasons.slice(0, 3).join('; ')}`);
    }
    console.log(`4. After Price Sanity: ${afterPriceSanity.length}`);
    console.log(`5. After Deduplication: ${afterDedupe.length} (Dropped Duplicates: ${droppedDedupeReasons.length})`);
    console.log(`Final Processed Count: ${afterDedupe.length}`);
    console.log(`Current Feed API Response:`, JSON.stringify(apiStatus));

    resultsTable.push({
      categoryId: catId,
      normalizedId,
      queryUsed,
      rawCount: rawItemCount,
      afterReqFields: afterRequiredFields.length,
      afterAccessory: afterAccessoryFilter.length,
      afterDedupe: afterDedupe.length,
      apiStatus: apiStatus?.status || 'error',
      apiItemsCount: apiStatus?.itemsCount ?? 0,
      providerError: providerError || 'None'
    });
  }

  console.log('\n================================================================');
  console.log('                 DIAGNOSTIC SUMMARY MATRIX                      ');
  console.log('================================================================');
  console.table(resultsTable);

  process.exit(0);
}

runDiagnosis().catch(err => {
  console.error('Diagnosis script failed with fatal error:', err);
  process.exit(1);
});
