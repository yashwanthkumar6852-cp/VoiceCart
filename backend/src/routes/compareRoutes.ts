import { Router, Request, Response } from 'express';
import { compareService } from '../services/compareService';
import { StoreName } from '../types/product';

const router = Router();

// GET /api/compare/specs?productKey=...&store=...&productId=...&q=...
router.get('/specs', async (req: Request, res: Response) => {
  try {
    const productKey = req.query.productKey as string | undefined;
    const store = req.query.store as StoreName | undefined;
    const productId = req.query.productId as string | undefined;
    const sessionId = (req.query.sessionId || req.query.sid) as string | undefined;
    const query = (req.query.q || req.query.query) as string | undefined;

    const result = await compareService.compareSpecs({
      productKey,
      store,
      productId,
      sessionId,
      query
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Compare specs error:', error);
    return res.status(500).json({ error: 'Failed to generate cross-store spec comparison', details: error.message });
  }
});

// GET /api/compare/specs/:productKey
router.get('/specs/:productKey', async (req: Request, res: Response) => {
  try {
    const rawProductKey = Array.isArray(req.params.productKey) ? req.params.productKey[0] : req.params.productKey;
    const productKey = String(rawProductKey);
    const result = await compareService.compareSpecs({ productKey });
    return res.json(result);
  } catch (error: any) {
    console.error('Compare specs by key error:', error);
    return res.status(500).json({ error: 'Failed to generate spec comparison', details: error.message });
  }
});

export default router;
