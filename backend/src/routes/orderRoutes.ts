import { Router, Response } from 'express';
import { orderTrackerService } from '../services/orderTrackerService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/orders - Get user orders with filtering, search, pagination, sorting
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, store, dateRange, search, sort, page, limit } = req.query;

    const result = await orderTrackerService.getOrdersFiltered(userId, {
      status: status ? String(status) : undefined,
      store: store ? String(store) : undefined,
      dateRange: dateRange ? String(dateRange) : undefined,
      search: search ? String(search) : undefined,
      sort: sort === 'oldest' ? 'oldest' : 'newest',
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 10
    });

    return res.json({
      success: true,
      orders: result.orders,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
});

// GET /api/orders/user/me - Protected alias
router.get('/user/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orders = await orderTrackerService.getOrders(userId);
    return res.json({ user: req.user, orders, total: orders.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// GET /api/orders/:id - Get single order details with ownership verification
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = String(rawId);

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID parameter is required' });
    }

    const order = await orderTrackerService.getOrderById(orderId, userId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'The requested order does not exist or does not belong to your account.'
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error: any) {
    console.error('Failed to fetch order details:', error);
    return res.status(500).json({ error: 'Failed to fetch order details', details: error.message });
  }
});

// POST /api/orders/:id/cancel - Cancel order before dispatch
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = String(rawId);
    const { reason } = req.body;

    const order = await orderTrackerService.cancelOrder(orderId, userId, reason || 'Cancelled by customer');

    return res.json({
      success: true,
      message: 'Order cancelled successfully. Refund initiated to original payment method (Demo).',
      order
    });
  } catch (error: any) {
    console.warn('Order cancellation error:', error.message);
    return res.status(400).json({
      error: error.message || 'Failed to cancel order'
    });
  }
});

// POST /api/orders/:id/reorder - Reorder items by adding them to the cart
router.post('/:id/reorder', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = String(rawId);

    const result = await orderTrackerService.reorderOrder(orderId, userId);

    return res.json({
      success: true,
      message: `Added ${result.itemsAdded} item(s) from this order back to your basket!`,
      cart: result.cart,
      itemsAdded: result.itemsAdded
    });
  } catch (error: any) {
    console.error('Reorder error:', error);
    return res.status(400).json({
      error: error.message || 'Failed to reorder items'
    });
  }
});

// GET /api/orders/:id/receipt - Generate printable invoice HTML
router.get('/:id/receipt', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = String(rawId);

    const order = await orderTrackerService.getOrderById(orderId, userId);

    if (!order) {
      return res.status(404).send('<h2>Order not found</h2>');
    }

    const itemsHtml = (order.orderItems || order.items || [])
      .map(
        (item: any) => {
          const itemTitle = item.title || item.product?.title || 'Product';
          const itemStore = item.store || item.product?.store || order.store;
          const itemSeller = item.seller || item.product?.seller || 'VoiceCart Verified';
          const itemPrice = Number(item.price || item.product?.price || 0);
          const itemQty = Number(item.quantity || 1);
          return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600; color: #0f172a;">${itemTitle}</div>
            <div style="font-size: 12px; color: #64748b;">Store: ${String(itemStore).toUpperCase()} • Seller: ${itemSeller}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${itemQty}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">₹${(itemPrice * itemQty).toLocaleString()}</td>
        </tr>
      `;
        }
      )
      .join('');

    const formattedDate = new Date(order.paidAt || order.orderedAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const addr = order.deliveryAddress;
    const addrHtml = addr
      ? `${addr.fullName}<br/>${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br/>${addr.city}, ${addr.state} - ${addr.pincode}<br/>Phone: ${addr.phone}`
      : 'Standard Registered Customer Address';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.orderId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
          .receipt-card { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 36px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px; }
          .brand { font-size: 24px; font-weight: 800; color: #6366f1; }
          .badge { background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; background: #f8fafc; padding: 16px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px dashed #cbd5e1; font-size: 18px; font-weight: 800; }
          @media print { .no-print { display: none; } body { padding: 0; } .receipt-card { border: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <div>
              <div class="brand">🎙️ VoiceCart</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Smart Multi-Store Shopping Assistant</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">TAX INVOICE / RECEIPT</span>
              <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Order: <strong>#${order.orderId}</strong></div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div style="font-weight: 700; color: #64748b; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">Billed / Delivered To:</div>
              <div style="color: #0f172a; line-height: 1.4;">${addrHtml}</div>
            </div>
            <div>
              <div style="font-weight: 700; color: #64748b; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">Payment Details:</div>
              <div style="color: #0f172a; line-height: 1.4;">
                Method: <strong>${order.paymentDetails?.method || order.paymentMethod || 'Instant Payment'}</strong><br/>
                Status: <strong style="color: #16a34a;">${order.paymentDetails?.status || 'PAID'}</strong><br/>
                Ref ID: <code>${order.paymentDetails?.paymentId || order.paymentId || 'N/A'}</code><br/>
                Date: ${formattedDate}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-left: auto; max-width: 280px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
              <span>Subtotal:</span>
              <span>₹${order.totalAmount.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #10b981; font-weight: 600; margin-bottom: 6px;">
              <span>Delivery Fee:</span>
              <span>FREE</span>
            </div>
            <div class="total-row">
              <span>Total Paid:</span>
              <span style="color: #6366f1;">₹${order.totalAmount.toLocaleString()}.00</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            VoiceCart Official Order Confirmation & Tax Receipt • Computer Generated Invoice
          </div>

          <div class="no-print" style="margin-top: 24px; text-align: center;">
            <button onclick="window.print()" style="background: #6366f1; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px;">
              🖨️ Print / Save as PDF
            </button>
          </div>
        </div>
      </body>
      </html>
    `;

    return res.send(html);
  } catch (error: any) {
    return res.status(500).send('<h2>Failed to generate receipt</h2>');
  }
});

// POST /api/orders/external & POST /api/orders/add - Add Real Store Order
const handleAddExternal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { store, orderId, productTitle, productImage, totalAmount } = req.body;
    if (!store || !orderId) {
      return res.status(400).json({ error: 'store and orderId are required' });
    }

    const order = await orderTrackerService.trackAndSaveOrder(
      {
        store,
        orderId: String(orderId).trim(),
        productTitle,
        productImage,
        totalAmount: totalAmount ? parseFloat(totalAmount) : 1499
      },
      userId
    );

    return res.json({ success: true, order });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add external order' });
  }
};

router.post('/external', requireAuth, handleAddExternal);
router.post('/add', requireAuth, handleAddExternal);

// POST /api/orders/parse-message (Requires Auth)
router.post('/parse-message', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text field is required' });
    }

    const parsed = orderTrackerService.parseOrderText(text);
    if (!parsed) {
      return res.status(404).json({
        error: 'Could not extract an Amazon, Flipkart, or Meesho Order ID from the text provided.'
      });
    }

    const order = await orderTrackerService.trackAndSaveOrder(
      {
        store: parsed.store,
        orderId: parsed.orderId,
        productTitle: `${parsed.store.toUpperCase()} Item (${parsed.orderId})`,
        totalAmount: parsed.amount
      },
      userId
    );

    return res.json({ success: true, parsed, order });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to parse order message' });
  }
});

export default router;
