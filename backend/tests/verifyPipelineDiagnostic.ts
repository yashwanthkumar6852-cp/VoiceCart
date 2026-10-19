import { querySpecExtractor } from '../src/ranking/querySpecExtractor';
import { aggregatorService } from '../src/providers/aggregatorService';
import { rankingEngine } from '../src/ranking/rankingEngine';

async function runDiagnostics() {
  console.log('===============================================================');
  console.log('VOICECART SEARCH & RELEVANCE PIPELINE FULL DIAGNOSTIC REPORT');
  console.log('===============================================================');

  const testCases = [
    { query: 'boAt Airdopes 141', lang: 'en' },
    { query: 'iPhone 15 128GB black', lang: 'en' },
    { query: 'Livesmart 4 fold umbrella', lang: 'en' },
    { query: 'wireless earbuds under 2000', lang: 'en' },
    { query: 'Samsung 43 inch smart TV', lang: 'en' },
    { query: 'boAt earbuds 2000 ke andar dikhao', lang: 'hi' },
    { query: 'boAt earbuds 2000 ಒಳಗೆ ತೋರಿಸು', lang: 'kn' }
  ];

  for (const tc of testCases) {
    console.log(`\n---------------------------------------------------------------`);
    console.log(`QUERY: "${tc.query}" (Language: ${tc.lang.toUpperCase()})`);
    console.log(`---------------------------------------------------------------`);

    // Step 1: Spec Extraction
    const spec = await querySpecExtractor.extractSpec(tc.query, tc.lang as any);
    console.log(`1. TRANSLATION / ENGLISH: "${spec.englishQuery}"`);
    console.log(`2. CLEAN QUERY: "${spec.cleanSearchQuery}"`);
    console.log(`3. PARSED SPEC:`, JSON.stringify({
      productType: spec.productType,
      brand: spec.brand,
      model: spec.model,
      variant: spec.variant,
      budgetMax: spec.budgetMax,
      isSpecific: spec.isSpecific,
      mustExcludeCount: spec.mustExclude?.length
    }));

    // Step 2: Search Execution
    const rawResult = await aggregatorService.searchAllStores(spec.cleanSearchQuery, {
      minBudget: spec.budgetMin,
      maxBudget: spec.budgetMax
    }, spec);

    console.log(`4. QUERIES SENT:`, spec.cleanSearchQuery, `(Alternatives: ${spec.alternativeQueries?.join(', ') || 'None'})`);
    console.log(`5. RAW RESULTS COUNT:`, rawResult.products.length);

    // Step 3: Ranking and Filtering
    const ranked = await rankingEngine.rank(rawResult.products, { preference: 'balanced' }, undefined, rawResult.storeStatuses, spec, rawResult.rawCounts, rawResult.queriesSent);
    console.log(`6. RESULTS AFTER FILTERING & GATING:`, ranked.rankedProducts.length);
    if (ranked.debugTrace?.rejections && ranked.debugTrace.rejections.length > 0) {
      console.log(`   FILTER DROPS (${ranked.debugTrace.rejections.length}):`);
      ranked.debugTrace.rejections.slice(0, 3).forEach(r => {
        console.log(`     - [${r.store.toUpperCase()}] "${r.title.substring(0, 45)}..." -> ${r.rejectionReason}`);
      });
    }

    console.log(`7. FINAL TOP 3:`);
    ranked.debugTrace?.top3?.forEach((prod, i) => {
      console.log(`   #${i + 1} [${prod.store.toUpperCase()}] ₹${prod.price} | Rel: ${prod.relevanceScore} | Score: ${prod.score} | "${prod.title.substring(0, 60)}"`);
    });

    console.log(`8. BEST RECOMMENDATION: [${ranked.topRecommendations.bestOverall?.store.toUpperCase()}] ₹${ranked.topRecommendations.bestOverall?.price} - "${ranked.topRecommendations.bestOverall?.title.substring(0, 55)}"`);
  }

  console.log('\n===============================================================');
  console.log('DIAGNOSTIC RUN COMPLETE');
  console.log('===============================================================');
}

runDiagnostics().catch(console.error);
