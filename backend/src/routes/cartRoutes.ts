import { Router, Response } from 'express';
import { cartService } from '../services/cartService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/cart (Requires Auth - returns 401 for guests)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const items = await cartService.getCart(userId);
    return res.json({ items });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart/add (Requires Auth)
router.post('/add', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { product, quantity } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Valid product object is required' });
    }
    // Normalize productId and store
    const normalizedProduct = {
      ...product,
      productId: product.productId || (product as any).id || `prod_${Date.now()}`,
      store: product.store || 'amazon'
    };
    const item = await cartService.addToCart(normalizedProduct, quantity || 1, userId);
    const cart = await cartService.getCart(userId);
    return res.json({ item, cart });
  } catch (error: any) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// POST /api/cart/merge (Requires Auth - merges guest cart session into user account)
router.post('/merge', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.user!.id;
    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      const cart = await cartService.getCart(targetUserId);
      return res.json({ success: true, items: cart });
    }
    const mergedCart = await cartService.mergeCart(guestSessionId, targetUserId);
    return res.json({ success: true, items: mergedCart });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to merge guest cart' });
  }
});

// DELETE /api/cart/:id (Requires Auth)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await cartService.removeFromCart(id as string, userId);
    const cart = await cartService.getCart(userId);
    return res.json({ success: true, cart });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete item from cart' });
  }
});

// POST /api/cart/verify-prices (Requires Auth)
router.post('/verify-prices', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const verification = await cartService.verifyLivePrices(userId);
    return res.json(verification);
  } catch (error: any) {
    return res.status(500).json({ error: 'Price verification failed' });
  }
});

// DELETE /api/cart (Requires Auth)
router.delete('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await cartService.clearCart(userId);
    return res.json({ success: true, items: [] });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
