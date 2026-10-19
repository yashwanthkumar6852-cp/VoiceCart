import { Router, Request, Response } from 'express';
import { imageCacheService } from '../images/cache';
import { FALLBACK_CATALOG } from '../data/fallbackCatalog';
import { Product } from '../types/product';

const router = Router();

/**
 * GET /api/images/file/:store/:productId (optional ?v=variant)
 * Streams the stored image with Content-Type, Cache-Control, immutable, and ETag.
 * Returns 404 if the image is not stored yet, letting the frontend use its candidate chain.
 */
router.get('/file/:store/:productId', async (req: Request, res: Response) => {
  const store = String(req.params.store || '').toLowerCase();
  const productId = String(req.params.productId || '');
  const variant = req.query.v ? String(req.query.v) : undefined;

  if (!store || !productId) {
    return res.status(400).json({ error: 'Store and productId are required' });
  }

  // 1. Try to get binary from cache
  const stored = imageCacheService.getStoredImageFile(store, productId, variant);

  if (stored) {
    const etag = `"${stored.sha256}"`;
    const clientEtag = req.headers['if-none-match'];

    if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
      return res.status(304).end();
    }

    res.setHeader('Content-Type', stored.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('Content-Length', stored.buffer.length);

    return res.status(200).send(stored.buffer);
  }

  // 2. Fallback: Lookup in database or fallback catalog to redirect to working CDN image
  try {
    const { dbClient } = await import('../db/dbClient');
    const row = dbClient.get(
      'SELECT source_url, content_type FROM images WHERE store = ? AND (product_id = ? OR product_id = ?) AND source_url IS NOT NULL AND source_url != "" LIMIT 1',
      [store, productId, decodeURIComponent(productId)]
    );

    let targetUrl = row?.source_url;

    if (!targetUrl) {
      for (const catObj of Object.values(FALLBACK_CATALOG)) {
        const storeList = (catObj as any)[store];
        if (Array.isArray(storeList)) {
          const found = storeList.find(
            (p: any) => p.productId === productId || p.productId === decodeURIComponent(productId)
          );
          if (found && found.imageUrl) {
            targetUrl = found.imageUrl;
            // Queue background caching
            setImmediate(() => {
              imageCacheService.cacheProductImage(found).catch(() => {});
            });
            break;
          }
        }
      }
    }

    if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(302, targetUrl);
    }
  } catch {}

  // 3. Fallback placeholder SVG if absolutely nothing found (status 200 so browser never reports red 404)
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#f8fafc"/>
    <circle cx="150" cy="140" r="36" fill="#cbd5e1"/>
    <text x="150" y="200" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="13" font-weight="500" fill="#64748b">VoiceCart Product</text>
  </svg>`;
  return res.status(200).send(Buffer.from(svgPlaceholder, 'utf-8'));
});

/**
 * GET /api/images/status
 * Returns totals (stored, missing, suspicious) per category and overall storage metrics.
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    // Collect all products by category from FALLBACK_CATALOG
    const categoryCatalog: Record<string, Product[]> = {};

    for (const [catName, storesObj] of Object.entries(FALLBACK_CATALOG)) {
      const items: Product[] = [];
      for (const prodList of Object.values(storesObj)) {
        if (Array.isArray(prodList)) {
          items.push(...prodList);
        }
      }
      categoryCatalog[catName] = items;
    }

    const status = imageCacheService.getStatus(categoryCatalog);
    return res.status(200).json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
