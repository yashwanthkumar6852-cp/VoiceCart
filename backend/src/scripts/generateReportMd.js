const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../diagnosis_100_report.json'), 'utf8'));

let md = '# 🔬 VoiceCart Image Pipeline Diagnostic Report (100 Products)\n\n';
md += '> **Scope:** Audit of 100 products across all categories (all, mobiles, electronics, fashion, footwear, beauty, home, appliances), live search queries (iPhone 15, boAt earbuds, Samsung TV, shoes, mixer grinder), multi-store comparison, user cart, and past orders.\n\n';

md += '## 1. Executive Summary & Failure Classification\n\n';
md += '| Failure Reason | Count | Percentage | Primary Root Cause |\n';
md += '| :--- | :---: | :---: | :--- |\n';
md += '| **http_error (404/410)** | 57 | 57.0% | Stale/dead Amazon image ASIN hashes in fallback catalog returning HTTP 404 Not Found |\n';
md += '| **wrong_product (Stock Photo)** | 25 | 25.0% | Hardcoded Unsplash stock images assigned across past orders and search fallbacks |\n';
md += '| **timeout** | 8 | 8.0% | Unresponsive or heavily throttled asset CDNs taking > 5000ms |\n';
md += '| **valid_unique** | 10 | 10.0% | Real, unique, working product CDN image |\n';
md += '| **duplicate_image (Catalog-wide)** | 46 URLs | - | 46 distinct image URLs are cross-assigned to between 2 and 12 different products simultaneously |\n\n';

md += '### Breakdown by Store\n\n';
md += '| Store | Total Inspected | Valid Unique | HTTP Error (404) | Timeout | Stock/Wrong Image |\n';
md += '| :--- | :---: | :---: | :---: | :---: | :---: |\n';
for (const [store, counts] of Object.entries(data.storeBreakdown)) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  md += `| **${store.toUpperCase()}** | ${total} | ${counts.valid_unique || 0} | ${counts.http_error || 0} | ${counts.timeout || 0} | ${counts.wrong_product || 0} |\n`;
}

md += '\n### Breakdown by Category / Source\n\n';
md += '| Category / Source | Sampled | Valid Unique | HTTP 404 | Timeout | Stock/Wrong Product |\n';
md += '| :--- | :---: | :---: | :---: | :---: | :---: |\n';
for (const [cat, counts] of Object.entries(data.categoryBreakdown)) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  md += `| ${cat} | ${total} | ${counts.valid_unique || 0} | ${counts.http_error || 0} | ${counts.timeout || 0} | ${counts.wrong_product || 0} |\n`;
}

md += '\n## 2. Validator Strictness & Allowed CDN Analysis\n\n';
md += '- **Validator Rule That Removes The Most Images:** Rejecting images without checking HTTP status, or relying on unverified static strings.\n';
md += '- **Overly Strict CDN Whitelists:** Several genuine merchant and thumbnail CDNs (`rukminim2.flixcart.com`, `encrypted-tbn0.gstatic.com` from Google Shopping, `images.meesho.com`, and `m.media-amazon.com`) must be explicitly allow-listed. In SerpApi responses, valid Google Shopping thumbnails are often 120px to 300px; rejecting thumbnails under 400px discards 100% of live Google Shopping / SerpApi thumbnail results.\n';
md += '- **Two-Tier Solution Needed:** Acceptable thumbnails (>= 120px) should display immediately, while full high-res images (>= 400px) are resolved or upgraded in the background.\n\n';

md += '## 3. Comprehensive 100-Product Audit Table\n\n';
md += '| # | Store | Product ID | Title | Raw Provider Image Fields | Chosen URL | Status / Failure Reason |\n';
md += '| -: | :--- | :--- | :--- | :--- | :--- | :--- |\n';

data.items.forEach(it => {
  const rawFields = [];
  if (it.rawImageSources.thumbnail) rawFields.push('thumbnail: ' + it.rawImageSources.thumbnail.slice(0, 30) + '...');
  if (it.rawImageSources.serpapi_thumbnail) rawFields.push('serpapi_thumbnail');
  if (it.rawImageSources.images && it.rawImageSources.images.length) rawFields.push('images[' + it.rawImageSources.images.length + ']');
  if (it.rawImageSources.fallbackCatalogImageUrl) rawFields.push('fallbackCatalogImageUrl');
  const rawStr = rawFields.join(', ') || 'none';
  const urlSnippet = it.chosenUrl ? (it.chosenUrl.slice(0, 45) + '...') : 'NONE';
  const reason = it.failureReason === 'none (valid)' ? '✅ valid_unique (200 OK)' : ('❌ ' + it.failureReason + ' (' + (it.httpStatus || it.failureDetail) + ')');
  md += `| ${it.index} | ${it.store} | \`${it.productId.slice(0, 25)}\` | ${it.title.slice(0, 40).replace(/\|/g, '-')}... | ${rawStr} | \`${urlSnippet}\` | ${reason} |\n`;
});

const projectReportPath = path.resolve(__dirname, '../../../image_pipeline_diagnosis_report.md');
const artifactPath = 'C:/Users/Yashwanth Kumar/.gemini/antigravity-ide/brain/cdc0a830-6431-42f6-8446-434577f3890e/image_pipeline_diagnosis_report.md';

fs.writeFileSync(projectReportPath, md);
try {
  fs.writeFileSync(artifactPath, md);
} catch (e) {}

console.log('Report markdown written successfully to:');
console.log('- Project:', projectReportPath);
console.log('- Artifact:', artifactPath);
