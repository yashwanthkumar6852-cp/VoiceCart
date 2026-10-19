import axios from 'axios';

/**
 * VoiceCart Health & Multi-Category Feed Endpoint Verification Script
 * Usage:
 *   npx ts-node src/scripts/checkApi.ts [BASE_URL]
 * Examples:
 *   npm run check:api -- http://localhost:5000
 *   npm run check:api -- https://voicecart-backend.onrender.com
 */

async function main() {
  const rawBase = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5000';
  const baseUrl = rawBase.replace(/\/+$/, '').replace(/\/api$/, '');

  console.log('======================================================');
  console.log(`🔍 VoiceCart Comprehensive API Verifier: ${baseUrl}`);
  console.log('======================================================\n');

  let allPassed = true;

  // 1. Check GET /api/health
  const healthUrl = `${baseUrl}/api/health`;
  try {
    const start = Date.now();
    const res = await axios.get(healthUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200) {
      console.log(`✅ PASS [1/8]: GET ${healthUrl} [Status 200] (${duration}ms)`);
      console.log(`   Health: status="${res.data.status}", uptime=${Math.round(res.data.uptimeSeconds || 0)}s, DB=${res.data.database?.type || 'active'}, Categories=${res.data.feedCategories?.length || 0}\n`);
    } else {
      console.log(`❌ FAIL [1/8]: GET ${healthUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [1/8]: GET ${healthUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 2. Check GET /api/feed (Implicit "all")
  const feedDefaultUrl = `${baseUrl}/api/feed`;
  try {
    const start = Date.now();
    const res = await axios.get(feedDefaultUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200 && res.data.category === 'all') {
      const count = (res.data.items || []).length;
      console.log(`✅ PASS [2/8]: GET ${feedDefaultUrl} [Status 200] (${duration}ms)`);
      console.log(`   Implicit category: "${res.data.category}", status="${res.data.status}", items=${count}\n`);
    } else {
      console.log(`❌ FAIL [2/8]: GET ${feedDefaultUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [2/8]: GET ${feedDefaultUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 3. Check GET /api/feed?category=all
  const feedAllUrl = `${baseUrl}/api/feed?category=all`;
  try {
    const start = Date.now();
    const res = await axios.get(feedAllUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200) {
      const count = (res.data.items || []).length;
      console.log(`✅ PASS [3/8]: GET ${feedAllUrl} [Status 200] (${duration}ms)`);
      console.log(`   Explicit category="all", status="${res.data.status}", items=${count}\n`);
    } else {
      console.log(`❌ FAIL [3/8]: GET ${feedAllUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [3/8]: GET ${feedAllUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 4. Check GET /api/feed?category=mobiles
  const feedMobilesUrl = `${baseUrl}/api/feed?category=mobiles`;
  try {
    const start = Date.now();
    const res = await axios.get(feedMobilesUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200) {
      const count = (res.data.items || []).length;
      console.log(`✅ PASS [4/8]: GET ${feedMobilesUrl} [Status 200] (${duration}ms)`);
      console.log(`   Category="mobiles", status="${res.data.status}", items=${count}\n`);
    } else {
      console.log(`❌ FAIL [4/8]: GET ${feedMobilesUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [4/8]: GET ${feedMobilesUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 5. Check GET /api/feed?category=electronics
  const feedElectronicsUrl = `${baseUrl}/api/feed?category=electronics`;
  try {
    const start = Date.now();
    const res = await axios.get(feedElectronicsUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200) {
      const count = (res.data.items || []).length;
      console.log(`✅ PASS [5/8]: GET ${feedElectronicsUrl} [Status 200] (${duration}ms)`);
      console.log(`   Category="electronics", status="${res.data.status}", items=${count}\n`);
    } else {
      console.log(`❌ FAIL [5/8]: GET ${feedElectronicsUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [5/8]: GET ${feedElectronicsUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 6. Check GET /api/feed/fashion (Permanent Alias)
  const feedFashionAliasUrl = `${baseUrl}/api/feed/fashion`;
  try {
    const start = Date.now();
    const res = await axios.get(feedFashionAliasUrl, { timeout: 15000 });
    const duration = Date.now() - start;
    if (res.status === 200) {
      const count = (res.data.items || []).length;
      console.log(`✅ PASS [6/8]: GET ${feedFashionAliasUrl} [Status 200] (${duration}ms)`);
      console.log(`   Permanent Alias: category="${res.data.category}", status="${res.data.status}", items=${count}\n`);
    } else {
      console.log(`❌ FAIL [6/8]: GET ${feedFashionAliasUrl} [Status ${res.status}]`);
      allPassed = false;
    }
  } catch (err: any) {
    console.log(`❌ FAIL [6/8]: GET ${feedFashionAliasUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
    console.log(`   Error: ${err.message}\n`);
    allPassed = false;
  }

  // 7. Check GET /api/feed?category=invalid_category_test (Expects 400 Bad Request)
  const feedInvalidUrl = `${baseUrl}/api/feed?category=invalid_category_test`;
  try {
    const res = await axios.get(feedInvalidUrl, { timeout: 15000 });
    console.log(`❌ FAIL [7/8]: GET ${feedInvalidUrl} returned ${res.status}, expected 400`);
    allPassed = false;
  } catch (err: any) {
    if (err.response?.status === 400 && err.response?.data?.error === 'INVALID_CATEGORY') {
      console.log(`✅ PASS [7/8]: GET ${feedInvalidUrl} correctly rejected with Status 400 (INVALID_CATEGORY)\n`);
    } else {
      console.log(`❌ FAIL [7/8]: GET ${feedInvalidUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
      console.log(`   Error: ${err.message}\n`);
      allPassed = false;
    }
  }

  // 8. Check GET /api/genuinely_unknown_route (Expects 404 Not Found)
  const unknownUrl = `${baseUrl}/api/genuinely_unknown_route`;
  try {
    const res = await axios.get(unknownUrl, { timeout: 15000 });
    console.log(`❌ FAIL [8/8]: GET ${unknownUrl} returned ${res.status}, expected 404`);
    allPassed = false;
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.log(`✅ PASS [8/8]: GET ${unknownUrl} correctly returned Status 404 (NOT_FOUND)\n`);
    } else {
      console.log(`❌ FAIL [8/8]: GET ${unknownUrl} [Status ${err.response?.status || 'NO_RESPONSE'}]`);
      console.log(`   Error: ${err.message}\n`);
      allPassed = false;
    }
  }

  console.log('======================================================');
  if (allPassed) {
    console.log('🎉 ALL 8 API VERIFICATION CHECKS PASSED: Feed & routing are 100% healthy!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME API CHECKS FAILED: Review the output above.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error in checkApi script:', err);
  process.exit(1);
});
