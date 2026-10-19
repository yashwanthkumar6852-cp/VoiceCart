const https = require('https');
const fs = require('fs');

const content = fs.readFileSync('src/data/expandedSeedCatalog.ts', 'utf8');
const regex = /https:\/\/[^\s"',]+/g;
const allUrls = [...new Set(content.match(regex) || [])];
const imageUrls = allUrls.filter(u => u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') || u.includes('.webp') || u.includes('image'));

console.log('Total image URLs to verify:', imageUrls.length);

function check(u) {
  return new Promise(resolve => {
    try {
      const req = https.request(u, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 4000
      }, res => {
        resolve({ u, status: res.statusCode });
      });
      req.on('error', e => resolve({ u, status: 'ERR' }));
      req.on('timeout', () => { req.destroy(); resolve({ u, status: 408 }); });
      req.end();
    } catch(e) { resolve({ u, status: 'BAD' }); }
  });
}

(async () => {
  const results = [];
  for (let i = 0; i < imageUrls.length; i += 5) {
    const batch = imageUrls.slice(i, i + 5);
    const res = await Promise.all(batch.map(check));
    results.push(...res);
  }
  const fails = results.filter(r => r.status !== 200);
  console.log('Result:', results.length, 'checked. Failing:', fails.length);
  fails.forEach(f => console.log('FAIL ' + f.status + ' -> ' + f.u));
})();
