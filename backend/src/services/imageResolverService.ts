import fs from 'fs';
import axios from 'axios';
import https from 'https';
import http from 'http';
import { dbClient } from '../db/dbClient';

export interface VerifiedImageRecord {
  store: string;
  productId: string;
  variant?: string;
  url: string;
  source: string;
  size?: string;
  verifiedAt: string;
}

export class ImageResolverService {
  private allowedHosts = [
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
    'images.unsplash.com'
  ];

  /**
   * Checks if a URL is hosted on an allow-listed image CDN
   */
  public isAllowedHost(urlString: string): boolean {
    try {
      const parsed = new URL(urlString);
      return this.allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a given image URL returns HTTP 200 with an image content-type
   */
  public async verifyImageUrl(urlString: string): Promise<{ ok: boolean; status: number; contentType?: string }> {
    if (!urlString || !urlString.trim()) {
      return { ok: false, status: 0 };
    }

    try {
      const parsed = new URL(urlString);
      const client = parsed.protocol === 'https:' ? https : http;

      return new Promise((resolve) => {
        const req = client.request(
          urlString,
          {
            method: 'HEAD',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
              Referer: parsed.origin
            },
            timeout: 3000
          },
          (res) => {
            const status = res.statusCode || 0;
            const contentType = String(res.headers['content-type'] || '');
            const ok = status >= 200 && status < 300 && contentType.startsWith('image/');
            resolve({ ok, status, contentType });
          }
        );

        req.on('error', () => {
          resolve({ ok: false, status: 0 });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false, status: 408 });
        });

        req.end();
      });
    } catch {
      return { ok: false, status: 0 };
    }
  }

  /**
   * Retrieves verified image record from persistent SQLite images table
   */
  public getStoredImage(store: string, productId: string, variant?: string, product?: any): VerifiedImageRecord | null {
    try {
      const cleanStore = (store || 'amazon').toLowerCase();
      const decodedPid = decodeURIComponent(productId);

      let sql = `SELECT store, product_id, variant, source_url, source_name, status, storage_path, data
                 FROM images
                 WHERE store = ? AND (product_id = ? OR product_id = ?) AND (status = 'stored' OR status = 'verified')`;
      const params: any[] = [cleanStore, productId, decodedPid];
      if (variant) {
        sql += ` ORDER BY CASE WHEN variant = ? THEN 0 ELSE 1 END LIMIT 1`;
        params.push(variant);
      } else {
        sql += ` LIMIT 1`;
      }

      const row = dbClient.get(sql, params);

      if (row) {
        const hasBuffer = row.data && (Buffer.isBuffer(row.data) || row.data.length > 0);
        const hasFile = row.storage_path && row.storage_path !== 'db' && fs.existsSync(row.storage_path);

        if (hasBuffer || hasFile) {
          const storedUrl = `/api/images/file/${cleanStore}/${encodeURIComponent(row.product_id)}${row.variant ? '?v=' + encodeURIComponent(row.variant) : ''}`;
          return {
            store: row.store,
            productId: row.product_id,
            variant: row.variant,
            url: storedUrl,
            source: row.source_name || 'stored',
            size: undefined,
            verifiedAt: ''
          };
        } else if (row.source_url && (row.source_url.startsWith('https://') || row.source_url.startsWith('http://'))) {
          return {
            store: row.store,
            productId: row.product_id,
            variant: row.variant,
            url: row.source_url,
            source: row.source_name || 'verified',
            size: undefined,
            verifiedAt: ''
          };
        }
      }

      // If not stored yet, trigger automatic background caching without blocking the response (skip in test env)
      if (process.env.NODE_ENV !== 'test') {
        setImmediate(async () => {
        try {
          const { imageCacheService } = await import('../images/cache');
          if (product && product.productId) {
            await imageCacheService.cacheProductImage(product);
          } else {
            const { FALLBACK_CATALOG } = await import('../data/fallbackCatalog');
            for (const catObj of Object.values(FALLBACK_CATALOG)) {
              const list = (catObj as any)[cleanStore];
              if (Array.isArray(list)) {
                const found = list.find((p: any) => p.productId === productId || p.productId === decodedPid);
                if (found) {
                  await imageCacheService.cacheProductImage(found);
                  break;
                }
              }
            }
          }
        } catch {}
        });
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Saves verified image record into persistent SQLite images table
   */
  public saveStoredImage(
    store: string,
    productId: string,
    url: string,
    source: string,
    size?: string,
    variant?: string
  ): void {
    try {
      const cleanUrl = (url || '').toLowerCase();
      if (
        cleanUrl.includes('images.unsplash.com') ||
        cleanUrl.includes('shopping?q=tbn:') ||
        cleanUrl.includes('encrypted-tbn')
      ) {
        return;
      }
      dbClient.run(
        `INSERT INTO images (store, product_id, variant, source_url, source_name, content_type, byte_size, sha256, storage_path, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(store, product_id, variant) DO UPDATE SET
           source_url = excluded.source_url,
           source_name = excluded.source_name,
           status = CASE WHEN images.data IS NOT NULL THEN images.status ELSE excluded.status END`,
        [
          store.toLowerCase(),
          productId,
          variant || null,
          url,
          source || 'verified',
          'image/jpeg',
          0,
          '',
          'db',
          'verified',
          new Date().toISOString()
        ]
      );
    } catch (err: any) {
      console.warn('Failed to save verified image to SQLite:', err.message);
    }
  }

  /**
   * Proxies an allow-listed image to bypass hotlink blocking (403 Forbidden)
   */
  public async proxyImage(
    targetUrl: string
  ): Promise<{ data: Buffer; contentType: string; status: number } | { error: string; status: number }> {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:') {
        return { error: 'Only HTTPS URLs are allowed', status: 400 };
      }

      if (!this.isAllowedHost(targetUrl)) {
        return { error: 'Host not permitted in image proxy allow-list', status: 403 };
      }

      const response = await axios.get(targetUrl, {
        responseType: 'arraybuffer',
        timeout: 5000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          Referer: parsed.origin
        }
      });

      const contentType = String(response.headers['content-type'] || 'image/jpeg');
      return {
        data: Buffer.from(response.data),
        contentType,
        status: 200
      };
    } catch (err: any) {
      return {
        error: err.message || 'Image proxy request failed',
        status: err.response?.status || 502
      };
    }
  }
}

export const imageResolverService = new ImageResolverService();
