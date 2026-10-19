import { Router, Request, Response } from 'express';
import { catalogDb } from '../catalog/catalogDb';
import { catalogIngestService } from '../catalog/catalogIngestService';
import { aggregatorService } from '../providers/aggregatorService';
import { productDetailService } from '../services/productDetailService';
import { StoreName } from '../types/product';
import { config } from '../config';
import axios from 'axios';

const router = Router();

// GET /api/catalog/browse?category=mobiles&subCategory=5g_phones&store=amazon&page=1&limit=24&sort=relevance
router.get('/browse', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const store = req.query.store as string | undefined;
    const brand = req.query.brand as string | undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const minDiscount = req.query.minDiscount ? parseFloat(req.query.minDiscount as string) : undefined;
    const sort = (req.query.sort as any) || 'relevance';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 24;

    const result = await catalogDb.queryCatalog({
      category,
      subCategory,
      store,
      brand,
      minPrice,
      maxPrice,
      minRating,
      minDiscount,
      sort,
      page,
      limit
    });

    return res.json({
      success: true,
      ...result,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Catalog browse error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/search?q=earbuds&category=audio&page=1&limit=24
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q || req.query.query) as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const category = req.query.category as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const store = req.query.store as string | undefined;
    const brand = req.query.brand as string | undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
    const minDiscount = req.query.minDiscount ? parseFloat(req.query.minDiscount as string) : undefined;
    const sort = (req.query.sort as any) || 'relevance';
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 24;

    // 1. Instant local catalog response
    const localResult = await catalogDb.queryCatalog({
      query,
      category,
      subCategory,
      store,
      brand,
      minPrice,
      maxPrice,
      minRating,
      minDiscount,
      sort,
      page,
      limit
    });

    // 2. Trigger asynchronous background refresh to enrich catalog without slowing down response
    setImmediate(async () => {
      try {
        const liveRes = await aggregatorService.searchAllStores(query, {
          maxBudget: maxPrice,
          minBudget: minPrice,
          brand
        });
        if (liveRes && Array.isArray(liveRes.products)) {
          for (const prod of liveRes.products) {
            await catalogDb.upsertProduct({
              ...prod,
              category: category || prod.category,
              subCategory: subCategory || prod.subCategory
            });
          }
        }
      } catch (err: any) {
        // Silently log background refresh errors
      }
    });

    return res.json({
      success: true,
      ...localResult,
      servedFromCatalog: true,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Catalog search error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/top-deals?category=mobiles&limit=12
router.get('/top-deals', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const deals = await catalogDb.getTopDeals(category, limit);
    return res.json({ success: true, deals });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/brands?category=mobiles
router.get('/brands', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const brands = await catalogDb.getBrands(category);
    return res.json({ success: true, brands });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/filters?category=mobiles
router.get('/filters', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const filters = await catalogDb.getFacetedFilters(category, subCategory);
    return res.json({ success: true, filters });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/product/:store/:productId
router.get('/product/:store/:productId', async (req: Request, res: Response) => {
  try {
    const store = String(req.params.store);
    const productId = String(req.params.productId);
    let product = await catalogDb.getProduct(store, productId);

    if (!product) {
      // Try to fetch live details from productDetailService
      try {
        const detailsRes = await productDetailService.getProductDetails(store as StoreName, productId);
        if (detailsRes?.product) {
          product = detailsRes.product;
          await catalogDb.upsertProduct(product);
        }
      } catch {}
    }

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // If matchGroupId exists, find all matching cross-store offers
    let crossStoreOffers: any[] = [];
    if (product.matchGroupId) {
      crossStoreOffers = await catalogDb.getProductByMatchGroup(product.matchGroupId);
    }

    return res.json({
      success: true,
      product,
      crossStoreOffers,
      lastUpdated: product.priceUpdatedAt || product.fetchedAt || new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/catalog/product/:store/:productId/refresh
router.post('/product/:store/:productId/refresh', async (req: Request, res: Response) => {
  try {
    const store = String(req.params.store);
    const productId = String(req.params.productId);
    const detailsRes = await productDetailService.getProductDetails(store as StoreName, productId);
    if (detailsRes?.product) {
      await catalogDb.upsertProduct(detailsRes.product);
      const refreshed = await catalogDb.getProduct(store, productId);
      return res.json({ success: true, product: refreshed });
    }
    return res.json({ success: true, message: 'Existing data preserved' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/catalog/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await catalogDb.getCatalogStatus();

    let serpApiQuota: any = null;
    if (config.serpApiKey) {
      try {
        const acc = await axios.get(`https://serpapi.com/account.json?api_key=${config.serpApiKey}`, { timeout: 3000 });
        serpApiQuota = {
          plan: acc.data?.plan_name,
          searchesThisMonth: acc.data?.this_month_usage,
          searchesRemaining: acc.data?.plan_searches_left,
          totalSearches: acc.data?.total_searches
        };
      } catch {}
    }

    const lastJob = await catalogDb.getLastCompletedJob('catalog_ingest');

    return res.json({
      success: true,
      status,
      providers: {
        serpApi: { configured: Boolean(config.serpApiKey), quota: serpApiQuota },
        flipkart: { configured: Boolean(config.flipkart.affiliateId) },
        amazon: { configured: Boolean(config.amazon.accessKey) },
        meesho: { configured: Boolean(config.meesho.partnerApiKey) }
      },
      lastJob
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
