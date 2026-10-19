const fs = require('fs');
const content = fs.readFileSync('src/data/fallbackCatalog.ts', 'utf8');

const regex = /imageUrl":\s*"([^"]+)"/g;
const urls = [];
let match;
while ((match = regex.exec(content)) !== null) {
  urls.push(match[1]);
}

console.log('Total imageUrl entries:', urls.length);
const domains = {};
for (const u of urls) {
  try {
    const d = new URL(u).hostname;
    domains[d] = (domains[d] || 0) + 1;
  } catch(e) {}
}
console.log('Domains in fallbackCatalog.ts:', domains);

const sample = urls.filter(u => u.includes('unsplash')).slice(0, 5);
console.log('Sample Unsplash URLs:', sample);
