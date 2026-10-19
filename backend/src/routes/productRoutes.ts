import { Router, Request, Response } from 'express';
import { productDetailService } from '../services/productDetailService';
import { dashboardFeedService } from '../services/dashboardFeedService';
import { StoreName } from '../types/product';

import { imageResolverService } from '../services/imageResolverService';

const router = Router();

// GET /api/products/image-proxy?url=...
router.get('/image-proxy', async (req: Request, res: Response) => {
  const targetUrl = (req.query.url as string) || '';
  if (!targetUrl.trim()) {
    return res.status(400).json({ error: 'Image url query parameter is required' });
  }

  const result = await imageResolverService.proxyImage(targetUrl.trim());
  if ('error' in result) {
    return res.status(result.status || 502).json({ error: result.error });
  }

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).send(result.data);
});

// GET /api/products/verified-image?store=...&productId=...
router.get('/verified-image', (req: Request, res: Response) => {
  const store = (req.query.store as string) || '';
  const productId = (req.query.productId as string) || '';
  const variant = (req.query.variant as string) || undefined;

  if (!store || !productId) {
    return res.status(400).json({ error: 'store and productId are required' });
  }

  const record = imageResolverService.getStoredImage(store, productId, variant);
  if (!record) {
    return res.status(404).json({ error: 'No verified image found in database' });
  }
  return res.status(200).json(record);
});

// POST /api/products/verified-image
router.post('/verified-image', (req: Request, res: Response) => {
  const { store, productId, url, source, size, variant } = req.body || {};
  if (!store || !productId || !url) {
    return res.status(400).json({ error: 'store, productId, and url are required' });
  }

  const cleanUrl = String(url).trim().toLowerCase();
  // Reject stock fallback or shopping thumbnails
  if (
    cleanUrl.includes('images.unsplash.com') ||
    cleanUrl.includes('shopping?q=tbn:') ||
    cleanUrl.includes('encrypted-tbn')
  ) {
    return res.status(200).json({ success: false, reason: 'generic_fallback_not_persisted' });
  }

  // Reject phone image on non-phone product ID
  const pid = String(productId).toLowerCase();
  const isPhoneId =
    pid.includes('phone') ||
    pid.includes('mobile') ||
    pid.includes('5g') ||
    pid.includes('oppo') ||
    pid.includes('realme') ||
    pid.includes('vivo') ||
    pid.includes('redmi') ||
    pid.includes('poco') ||
    pid.includes('iphone') ||
    pid.includes('galaxy') ||
    pid.includes('oneplus');

  if ((cleanUrl.includes('/mobile/') || cleanUrl.includes('imahkkpg3hbtardn')) && !isPhoneId) {
    return res.status(200).json({ success: false, reason: 'phone_image_mismatch_not_persisted' });
  }

  imageResolverService.saveStoredImage(store, productId, url, source || 'client_verified', size, variant);
  return res.status(200).json({ success: true });
});

// GET /api/products/feed?category=...&store=...&refresh=...
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const rawCategory = (req.query.category as string) || 'all';
    const cleanCategory = rawCategory.trim().toLowerCase();

    if (cleanCategory && !dashboardFeedService.isValidCategory(cleanCategory)) {
      return res.status(400).json({
        error: `Invalid category: "${rawCategory}".`,
        status: 'error'
      });
    }

    const store = (req.query.store as string) || undefined;
    const refresh = req.query.refresh === 'true';

    const feed = await dashboardFeedService.getFeed(cleanCategory, store, refresh);
    return res.status(200).json(feed);
  } catch (error: any) {
    console.error('Dashboard feed error:', error);
    if (error.message?.startsWith('Invalid category')) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to retrieve trending product feed', details: error.message });
  }
});

// GET /api/products/:store/:productId/details?sid=...
router.get('/:store/:productId/details', async (req: Request, res: Response) => {
  try {
    const rawStore = Array.isArray(req.params.store) ? req.params.store[0] : req.params.store;
    const store = (rawStore || 'amazon').toLowerCase() as StoreName;
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const rawSid = req.query.sid || req.query.sessionId;
    const sessionId = (Array.isArray(rawSid) ? rawSid[0] : rawSid) as string | undefined;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const result = await productDetailService.getProductDetails(store, String(productId), sessionId);
    if (!result.product) {
      return res.status(404).json({
        error: `Product ${productId} not found on ${store}`,
        notice: result.notice
      });
    }

    const p = result.product;

    const responsePayload = {
      product: p,
      images: p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []),
      video: (p as any).video || null,
      variants: p.variants || [],
      price: p.price,
      mrp: p.mrp,
      discountPct: p.discountPct,
      saleLabel: p.discountPct >= 20 ? `${p.discountPct}% OFF` : null,
      emi: p.price >= 3000 ? `₹${Math.round(p.price / 6).toLocaleString('en-IN')}/month with No Cost EMI` : null,
      offers: p.offers || [],
      delivery: p.delivery || (p.deliveryDays ? {
        date: p.deliveryDays === 1 ? 'Tomorrow, Free Delivery' : `Delivery in ${p.deliveryDays} Days`,
        charge: p.shippingFee || 0,
        isFree: (p.shippingFee || 0) === 0,
        pincodeCheck: true
      } : null),
      seller: p.seller ? {
        name: p.seller,
        rating: p.sellerInfo?.rating,
        isAssured: p.fulfilledByStore ?? true
      } : null,
      otherSellers: [],
      warranty: p.warranty || null,
      returnPolicy: p.returnPolicy || null,
      highlights: p.highlights || [],
      specifications: p.specifications || {},
      showcaseImages: p.images && p.images.length > 1 ? p.images.slice(1) : [],
      ratingBreakdown: p.ratingBreakdown || null,
      ratingCategories: (p as any).ratingCategories || null,
      reviews: p.reviews || [],
      similarProducts: result.comparison || [],
      quality: p.quality,
      detailsAvailable: result.detailsAvailable,
      notice: result.notice,
      sources: {
        officialApi: p.store,
        verifiedCatalog: true
      },
      fetchedAt: p.fetchedAt || new Date().toISOString()
    };

    return res.json(responsePayload);
  } catch (error: any) {
    console.error('Product details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve product details', details: error.message });
  }
});

export default router;
