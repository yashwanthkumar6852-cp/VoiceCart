const axios = require('axios');

async function testAll() {
  const queries = [
    'boAt Airdopes 141',
    'iPhone 15 128GB black',
    'Livesmart 4 fold umbrella',
    'wireless earbuds under 2000',
    'Samsung 43 inch smart TV'
  ];

  console.log('====================================================');
  console.log('🧪 TESTING SEARCH -> RELEVANCE -> RANKING PIPELINE');
  console.log('====================================================\n');

  for (const q of queries) {
    try {
      const res = await axios.get('http://localhost:5000/api/search', { params: { q } });
      const data = res.data;
      console.log(`\n🔎 [QUERY: "${q}"]`);
      console.log(`- Parsed Spec: Brand: ${data.spec?.brand || 'N/A'} | Model: ${data.spec?.model || 'N/A'} | Type: ${data.spec?.productType} | Variant: ${JSON.stringify(data.spec?.variant || {})}`);
      console.log(`- Must Exclude: ${JSON.stringify(data.spec?.mustExclude?.slice(0, 5))}`);
      console.log(`- Clean Search Query: "${data.spec?.cleanSearchQuery}"`);
      console.log(`- Raw Count: ${JSON.stringify(data.debugTrace?.rawCounts)} -> Filtered: ${data.totalResults}`);
      console.log(`- Rejections Count: ${data.debugTrace?.rejections?.length || 0}`);
      if (data.debugTrace?.rejections?.length > 0) {
        console.log(`  Sample Rejection: "${data.debugTrace.rejections[0].title.slice(0, 50)}" -> Reason: ${data.debugTrace.rejections[0].rejectionReason}`);
      }
      console.log(`- Top Recommendations:`);
      data.products.slice(0, 3).forEach((p, idx) => {
        console.log(`  ${idx + 1}. [${p.store.toUpperCase()}] ₹${p.price} | Score: ${p.score} | Rel: ${p.relevanceScore} | Badges: ${JSON.stringify(p.badges)} | "${p.title.slice(0, 65)}..."`);
      });
      console.log(`- Comparison Matrix Stores:`);
      data.comparisonMatrix.forEach(cm => {
        console.log(`  * ${cm.storeDisplayName}: ${cm.available ? `₹${cm.lowestPrice} (${cm.topProductTitle?.slice(0, 30)}...)` : cm.notice}`);
      });
    } catch (e) {
      console.error(`❌ Error testing query "${q}":`, e.message);
    }
  }

  const voiceTests = [
    { text: 'boAt earbuds 2000 ke andar dikhao', lang: 'hi' },
    { text: 'boAt earbuds 2000 ಒಳಗೆ ತೋರಿಸು', lang: 'kn' }
  ];

  console.log('\n====================================================');
  console.log('🗣️ TESTING MULTILINGUAL VOICE SEARCH COMMANDS');
  console.log('====================================================\n');

  for (const vt of voiceTests) {
    try {
      const res = await axios.post('http://localhost:5000/api/voice/process', { transcript: vt.text });
      const data = res.data;
      console.log(`🎙️ Voice Transcript: "${vt.text}" (${vt.lang})`);
      console.log(`- Extracted Spec: Brand: ${data.searchData?.spec?.brand} | Type: ${data.searchData?.spec?.productType} | Max Budget: ₹${data.searchData?.spec?.budgetMax}`);
      console.log(`- Top Pick: ${data.searchData?.products?.[0]?.title?.slice(0, 50)}... (₹${data.searchData?.products?.[0]?.price} on ${data.searchData?.products?.[0]?.store})`);
      console.log(`- Spoken Response: "${data.intentResult?.spokenResponse}"\n`);
    } catch (e) {
      console.error(`❌ Error testing voice command "${vt.text}":`, e.message);
    }
  }
}

testAll();
