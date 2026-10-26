import { Router, Request, Response } from 'express';
import { demoPaymentService } from '../services/demoPaymentService';
import { orderTrackerService } from '../services/orderTrackerService';
import { dbClient } from '../db/dbClient';
import { CartItem, OrderRecord } from '../types/product';
import { config } from '../config';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/payments/config - Public demo gateway configuration
router.get('/config', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    ...demoPaymentService.getConfig()
  });
});

// POST /api/payments/create (Requires Auth)
// Server calculates total amount from cart/basket items and creates demo order
router.post('/create', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items, itemIds, notes, receiptId } = req.body;

    // 1. Fetch current cart from DB or provided items
    let cartItems: CartItem[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      cartItems = items;
    } else {
      cartItems = await dbClient.getCart(userId);
    }

    // If specific itemIds are selected, filter by them
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      cartItems = cartItems.filter((i) => itemIds.includes(i.id));
    }

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items selected or basket is empty.'
      });
    }

    // 2. Amount calculated strictly on server in INR across all basket items
    const calculatedAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.currentPrice || item.product.price) * Number(item.quantity || 1),
      0
    );

    if (calculatedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order amount calculated.'
      });
    }

    // 3. Create local demo order
    const orderReceipt = receiptId || `vc_rcpt_${Date.now()}`;
    const demoOrder = await demoPaymentService.createOrder(calculatedAmount, orderReceipt, notes);

    // 4. Save preliminary OrderRecord in DB
    const internalOrderId = `VC-DEMO-${Date.now().toString().slice(-6)}`;
    const productTitle = cartItems.map((i) => `${i.product.title} (x${i.quantity})`).join(', ');
    const productImage = cartItems[0]?.product.imageUrl || '';
    const mainStore = cartItems.length === 1 ? cartItems[0].product.store : 'voicecart';

    const userAddresses = await dbClient.getAddresses(userId);
    const primaryAddress = userAddresses.find((a) => a.isDefault) || userAddresses[0];

    const deliveryAddress = primaryAddress
      ? {
          fullName: primaryAddress.fullName || 'VoiceCart User',
          phone: primaryAddress.mobile || '+91 98765 43210',
          addressLine1: primaryAddress.houseStreet || 'Flat 402, Green Glen Layout, Bellandur',
          addressLine2: primaryAddress.area || 'Near Outer Ring Road',
          city: primaryAddress.city || 'Bengaluru',
          state: primaryAddress.state || 'Karnataka',
          pincode: primaryAddress.pincode || '560103',
          type: (primaryAddress.addressType === 'work' ? 'Work' : primaryAddress.addressType === 'other' ? 'Other' : 'Home') as 'Home' | 'Work' | 'Other'
        }
      : {
          fullName: 'VoiceCart Verified Customer',
          phone: '+91 98765 43210',
          addressLine1: 'Flat 402, Green Glen Layout, Bellandur',
          addressLine2: 'Outer Ring Road, Near Ecospace Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          type: 'Home' as const
        };

    const newOrder: OrderRecord = {
      id: demoOrder.id,
      orderId: internalOrderId,
      userId,
      store: mainStore,
      productTitle,
      productImage,
      totalAmount: calculatedAmount,
      status: 'CREATED',
      orderedAt: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      trackingUrl: `/orders/${internalOrderId}`,
      storeUrl: `/orders/${internalOrderId}`,
      paymentOrderId: demoOrder.id,
      paymentMode: 'test',
      isDemo: true,
      canCancel: true,
      items: cartItems,
      deliveryAddress,
      deliveryMethod: 'VoiceCart Express Air Delivery (1-2 Days)',
      timeline: [
        {
          stage: 'Ordered',
          description: `Demo Order ${internalOrderId} initialized for ₹${calculatedAmount.toLocaleString()}`,
          timestamp: new Date().toISOString(),
          completed: true,
          current: true
        },
        {
          stage: 'Packed',
          description: 'Package being verified and packed at fulfillment hub',
          timestamp: '',
          completed: false,
          current: false
        },
        {
          stage: 'Shipped',
          description: 'Handed over to Express Courier Simulation',
          timestamp: '',
          completed: false,
          current: false
        },
        {
          stage: 'Out for delivery',
          description: 'Courier agent will deliver with OTP verification',
          timestamp: '',
          completed: false,
          current: false
        },
        {
          stage: 'Delivered',
          description: 'Package delivered at your doorstep',
          timestamp: '',
          completed: false,
          current: false
        }
      ]
    };

    await dbClient.saveOrder(newOrder, userId);

    return res.json({
      success: true,
      order: demoOrder,
      calculatedAmount,
      internalOrderId,
      gateway: 'Demo Gateway (No External API)'
    });
  } catch (error: any) {
    console.error('Demo order creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create demo order',
      details: error.message
    });
  }
});

// POST /api/payments/create-order (alias for backwards compatibility)
router.post('/create-order', async (req: Request, res: Response) => {
  return res.redirect(307, '/api/payments/create');
});

// POST /api/payments/confirm (Requires Auth)
// Confirm and update order status (idempotent)
router.post('/confirm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId, method, demoResult = 'SUCCESS', failureReason, paymentDetails } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required for payment confirmation.'
      });
    }

    // 1. Fetch existing order by ID or orderId with user isolation
    let existingOrder = await dbClient.getOrderById(orderId, userId);
    if (!existingOrder) {
      const allOrders = await dbClient.getOrders(userId);
      existingOrder = allOrders.find((o) => o.paymentOrderId === orderId || o.orderId.toLowerCase() === orderId.toLowerCase() || o.id === orderId) || null;
    }
    if (!existingOrder) {
      existingOrder = await dbClient.getOrderById(orderId);
    }

    if (!existingOrder) {
      // Fallback auto-recovery: create order on the fly from current user cart
      const cartItems = await dbClient.getCart(userId);
      const calculatedAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.currentPrice || item.product.price) * Number(item.quantity || 1),
        0
      );
      const internalOrderId = `VC-DEMO-${Date.now().toString().slice(-6)}`;
      const productTitle = cartItems.length > 0 ? cartItems.map((i) => `${i.product.title} (x${i.quantity})`).join(', ') : 'VoiceCart Items';
      const productImage = cartItems[0]?.product.imageUrl || '';
      const mainStore = cartItems[0]?.product.store || 'voicecart';

      existingOrder = {
        id: orderId,
        orderId: internalOrderId,
        store: mainStore,
        productTitle,
        productImage,
        totalAmount: calculatedAmount || 499,
        status: 'CREATED',
        orderedAt: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        trackingUrl: `/orders?id=${internalOrderId}`,
        storeUrl: `/orders?id=${internalOrderId}`,
        paymentOrderId: orderId,
        paymentMode: 'test',
        items: cartItems,
        timeline: [
          { stage: 'Order Initiated', description: `Order ${orderId}`, timestamp: new Date().toISOString(), completed: true }
        ]
      };
      await dbClient.saveOrder(existingOrder, userId);
    }

    // 2. Pay Before Delivery check for existing COD orders:
    const targetOrder = existingOrder as OrderRecord;
    const isPayingOnlineForCod = Boolean(
      (targetOrder.status === 'COD_PENDING' ||
       (targetOrder.paymentMethod || '').toLowerCase().includes('cod') ||
       targetOrder.paymentDetails?.methodCode === 'cod' ||
       targetOrder.isCodEligibleForPrePayment) &&
      (method || '').toLowerCase() !== 'cod'
    );

    if (isPayingOnlineForCod) {
      const result = await orderTrackerService.processPayBeforeDelivery({
        orderId: targetOrder.orderId || targetOrder.id,
        userId,
        method: method || 'UPI',
        demoResult,
        failureReason,
        paymentDetails
      });
      return res.json({
        success: result.success,
        message: result.message,
        order: result.order,
        status: result.order.status,
        isPaid: result.order.paymentDetails?.status === 'PAID',
        isCodPending: false,
        paymentId: result.paymentId,
        orderId: result.order.orderId,
        paidAt: result.order.paidAt,
        amount: result.order.totalAmount,
        method: result.order.paymentMethod
      });
    }

    // 2b. Idempotency Guard: prevent double payment if already PAID
    if (targetOrder.status === 'PAID' || targetOrder.paidOnlineBeforeDelivery || targetOrder.paymentDetails?.status === 'PAID') {
      return res.json({
        success: true,
        message: 'Order is already marked as PAID.',
        order: targetOrder,
        paymentId: targetOrder.paymentId,
        orderId: targetOrder.orderId,
        status: targetOrder.status,
        isPaid: true,
        isCodPending: false
      });
    }

    if (targetOrder.status === 'COD_PENDING' && (method || '').toLowerCase() === 'cod') {
      return res.json({
        success: true,
        message: 'Order is already placed with Cash on Delivery.',
        order: targetOrder,
        paymentId: targetOrder.paymentId,
        orderId: targetOrder.orderId,
        status: targetOrder.status,
        isPaid: false,
        isCodPending: true
      });
    }

    // 3. Process demo payment confirmation
    const confirmation = await demoPaymentService.processPaymentConfirmation({
      orderId,
      method: method || 'Demo UPI / Card',
      demoResult,
      failureReason,
      paymentDetails
    });

    const nowIso = new Date().toISOString();
    targetOrder.paymentId = confirmation.paymentId;
    targetOrder.paymentMethod = confirmation.method;
    targetOrder.status = (confirmation.status === 'cod_pending' ? 'CONFIRMED' : confirmation.status) as any;
    targetOrder.paidAt = confirmation.status === 'PAID' ? nowIso : undefined;

    if (confirmation.status === 'PAID') {
      targetOrder.paymentStatus = 'PAID';
      targetOrder.paymentDetails = {
        method: confirmation.method,
        methodCode: confirmation.methodCode,
        status: 'PAID',
        paymentId: confirmation.paymentId,
        transactionTime: nowIso,
        signature: confirmation.signature,
        isDemo: true
      };
      if (targetOrder.timeline[1]) {
        targetOrder.timeline[1].completed = true;
        targetOrder.timeline[1].timestamp = nowIso;
        targetOrder.timeline[1].description = `Authorized via ${confirmation.method} (Ref: ${confirmation.paymentId})`;
      }
      if (targetOrder.timeline[2]) {
        targetOrder.timeline[2].completed = true;
        targetOrder.timeline[2].timestamp = nowIso;
      }

      // Clear paid items from user cart
      const currentCart = await dbClient.getCart(userId);
      const paidItemIds = new Set(targetOrder.items?.map((i) => i.id) || []);
      for (const item of currentCart) {
        if (paidItemIds.has(item.id) || paidItemIds.size === 0) {
          await dbClient.removeCartItem(item.id, userId);
        }
      }
    } else if (confirmation.status === 'cod_pending') {
      targetOrder.paymentMethod = 'COD';
      targetOrder.paymentStatus = 'PENDING';
      targetOrder.isCodEligibleForPrePayment = true;
      targetOrder.paymentDetails = {
        method: 'Cash on Delivery (COD)',
        methodCode: 'cod',
        status: 'PENDING',
        paymentId: confirmation.paymentId,
        transactionTime: nowIso,
        paidOnlineBeforeDelivery: false,
        isDemo: true
      };
      if (targetOrder.timeline[1]) {
        targetOrder.timeline[1].completed = true;
        targetOrder.timeline[1].timestamp = nowIso;
        targetOrder.timeline[1].description = 'Order Confirmed with Cash on Delivery (Pay cash on delivery or pay online before delivery)';
      }
      if (targetOrder.timeline[2]) {
        targetOrder.timeline[2].completed = true;
        targetOrder.timeline[2].timestamp = nowIso;
      }

      // Clear placed items from user cart
      const currentCart = await dbClient.getCart(userId);
      const paidItemIds = new Set(targetOrder.items?.map((i) => i.id) || []);
      for (const item of currentCart) {
        if (paidItemIds.has(item.id) || paidItemIds.size === 0) {
          await dbClient.removeCartItem(item.id, userId);
        }
      }
    } else if (confirmation.status === 'FAILED') {
      targetOrder.timeline.push({
        stage: 'Payment Failed',
        description: confirmation.message,
        timestamp: nowIso,
        completed: true
      });
    } else if (confirmation.status === 'PENDING') {
      targetOrder.timeline.push({
        stage: 'Pending Authorization',
        description: confirmation.message,
        timestamp: nowIso,
        completed: false
      });
    }

    const enrichedOrder = orderTrackerService.enrichOrderRecord(targetOrder);
    await dbClient.saveOrder(enrichedOrder, userId);

    console.log(`💳 Demo Payment Processed: Order ${enrichedOrder.orderId}, Status: ${enrichedOrder.status}, Method: ${confirmation.method}`);

    return res.json({
      success: true,
      status: enrichedOrder.status,
      isPaid: enrichedOrder.status === 'PAID',
      isCodPending: enrichedOrder.status === 'COD_PENDING',
      isPending: enrichedOrder.status === 'PENDING_VERIFICATION' || (enrichedOrder.status as any) === 'PENDING',
      isFailed: enrichedOrder.status === 'FAILED',
      order: enrichedOrder,
      paymentId: confirmation.paymentId,
      orderId: enrichedOrder.orderId,
      amount: enrichedOrder.totalAmount,
      paidAt: nowIso,
      method: confirmation.method,
      message: confirmation.message
    });
  } catch (error: any) {
    console.error('Demo payment confirmation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process demo payment confirmation',
      details: error.message
    });
  }
});

// POST /api/payments/verify (alias for backwards compatibility)
router.post('/verify', async (req: Request, res: Response) => {
  return res.redirect(307, '/api/payments/confirm');
});

// GET /api/payments/:orderId/status & /api/payments/status/:orderId - Status Poller
const getStatusHandler = async (req: Request, res: Response) => {
  try {
    const orderId = String(req.params.orderId || '');
    if (!orderId) {
      return res.status(400).json({ error: 'orderId parameter is required' });
    }

    let order = await dbClient.getOrderById(orderId);
    if (!order) {
      const allOrders = await dbClient.getOrders();
      order = allOrders.find((o) => o.paymentOrderId === orderId || o.orderId.toLowerCase() === orderId.toLowerCase()) || null;
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      isPaid: order.status === 'PAID' || order.status === 'ORDERED' || order.status === 'PACKED' || order.status === 'SHIPPED',
      isPending: order.status === 'PENDING_VERIFICATION',
      isFailed: order.status === 'FAILED',
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      paidAt: order.paidAt,
      order
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to poll order status', details: error.message });
  }
};

router.get('/:orderId/status', getStatusHandler);
router.get('/status/:orderId', getStatusHandler);

// POST /api/payments/validate-card - Luhn algorithm card check
router.post('/validate-card', (req: Request, res: Response) => {
  const { cardNumber } = req.body;
  if (!cardNumber) {
    return res.status(400).json({ isValid: false, error: 'cardNumber is required' });
  }
  const isValid = demoPaymentService.validateLuhn(String(cardNumber));
  return res.json({ isValid, cardNumber: String(cardNumber).slice(-4) });
});

// POST /api/payments/refund - Demo Refund simulation
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { orderId, reason, amount } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required for refund' });
    }

    let order = await dbClient.getOrderById(orderId);
    if (!order) {
      const allOrders = await dbClient.getOrders();
      order = allOrders.find((o) => o.paymentOrderId === orderId || o.orderId.toLowerCase() === orderId.toLowerCase()) || null;
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const refundAmountInr = amount ? Number(amount) : order.totalAmount;
    const refundId = `rfnd_DEMO_${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    order.status = 'CANCELLED';
    order.timeline.push({
      stage: 'Refund Processed',
      description: `Refund of ₹${refundAmountInr.toLocaleString()} processed back to original payment method (Demo Refund ID: ${refundId})`,
      timestamp: nowIso,
      completed: true
    });

    await dbClient.saveOrder(order);

    return res.json({
      success: true,
      message: 'Demo refund processed successfully',
      refundId,
      amount: refundAmountInr,
      order
    });
  } catch (err: any) {
    console.error('Demo refund error:', err);
    return res.status(500).json({ error: 'Refund processing failed', details: err.message });
  }
});

// POST /api/payments/pay-before-delivery (Requires Auth)
// Secure, server-verified online payment for eligible COD orders
router.post('/pay-before-delivery', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { orderId, method = 'UPI', demoResult = 'SUCCESS', failureReason, paymentDetails } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required.' });
    }

    const result = await orderTrackerService.processPayBeforeDelivery({
      orderId,
      userId,
      method,
      demoResult,
      failureReason,
      paymentDetails
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Pay Before Delivery error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Payment failed' });
  }
});

// GET /api/payments/orders/:orderId/pay-before-delivery-eligibility (Requires Auth)
router.get('/orders/:orderId/pay-before-delivery-eligibility', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const orderId = String(rawId);

    const order = await orderTrackerService.getOrderById(orderId, userId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or access denied.' });
    }

    const isCod = Boolean(
      (order.paymentMethod || '').toLowerCase().includes('cod') ||
      order.paymentDetails?.methodCode === 'cod' ||
      order.status === 'COD_PENDING'
    );
    const isPaid = Boolean(order.paidOnlineBeforeDelivery || order.paymentDetails?.status === 'PAID');
    const isEligible = isCod && !isPaid && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && order.status !== 'DELIVERED';

    return res.json({
      success: true,
      orderId: order.orderId,
      isEligible,
      isCod,
      isPaid,
      status: order.status,
      paymentStatus: isPaid ? 'PAID' : 'PENDING',
      amountDue: isPaid ? 0 : order.totalAmount,
      totalAmount: order.totalAmount,
      expectedDeliveryDate: order.estimatedDeliveryDate || '2-3 Business Days'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
