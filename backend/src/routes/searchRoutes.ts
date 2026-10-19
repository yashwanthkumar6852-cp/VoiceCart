import { Router, Request, Response } from 'express';
import { aggregatorService } from '../providers/aggregatorService';
import { rankingEngine } from '../ranking/rankingEngine';
import { querySpecExtractor } from '../ranking/querySpecExtractor';
import { searchSessionService } from '../services/searchSessionService';
import { SearchFilters, SearchResponse, StoreName } from '../types/product';

const router = Router();

// GET /api/search?q=earbuds&budget=2000&preference=cheapest&brand=boat&searchId=...&lang=en
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q || req.query.query) as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const searchId = (req.query.searchId as string) || (req.query.requestId as string) || `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const language = ((req.query.lang || req.query.language || 'en') as string).slice(0, 2) as 'en' | 'hi' | 'kn';

    const filters: SearchFilters = {
      maxBudget: req.query.budget ? parseFloat(req.query.budget as string) : undefined,
      minBudget: req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined,
      brand: req.query.brand as string | undefined,
      preference: (req.query.preference as any) || 'balanced',
      stores: req.query.stores ? ((req.query.stores as string).split(',') as StoreName[]) : undefined,
      inStockOnly: req.query.inStockOnly !== 'false',
      requestId: searchId
    };

    // 1. Structured query understanding and Spec extraction (English, Hindi, Kannada)
    const spec = await querySpecExtractor.extractSpec(query, language);

    // Override budget/brand if explicitly provided in query params
    if (filters.maxBudget && !spec.budgetMax) spec.budgetMax = filters.maxBudget;
    if (filters.minBudget && !spec.budgetMin) spec.budgetMin = filters.minBudget;
    if (filters.brand && !spec.brand) spec.brand = filters.brand;
    if (filters.preference) spec.preference = filters.preference;

    // 2. Parallel fetch using clean query & alternatives across Amazon, Flipkart, Meesho
    const { products, storeStatuses, rawCounts, queriesSent } = await aggregatorService.searchAllStores(
      query,
      filters,
      spec
    );

    // 3. Apply relevance filtering, commercial ranking algorithm, and generate debug trace
    const {
      parsedQuery,
      matchType,
      isExactMatch,
      rankedProducts,
      exactMatches,
      alternativeMatches,
      similarProducts,
      topRecommendations,
      comparisonMatrix,
      debugTrace
    } = await rankingEngine.rank(
      products,
      query,
      filters,
      storeStatuses,
      spec,
      rawCounts,
      queriesSent
    );

    // 4. Build single, immutable SearchOutcome driving speech, text, banner, matrix and alternatives
    const outcome = searchSessionService.buildOutcome({
      searchId,
      rawQuery: query,
      language,
      spec,
      products: rankedProducts,
      exactMatches,
      similarAlternatives: similarProducts,
      topRecommendations,
      rawCounts,
      storeStatuses,
      debugTrace
    });

    const session = await searchSessionService.createSession({
      searchId,
      rawQuery: query,
      language,
      spec,
      products: rankedProducts,
      exactMatches,
      similarAlternatives: similarProducts,
      topRecommendations,
      rawCounts,
      storeStatuses,
      debugTrace
    });

    const response: SearchResponse = {
      searchId: session.searchId,
      sessionId: session.sessionId,
      query,
      parsedQuery,
      spec,
      matchType,
      isExactMatch: outcome.status === 'exact_found',
      filters,
      totalResults: rankedProducts.length,
      products: rankedProducts,
      exactMatches,
      alternativeMatches,
      similarProducts,
      recommendation: outcome.bestRecommendation,
      replyText: outcome.writtenReply,
      spokenText: outcome.spokenReply,
      topRecommendations,
      comparisonMatrix: outcome.comparisonMatrix,
      storeStatuses,
      outcome,
      debugTrace,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Search route error:', error);
    return res.status(500).json({ error: 'Search processing failed', details: error.message });
  }
});

// GET /api/search/product/:store/:productId - Retrieve full normalized product details with cross-store comparison
router.get('/product/:store/:productId', async (req: Request, res: Response) => {
  try {
    const rawStore = Array.isArray(req.params.store) ? req.params.store[0] : req.params.store;
    const rawProductId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const { productDetailService } = await import('../services/productDetailService');
    const result = await productDetailService.getProductDetails((rawStore || 'amazon') as StoreName, String(rawProductId));

    if (!result.product) {
      return res.status(404).json({ error: `Product not found on ${rawStore || 'store'}` });
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Product details route error:', error);
    return res.status(500).json({ error: 'Failed to retrieve product details', details: error.message });
  }
});

// GET /api/search/status - Provider connection statuses
router.get('/status', async (req: Request, res: Response) => {
  try {
    const statuses = await aggregatorService.getStoreStatuses();
    return res.json({ storeStatuses: statuses });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve store statuses' });
  }
});

export default router;
