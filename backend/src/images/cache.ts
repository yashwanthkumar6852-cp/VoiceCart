import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { dbClient } from '../db/dbClient';
import { Product } from '../types/product';
import { productDetailService } from '../services/productDetailService';

export interface ImageCacheResult {
  stored: boolean;
  skipped: boolean;
  failed: boolean;
  reason?: string;
  sourceName?: string;
  url?: string;
  hash?: string;
  width?: number;
  height?: number;
  byteSize?: number;
}

export interface StoredImageRow {
  store: string;
  product_id: string;
  variant?: string;
  source_url: string;
  source_name: string;
  content_type: string;
  width: number;
  height: number;
  byte_size: number;
  sha256: string;
  storage_path: string;
  data?: Buffer;
  status: string;
  created_at: string;
}

// Lightweight binary dimension parser for PNG, JPEG, WebP, AVIF
export function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 24) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc9 && marker <= 0xcb)) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      const len = buffer.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }

  // WebP: RIFF ... WEBP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const type = buffer.toString('ascii', 12, 16);
    if (type === 'VP8 ') {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    } else if (type === 'VP8L') {
      const b0 = buffer[21],
        b1 = buffer[22],
        b2 = buffer[23],
        b3 = buffer[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height };
    } else if (type === 'VP8X') {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }
  }

  return null;
}

export class ImageCacheService {
  private imagesDir: string;
  private allowedHosts: string[];
  private maxFileSize = 2 * 1024 * 1024; // 2 MB limit
  private timeoutMs = 5000; // 5 second timeout
  private maxStorageBytes: number;
  private activeDownloads = 0;
  private downloadQueue: (() => Promise<void>)[] = [];
  private maxConcurrency = 5;

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'data', 'images');
    if (!fs.existsSync(this.imagesDir)) {
      try {
        fs.mkdirSync(this.imagesDir, { recursive: true });
      } catch {}
    }

    const maxMb = parseInt(process.env.IMAGE_CACHE_MAX_MB || '200', 10) || 200;
    this.maxStorageBytes = maxMb * 1024 * 1024;

    this.allowedHosts = [
      'm.media-amazon.com',
      'images-eu.ssl-images-amazon.com',
      'images-na.ssl-images-amazon.com',
      'images-fe.ssl-images-amazon.com',
      'rukminim1.flixcart.com',
      'rukminim2.flixcart.com',
      'rukminim.flixcart.com',
      'images.meesho.com',
      'encrypted-tbn0.gstatic.com',
      'encrypted-tbn1.gstatic.com',
      'encrypted-tbn2.gstatic.com',
      'encrypted-tbn3.gstatic.com',
      'lh3.googleusercontent.com',
      'serpapi.com',
      'images.unsplash.com',
      'images.pexels.com',
      'cdn.pixabay.com'
    ];
  }

  /**
   * Concurrency manager to limit simultaneous image downloads to max 5
   */
  private async runWithConcurrency<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeDownloads >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        this.downloadQueue.push(async () => {
          resolve();
        });
      });
    }

    this.activeDownloads++;
    try {
      return await fn();
    } finally {
      this.activeDownloads--;
      const next = this.downloadQueue.shift();
      if (next) next();
    }
  }

  /**
   * SSRF and security check on candidate URL
   */
  public isUrlAllowed(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:') return false;

      const host = parsed.hostname.toLowerCase();
      // Block local/private IPs and localhost
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return false;
      }

      return this.allowedHosts.some((allowed) => host === allowed || host.endsWith('.' + allowed));
    } catch {
      return false;
    }
  }

  /**
   * Checks whether image is already stored
   */
  public isImageStored(store: string, productId: string, variant?: string): boolean {
    try {
      const cleanStore = store.toLowerCase();
      const decodedPid = decodeURIComponent(productId);
      let sql = `SELECT status, storage_path, data FROM images WHERE store = ? AND (product_id = ? OR product_id = ?) AND status = 'stored'`;
      const params: any[] = [cleanStore, productId, decodedPid];
      if (variant) {
        sql += ` AND (variant = ? OR variant IS NULL)`;
        params.push(variant);
      }
      sql += ` LIMIT 1`;
      const row = dbClient.get(sql, params);
      if (!row) return false;
      if (row.data && (Buffer.isBuffer(row.data) || row.data.length > 0)) return true;
      if (row.storage_path && row.storage_path !== 'db' && fs.existsSync(row.storage_path)) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Download and store image for a product
   */
  public async cacheProductImage(product: Product): Promise<ImageCacheResult> {
    const store = (product.store || 'amazon').toLowerCase();
    const productId = product.productId;
    const variant = product.variantText || undefined;

    if (!productId) {
      return { stored: false, skipped: false, failed: true, reason: 'missing_product_id' };
    }

    // 1. Skip if good row already exists
    if (this.isImageStored(store, productId, variant)) {
      return { stored: false, skipped: true, failed: false, reason: 'already_cached' };
    }

    // 2. Build ordered candidates from product's own record:
    // (1) largest image field (record)
    // (2) Google Shopping thumbnail (google_thumbnail)
    // (3) other images in record (record)
    // (4) details gallery (details)
    const candidateEntries: { url: string; sourceName: string }[] = [];

    const addCandidate = (u?: string, sourceName = 'record') => {
      if (!u || typeof u !== 'string' || !u.trim() || !u.startsWith('https://')) return;
      const clean = u.trim();
      if (!candidateEntries.some((c) => c.url === clean)) {
        candidateEntries.push({ url: clean, sourceName });
      }
    };

    // Primary/Largest field
    addCandidate(product.imageUrl, 'record');
    if (product.images?.[0]) addCandidate(product.images[0], 'record');
    if ((product as any).Images?.Primary?.Large?.URL) {
      addCandidate((product as any).Images.Primary.Large.URL, 'record');
    }

    // Google Shopping thumbnail
    addCandidate((product as any).thumbnail, 'google_thumbnail');
    addCandidate((product as any).serpapi_thumbnail, 'google_thumbnail');

    // Other images in record
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        addCandidate(img, 'record');
      }
    }

    // If still empty, check getProductDetails
    if (candidateEntries.length === 0 && store !== 'meesho') {
      try {
        const details = await productDetailService.getProductDetails(store as any, productId);
        if (details.product?.images?.length) {
          for (const dImg of details.product.images) {
            addCandidate(dImg, 'details');
          }
        }
      } catch {}
    }

    if (candidateEntries.length === 0) {
      return { stored: false, skipped: false, failed: true, reason: 'no_candidate_in_record' };
    }

    // 3. Try candidates in order
    for (const { url: candidateUrl, sourceName } of candidateEntries) {
      if (!this.isUrlAllowed(candidateUrl)) {
        continue;
      }

      // Safeguard: Never cache mismatched cross-category images
      const t = (product.title || '').toLowerCase();
      const lowerCandidate = candidateUrl.toLowerCase();

      // Never cache generic Unsplash or shopping thumbnails into SQLite images table
      if (
        lowerCandidate.includes('images.unsplash.com') ||
        lowerCandidate.includes('shopping?q=tbn:') ||
        lowerCandidate.includes('encrypted-tbn')
      ) {
        continue;
      }

      if (
        (lowerCandidate.includes('/mobile/') || lowerCandidate.includes('imahkkpg3hbtardn')) &&
        !t.includes('phone') &&
        !t.includes('mobile') &&
        !t.includes('smartphone') &&
        !t.includes('5g') &&
        !t.includes('iphone') &&
        !t.includes('galaxy') &&
        !t.includes('oppo') &&
        !t.includes('realme') &&
        !t.includes('vivo') &&
        !t.includes('redmi') &&
        !t.includes('poco') &&
        !t.includes('oneplus')
      ) {
        continue;
      }
      if (
        lowerCandidate.includes('51hbom8xz7l') &&
        !t.includes('earbud') &&
        !t.includes('headphone') &&
        !t.includes('airdopes') &&
        !t.includes('airpods') &&
        !t.includes('headset') &&
        !t.includes('tws') &&
        !t.includes('neckband') &&
        !t.includes('audio')
      ) {
        continue;
      }
      if (lowerCandidate.includes('71d7rfsl0wl') && !t.includes('iphone') && !t.includes('apple phone')) {
        continue;
      }
      if (lowerCandidate.includes('61ssvxtss3l') && !t.includes('watch') && !t.includes('band')) {
        continue;
      }

      try {
        const downloadResult = await this.runWithConcurrency(async () => {
          return await axios.get(candidateUrl, {
            responseType: 'arraybuffer',
            timeout: this.timeoutMs,
            maxContentLength: this.maxFileSize,
            maxBodyLength: this.maxFileSize,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              Referer: new URL(candidateUrl).origin
            }
          });
        });

        const contentType = String(downloadResult.headers['content-type'] || 'image/jpeg').toLowerCase();
        if (
          !contentType.startsWith('image/jpeg') &&
          !contentType.startsWith('image/png') &&
          !contentType.startsWith('image/webp') &&
          !contentType.startsWith('image/avif') &&
          !contentType.startsWith('image/jpg')
        ) {
          continue;
        }

        const buffer = Buffer.from(downloadResult.data);
        const byteSize = buffer.length;
        if (byteSize < 1000) {
          // Reject files under 1 KB
          continue;
        }

        // Dimensions check
        const dimensions = getImageDimensions(buffer);
        const width = dimensions?.width || 0;
        const height = dimensions?.height || 0;

        // Reject only extremely tiny images (< 60 x 60 px)
        if (width > 0 && height > 0) {
          if (width < 60 || height < 60) {
            continue;
          }
        }

        // SHA-256 hash
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

        // Check if hash already exists on a DIFFERENT product
        const existingWithHash = dbClient.get(
          'SELECT store, product_id FROM images WHERE sha256 = ? AND product_id != ? AND status != ? LIMIT 1',
          [sha256, productId, 'suspicious']
        );

        if (existingWithHash) {
          // If the exact same image hash appears on another product, avoid cross-product contamination
          continue;
        }

        // Determine storage mode (local, supabase, db)
        const storageMode = process.env.IMAGE_STORAGE || (process.env.NODE_ENV === 'production' ? 'db' : 'local');
        let storagePath = 'db';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('avif')) ext = 'avif';

        if (storageMode === 'local') {
          const fileName = `${store}_${productId.replace(/[^a-z0-9_-]/gi, '_')}_${sha256.slice(0, 8)}.${ext}`;
          storagePath = path.join(this.imagesDir, fileName);
          fs.writeFileSync(storagePath, buffer);
        }

        // Insert or replace row into images table
        dbClient.run(
          `INSERT INTO images (
            store, product_id, variant, source_url, source_name, content_type,
            width, height, byte_size, sha256, storage_path, data, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(store, product_id, variant) DO UPDATE SET
            source_url = excluded.source_url,
            source_name = excluded.source_name,
            content_type = excluded.content_type,
            width = excluded.width,
            height = excluded.height,
            byte_size = excluded.byte_size,
            sha256 = excluded.sha256,
            storage_path = excluded.storage_path,
            data = excluded.data,
            status = excluded.status,
            created_at = excluded.created_at`,
          [
            store,
            productId,
            variant || null,
            candidateUrl,
            sourceName,
            contentType,
            width || 500,
            height || 500,
            byteSize,
            sha256,
            storagePath,
            buffer,
            'stored',
            new Date().toISOString()
          ]
        );

        return {
          stored: true,
          skipped: false,
          failed: false,
          sourceName,
          url: `/api/images/file/${store}/${encodeURIComponent(productId)}${variant ? '?v=' + encodeURIComponent(variant) : ''}`,
          hash: sha256,
          width: width || 500,
          height: height || 500,
          byteSize
        };
      } catch (err: any) {
        // Continue to next candidate
        continue;
      }
    }

    return { stored: false, skipped: false, failed: true, reason: 'all_candidates_failed_or_rejected' };
  }

  /**
   * Retrieves stored image buffer for streaming
   */
  public getStoredImageFile(
    store: string,
    productId: string,
    variant?: string
  ): { buffer: Buffer; contentType: string; sha256: string } | null {
    try {
      const cleanStore = store.toLowerCase();
      const decodedPid = decodeURIComponent(productId);

      let sql = `SELECT content_type, sha256, storage_path, data, status
                 FROM images
                 WHERE store = ? AND (product_id = ? OR product_id = ?) AND status = 'stored'`;
      const params: any[] = [cleanStore, productId, decodedPid];
      if (variant) {
        sql += ` ORDER BY CASE WHEN variant = ? THEN 0 ELSE 1 END LIMIT 1`;
        params.push(variant);
      } else {
        sql += ` LIMIT 1`;
      }

      const row = dbClient.get(sql, params);

      if (!row) return null;

      // If data BLOB is stored in DB, use it directly
      if (row.data) {
        return {
          buffer: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data),
          contentType: row.content_type,
          sha256: row.sha256
        };
      }

      // If local file on disk
      if (row.storage_path && fs.existsSync(row.storage_path)) {
        return {
          buffer: fs.readFileSync(row.storage_path),
          contentType: row.content_type,
          sha256: row.sha256
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Background queueing: queues items to cache in background without blocking response
   */
  public queueProductCaching(products: Product[]): void {
    if (!Array.isArray(products) || products.length === 0) return;
    setImmediate(async () => {
      for (const p of products) {
        try {
          await this.cacheProductImage(p);
        } catch {}
      }
    });
  }

  /**
   * Cache status reporting
   */
  public getStatus(catalogCategories: Record<string, Product[]> = {}): any {
    try {
      const rows = dbClient.all('SELECT store, product_id, sha256, byte_size, status FROM images');
      const stored = rows.filter((r) => r.status === 'stored');
      const suspicious = rows.filter((r) => r.status === 'suspicious');
      const totalBytes = stored.reduce((sum, r) => sum + (r.byte_size || 0), 0);

      const categoryBreakdown: Record<string, { stored: number; missing: number; suspicious: number }> = {};
      for (const [catName, prodList] of Object.entries(catalogCategories)) {
        let catStored = 0;
        let catSuspicious = 0;
        let catMissing = 0;
        for (const p of prodList) {
          const matched = rows.find((r) => r.store === p.store.toLowerCase() && r.product_id === p.productId);
          if (matched && matched.status === 'stored') catStored++;
          else if (matched && matched.status === 'suspicious') catSuspicious++;
          else catMissing++;
        }
        categoryBreakdown[catName] = { stored: catStored, missing: catMissing, suspicious: catSuspicious };
      }

      return {
        totalStored: stored.length,
        totalSuspicious: suspicious.length,
        totalBytes,
        totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
        storageDriver: process.env.IMAGE_STORAGE || (process.env.NODE_ENV === 'production' ? 'db' : 'local'),
        storageCapMb: parseInt(process.env.IMAGE_CACHE_MAX_MB || '200', 10),
        categories: categoryBreakdown
      };
    } catch (err: any) {
      return { error: err.message };
    }
  }
}

export const imageCacheService = new ImageCacheService();
