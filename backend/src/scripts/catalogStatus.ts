import axios from 'axios';
import { catalogDb } from '../catalog/catalogDb';
import { config } from '../config';

async function main() {
  console.log('====================================================');
  console.log('🔍 VoiceCart Catalog Status & Provider Health');
  console.log('====================================================');

  const status = await catalogDb.getCatalogStatus();

  console.log('\n📊 DATABASE COUNTS:');
  console.log(`Total Products:          ${status.totalProducts}`);
  console.log(`Products with Images:    ${status.productsWithImages}`);
  console.log(`Products with Specs:     ${status.productsWithSpecs}`);
  console.log(`Products with Ratings:   ${status.productsWithRating}`);

  console.log('\n🏪 STORE BREAKDOWN:');
  for (const [store, count] of Object.entries(status.storeBreakdown)) {
    console.log(`  - ${store.padEnd(12)}: ${count} products`);
  }

  console.log('\n📁 CATEGORY BREAKDOWN:');
  for (const [category, count] of Object.entries(status.categoryBreakdown)) {
    console.log(`  - ${category.padEnd(20)}: ${count} products`);
  }

  console.log('\n🔑 PROVIDER & API CONFIGURATION:');
  console.log(`  - SerpApi:             ${config.serpApiKey ? 'Configured ✅' : 'Missing ❌'}`);
  console.log(`  - Flipkart Affiliate:  ${config.flipkart.affiliateId ? 'Configured ✅' : 'Unconfigured (using SerpApi)'}`);
  console.log(`  - Amazon Creators API: ${config.amazon.accessKey ? 'Configured ✅' : 'Unconfigured (using SerpApi)'}`);
  console.log(`  - Meesho Partner Feed: ${config.meesho.partnerApiKey ? 'Configured ✅' : 'Unconfigured (using SerpApi)'}`);
  console.log(`  - Apify API:           ${process.env.APIFY_API_KEY ? 'Configured ✅' : 'Not set'}`);

  if (config.serpApiKey) {
    try {
      const acc = await axios.get(`https://serpapi.com/account.json?api_key=${config.serpApiKey}`, { timeout: 5000 });
      console.log(`\n💳 SERPAPI QUOTA:`);
      console.log(`  - Plan:                ${acc.data?.plan_name || 'Free'}`);
      console.log(`  - Searches This Month: ${acc.data?.this_month_usage || 'N/A'}`);
      console.log(`  - Searches Remaining:  ${acc.data?.plan_searches_left || 'N/A'}`);
      console.log(`  - Total Searches:      ${acc.data?.total_searches || 'N/A'}`);
    } catch (err: any) {
      console.log(`  - Quota check failed:  ${err.message}`);
    }
  }

  console.log('====================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Status check error:', err);
  process.exit(1);
});
