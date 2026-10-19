const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const imagesDir = path.join(__dirname, '..', '..', 'data', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}
console.log('Images dir created:', imagesDir);

const dbPath = path.join(__dirname, '..', '..', 'data', 'voicecart.db');
const db = new Database(dbPath);
db.exec('DROP TABLE IF EXISTS images');
db.exec(`
  CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store TEXT NOT NULL,
    product_id TEXT NOT NULL,
    variant TEXT,
    source_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    byte_size INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    data BLOB,
    status TEXT NOT NULL DEFAULT 'stored',
    created_at TEXT NOT NULL,
    UNIQUE(store, product_id, variant)
  );
  CREATE INDEX idx_images_sha256 ON images(sha256);
  CREATE INDEX idx_images_store_pid ON images(store, product_id);
`);
console.log('Table images created successfully with full schema');
