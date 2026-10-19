
const ts = require('typescript');
const fs = require('fs');
const content = fs.readFileSync('C:/Users/Yashwanth Kumar/Desktop/V3/backend/src/data/fallbackCatalog.ts', 'utf8');
const result = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const mod = {};
const exports = {};
eval(result.outputText);
console.log('Categories in FALLBACK_CATALOG:', Object.keys(FALLBACK_CATALOG).length);

let totalProducts = 0;
let emptyImages = 0;
const specIssues = [];
const imageIssues = [];

for (const [category, groups] of Object.entries(FALLBACK_CATALOG)) {
  for (const group of groups) {
    for (const p of group.stores) {
      totalProducts++;
      if (!p.imageUrl || !p.imageUrl.trim()) {
        emptyImages++;
        imageIssues.push({ category, id: p.productId, title: p.title, issue: 'Empty imageUrl' });
      } else if (!p.imageUrl.startsWith('http') && !p.imageUrl.startsWith('/')) {
        imageIssues.push({ category, id: p.productId, title: p.title, issue: 'Invalid imageUrl: ' + p.imageUrl });
      }

      const t = (p.title || '').toLowerCase();
      const specStr = JSON.stringify(p.specifications || {}).toLowerCase();
      const specs = p.specifications || {};

      // 1. Mobile specs on TV, appliances, shoes, clothing, earbuds
      if (t.includes('tv') || t.includes('television')) {
        if (specStr.includes('battery') || specStr.includes('camera') || specStr.includes('rear camera') || specStr.includes('front camera')) {
          specIssues.push({ category, id: p.productId, title: p.title, issue: 'TV has mobile specs (camera/battery)' });
        }
      }
      if (t.includes('washing machine') || t.includes('refrigerator') || t.includes('air fryer') || t.includes('mixer')) {
        if (specStr.includes('camera') || specStr.includes('display size') || specStr.includes('operating system') || specStr.includes('processor')) {
          specIssues.push({ category, id: p.productId, title: p.title, issue: 'Appliance has phone/tv specs' });
        }
      }
      if (t.includes('shoe') || t.includes('sneaker') || t.includes('shirt') || t.includes('tshirt') || t.includes('kurti') || t.includes('jeans') || t.includes('dress') || t.includes('umbrella')) {
        if (specStr.includes('battery') || specStr.includes('display size') || specStr.includes('processor') || specStr.includes('operating system') || specStr.includes('camera')) {
          specIssues.push({ category, id: p.productId, title: p.title, issue: 'Fashion/lifestyle has electronics specs' });
        }
      }
      if (t.includes('earbuds') || t.includes('headphone') || t.includes('airpods') || t.includes('neckband')) {
        if (specStr.includes('display size') || specStr.includes('rear camera') || specStr.includes('front camera') || specStr.includes('operating system')) {
          specIssues.push({ category, id: p.productId, title: p.title, issue: 'Audio has display/camera specs' });
        }
      }
      if (t.includes('phone') || t.includes('smartphone') || t.includes('iphone') || t.includes('galaxy') && !t.includes('watch') && !t.includes('book')) {
        if (specStr.includes('panel from samsung') || specStr.includes('led tv') || specStr.includes('hdmi ports') || specStr.includes('tizen')) {
          specIssues.push({ category, id: p.productId, title: p.title, issue: 'Phone has TV specs' });
        }
      }

      // Check if highlights match product
      const highStr = JSON.stringify(p.highlights || []).toLowerCase();
      if ((t.includes('shoe') || t.includes('shirt') || t.includes('umbrella')) && (highStr.includes('display') || highStr.includes('gb ram') || highStr.includes('mah'))) {
        specIssues.push({ category, id: p.productId, title: p.title, issue: 'Highlights have electronics specs: ' + highStr });
      }
    }
  }
}

console.log('Total products checked:', totalProducts);
console.log('Image issues count:', imageIssues.length);
imageIssues.forEach(i => console.log('  [IMG ISSUE]', i.category, i.id, i.title, '=>', i.issue));

console.log('Specification issues count:', specIssues.length);
specIssues.forEach(s => console.log('  [SPEC ISSUE]', s.category, s.id, s.title, '=>', s.issue));
