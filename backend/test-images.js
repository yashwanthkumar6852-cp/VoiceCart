const https = require('https');

const urls = [
  'https://m.media-amazon.com/images/I/61uA2UVnYWL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71PsnR720LL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61vP4S4FkEL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61Cg-2uNILL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81wxS8P4t4L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71L-O5TqX2L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71S8qtN5o1L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71s8L5qV0bL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61P9c5Bv5pL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61iV8X-3e-L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71u9tA4xGzL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61-jjE67uqL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61t3Z+cR8JL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71rK6cT6k2L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71hO0pS5tPL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61xXG7xZ9CL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71q3vU6PqXL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71Wl1h5nQCL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71B9-KqN-FL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81xU9d4qFpL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71VfNfK8qPL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71y7m9aG1jL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71i7u4+xH+L._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71t-Yv-W8IL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71v4u9d3DmL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/81F90H7hnML._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/71g2ednj0JL._SL1500_.jpg',
  'https://m.media-amazon.com/images/I/61b7UeQyX9L._SL1500_.jpg'
];

async function check(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 3000 }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', (e) => resolve({ url, status: 'ERR' }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT' }); });
    req.end();
  });
}

(async () => {
  for (const u of urls) {
    const r = await check(u);
    console.log(r.status === 200 ? '✅ 200' : '❌ ' + r.status, u);
  }
})();
