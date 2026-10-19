import { Router, Request, Response } from 'express';
import { dashboardFeedService } from '../services/dashboardFeedService';
import { VALID_FEED_CATEGORIES } from '../constants/routes';

const router = Router();

async function handleFeedRequest(req: Request, res: Response) {
  const currentPath = req.originalUrl || req.baseUrl + req.path;
  try {
    const rawCategory = (req.params.category as string) || (req.query.category as string) || 'all';
    const cleanCategory = rawCategory.trim().toLowerCase();

    // Validate category (Return 400 for invalid categories with standard error contract)
    if (cleanCategory && !dashboardFeedService.isValidCategory(cleanCategory)) {
      return res.status(400).json({
        error: 'INVALID_CATEGORY',
        message: `Invalid category: "${rawCategory}". Supported categories: ${VALID_FEED_CATEGORIES.join(', ')}`,
        path: currentPath,
        validCategories: VALID_FEED_CATEGORIES,
        status: 'error'
      });
    }

    const store = (req.query.store as string) || undefined;
    const refresh = req.query.refresh === 'true';

    const feed = await dashboardFeedService.getFeed(cleanCategory, store, refresh);
    return res.status(200).json(feed);
  } catch (error: any) {
    console.error(`Feed route error on ${currentPath}:`, error);
    if (error.message?.startsWith('Invalid category')) {
      return res.status(400).json({
        error: 'INVALID_CATEGORY',
        message: error.message,
        path: currentPath,
        validCategories: VALID_FEED_CATEGORIES,
        status: 'error'
      });
    }
    return res.status(500).json({
      error: 'FEED_FETCH_ERROR',
      message: 'Failed to retrieve product feed. Please retry in a moment.',
      details: error.message,
      path: currentPath,
      status: 'unavailable'
    });
  }
}

// Primary route: GET /api/feed?category=<id>&store=<store>&refresh=<bool>
router.get('/', handleFeedRequest);

// Permanent alias: GET /api/feed/:category
router.get('/:category', handleFeedRequest);

export default router;
