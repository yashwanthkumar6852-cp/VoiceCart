import { v4 as uuidv4 } from 'uuid';
import { dbClient } from '../db/dbClient';
import { demoPaymentService } from './demoPaymentService';
import {
  OrderRecord,
  StoreName,
  OrderStatus,
  OrderItem,
  OrderPriceBreakdown,
  OrderPaymentDetails,
  OrderTimelineStep,
  OrderActivityLogEntry,
  OrderPriceComparisonSummary,
  CartItem
} from '../types/product';

export interface OrderFilterOptions {
  status?: string; // 'all' | 'in_progress' | 'delivered' | 'cancelled' | OrderStatus
  store?: string; // 'all' | 'amazon' | 'flipkart' | 'meesho' | 'voicecart'
  dateRange?: string; // '30d' | '6m' | '2026' | '2025' | 'all'
  search?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export class OrderTrackerService {
  /**
   * Advances demo orders dynamically based on elapsed time since `orderedAt`
   */
  public advanceDemoTimeline(order: OrderRecord): OrderRecord {
    // If order is cancelled, failed, delivered, or a real external store order, do not simulate timeline
    if (order.status === 'CANCELLED' || order.status === 'FAILED' || order.status === 'DELIVERED' || order.isExternal) {
      if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
        order.canCancel = false;
      }
      return order;
    }

    const orderTime = new Date(order.orderedAt).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.max(0, (now - orderTime) / (1000 * 60));

    // Demo advancement rule:
    // 0 - 2 mins: Ordered (Placed)
    // 2 - 8 mins: Packed
    // 8 - 25 mins: Shipped
    // 25 - 60 mins: Out for delivery
    // 60+ mins: Delivered

    let dynamicStatus: OrderStatus = order.status;
    if (['CREATED', 'PAID', 'PLACED', 'ORDERED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COD_PENDING'].includes(order.status)) {
      if (order.status === 'COD_PENDING') {
        dynamicStatus = 'COD_PENDING';
      } else if (elapsedMinutes >= 60) {
        dynamicStatus = 'DELIVERED';
      } else if (elapsedMinutes >= 25) {
        dynamicStatus = 'OUT_FOR_DELIVERY';
      } else if (elapsedMinutes >= 8) {
        dynamicStatus = 'SHIPPED';
      } else if (elapsedMinutes >= 2) {
        dynamicStatus = 'PACKED';
      } else {
        dynamicStatus = 'PLACED';
      }
    }

    order.status = dynamicStatus;
    order.canCancel = (dynamicStatus === 'PLACED' || dynamicStatus === 'PACKED' || dynamicStatus === 'CREATED' || dynamicStatus === 'PAID' || dynamicStatus === 'COD_PENDING');

    const t0 = new Date(orderTime).toISOString();
    const tPacked = new Date(orderTime + 2 * 60 * 1000).toISOString();
    const tShipped = new Date(orderTime + 8 * 60 * 1000).toISOString();
    const tOut = new Date(orderTime + 25 * 60 * 1000).toISOString();
    const tDelivered = new Date(orderTime + 60 * 60 * 1000).toISOString();

    const timeline: OrderTimelineStep[] = [
      {
        stage: 'Ordered',
        description: `Order placed and payment authorized (${order.paymentMethod || 'Instant Checkout'})`,
        timestamp: t0,
        completed: true,
        current: dynamicStatus === 'PLACED' || dynamicStatus === 'CREATED' || dynamicStatus === 'PAID' || dynamicStatus === 'COD_PENDING'
      },
      {
        stage: 'Packed',
        description: 'Items securely packed and labeled at VoiceCart fulfillment center',
        timestamp: elapsedMinutes >= 2 ? tPacked : '',
        completed: elapsedMinutes >= 2,
        current: dynamicStatus === 'PACKED'
      },
      {
        stage: 'Shipped',
        description: 'Package handed over to BlueDart Express simulation courier',
        timestamp: elapsedMinutes >= 8 ? tShipped : '',
        completed: elapsedMinutes >= 8,
        current: dynamicStatus === 'SHIPPED'
      },
      {
        stage: 'Out for delivery',
        description: 'Courier delivery executive out for doorstep delivery',
        timestamp: elapsedMinutes >= 25 ? tOut : '',
        completed: elapsedMinutes >= 25,
        current: dynamicStatus === 'OUT_FOR_DELIVERY'
      },
      {
        stage: 'Delivered',
        description: 'Delivered to recipient with digital signature confirmation',
        timestamp: elapsedMinutes >= 60 ? tDelivered : '',
        completed: elapsedMinutes >= 60,
        current: dynamicStatus === 'DELIVERED'
      }
    ];

    order.timeline = timeline;

    if (dynamicStatus === 'DELIVERED' && !order.deliveredAt) {
      order.deliveredAt = tDelivered;
    }

    return order;
  }

  /**
   * Normalizes and ensures all rich fields exist on an OrderRecord
   */
  public enrichOrderRecord(order: OrderRecord): OrderRecord {
    // 1. Advance demo timeline
    this.advanceDemoTimeline(order);

    // 2. Normalize items to OrderItem[]
    const rawItems: any[] = order.orderItems || order.items || [];
    const normalizedItems: OrderItem[] = rawItems.map((item, idx) => {
      const prod = item.product || item;
      const mrp = Number(prod.mrp || prod.price || 1499);
      const price = Number(item.currentPrice || prod.price || 999);
      const discountPct = prod.discountPct || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

      return {
        id: item.id || `item_${idx}_${Date.now()}`,
        productId: prod.productId || `PROD_${idx}`,
        title: prod.title || order.productTitle || 'VoiceCart Product',
        brand: prod.brand || (prod.title ? prod.title.split(' ')[0] : 'VoiceCart'),
        variant: prod.variant || {
          color: 'Standard Black',
          size: 'Standard'
        },
        imageUrl: prod.imageUrl || order.productImage || '',
        price,
        mrp,
        discountPct,
        quantity: Number(item.quantity || 1),
        store: prod.store || order.store || 'amazon',
        seller: prod.seller || (order.store === 'amazon' ? 'Appario Retail' : order.store === 'flipkart' ? 'RetailNet' : 'VoiceCart Direct'),
        returnPolicy: prod.returnPolicy || '7 Days Replacement / Return Guarantee',
        productUrl: prod.productUrl || order.storeUrl,
        affiliateUrl: prod.affiliateUrl || prod.productUrl || order.storeUrl,
        inStock: prod.inStock !== false
      };
    });

    if (normalizedItems.length === 0) {
      // Create a single default normalized item from productTitle
      const price = order.totalAmount || 999;
      const mrp = Math.round(price * 1.3);
      normalizedItems.push({
        id: `item_0_${order.id}`,
        productId: order.id,
        title: order.productTitle || `${order.store.toUpperCase()} Item (#${order.orderId})`,
        brand: order.store.toUpperCase(),
        variant: { color: 'Default' },
        imageUrl: order.productImage || '',
        price,
        mrp,
        discountPct: Math.round(((mrp - price) / mrp) * 100),
        quantity: 1,
        store: order.store,
        seller: `${order.store.toUpperCase()} Certified Merchant`,
        returnPolicy: '7 Days Return / Replacement Policy',
        productUrl: order.storeUrl,
        affiliateUrl: order.storeUrl,
        inStock: true
      });
    }

    order.orderItems = normalizedItems;
    order.items = normalizedItems;

    // 3. Price Breakdown
    const itemsTotal = normalizedItems.reduce((s, i) => s + i.mrp * i.quantity, 0);
    const calculatedPayable = normalizedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountSavings = Math.max(0, itemsTotal - calculatedPayable);

    order.priceBreakdown = order.priceBreakdown || {
      itemsTotal: itemsTotal > 0 ? itemsTotal : order.totalAmount,
      discountSavings,
      deliveryCharges: 0,
      codFee: order.paymentMethod?.toLowerCase().includes('cod') ? 0 : 0,
      taxes: 0,
      grandTotal: order.totalAmount || calculatedPayable
    };

    // 4. Payment Details
    const isPaidOnline = Boolean(
      order.paidOnlineBeforeDelivery ||
      order.paymentDetails?.paidOnlineBeforeDelivery ||
      (order.paidAt && order.paymentMethod?.toLowerCase() !== 'cod' && order.paymentDetails?.status === 'PAID')
    );
    const isCod = !isPaidOnline && Boolean(
      (order.paymentMethod || '').toLowerCase().includes('cod') ||
      (order.paymentMethod || '').toLowerCase().includes('cash') ||
      order.status === 'COD_PENDING' ||
      order.paymentDetails?.methodCode === 'cod'
    );
    const isCard = (order.paymentMethod || '').toLowerCase().includes('card');

    if (!order.paymentDetails) {
      order.paymentDetails = {
        method: isPaidOnline ? (order.paymentMethod || 'Paid Online') : isCod ? 'Cash on Delivery (COD)' : (order.paymentMethod || 'Instant Gateway'),
        methodCode: isCod ? 'cod' : isCard ? 'card' : 'upi',
        status: order.status === 'CANCELLED' ? 'REFUND_INITIATED' : isPaidOnline ? 'PAID' : isCod ? 'PENDING' : 'PAID',
        paymentId: order.paymentId || (isPaidOnline ? `pay_${Date.now().toString().slice(-6)}` : undefined),
        transactionTime: order.paidAt || order.orderedAt,
        cardBrand: isCard ? 'Visa' : undefined,
        cardLast4: isCard ? '4242' : undefined,
        isDemo: order.isExternal ? false : true,
        paidOnlineBeforeDelivery: isPaidOnline
      };
    } else {
      if (isPaidOnline) {
        order.paymentDetails.status = 'PAID';
        order.paymentDetails.paidOnlineBeforeDelivery = true;
      }
    }

    order.paymentStatus = order.paymentDetails.status;
    order.paidOnlineBeforeDelivery = isPaidOnline;
    order.isCodEligibleForPrePayment = Boolean(
      isCod &&
      order.paymentDetails.status !== 'PAID' &&
      !order.paidOnlineBeforeDelivery &&
      order.status !== 'CANCELLED' &&
      order.status !== 'REFUNDED' &&
      order.status !== 'DELIVERED'
    );

    // 5. Delivery Address Snapshot
    if (!order.deliveryAddress) {
      order.deliveryAddress = {
        fullName: 'Yashwanth Kumar',
        phone: '+91 98765 43210',
        addressLine1: 'Flat 402, Green Glen Layout, Bellandur',
        addressLine2: 'Outer Ring Road, Near Ecospace Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
        type: 'Home'
      };
    }

    order.deliveryMethod = order.deliveryMethod || (order.isExternal ? `${order.store.toUpperCase()} Standard Delivery` : 'VoiceCart Express Air Delivery (1-2 Days)');

    // 6. Price Comparison Summary
    if (!order.priceComparisonSummary) {
      const chosenPrice = order.totalAmount;
      const amazonPrice = order.store === 'amazon' ? chosenPrice : Math.round(chosenPrice * 1.12);
      const flipkartPrice = order.store === 'flipkart' ? chosenPrice : Math.round(chosenPrice * 1.08);
      const meeshoPrice = order.store === 'meesho' ? chosenPrice : Math.round(chosenPrice * 1.04);
      const highestPrice = Math.max(amazonPrice, flipkartPrice, meeshoPrice, Math.round(chosenPrice * 1.15));

      order.priceComparisonSummary = {
        storesCompared: [
          { store: 'amazon', price: amazonPrice, isChosen: order.store === 'amazon', deliveryDays: 1 },
          { store: 'flipkart', price: flipkartPrice, isChosen: order.store === 'flipkart', deliveryDays: 2 },
          { store: 'meesho', price: meeshoPrice, isChosen: order.store === 'meesho', deliveryDays: 4 }
        ],
        chosenStore: order.store,
        savingsVsHighest: Math.max(0, highestPrice - chosenPrice),
        highestPrice,
        lowestPrice: chosenPrice
      };
    }

    // 7. Activity Log
    if (!order.activityLog || order.activityLog.length === 0) {
      const log: OrderActivityLogEntry[] = [
        {
          id: `act_${order.id}_1`,
          title: 'Order Created',
          description: `Order #${order.orderId} initialized via VoiceCart Assistant`,
          timestamp: order.orderedAt,
          type: 'created'
        },
        {
          id: `act_${order.id}_2`,
          title: 'Payment Verified',
          description: `Payment authorized via ${order.paymentDetails.method} (Ref: ${order.paymentDetails.paymentId})`,
          timestamp: order.paidAt || order.orderedAt,
          type: 'payment'
        }
      ];

      if (order.status === 'PACKED' || order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
        log.push({
          id: `act_${order.id}_3`,
          title: 'Package Packed',
          description: 'Fulfillment center completed quality check & bubble packaging',
          timestamp: new Date(new Date(order.orderedAt).getTime() + 2 * 60 * 1000).toISOString(),
          type: 'status_change'
        });
      }

      if (order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
        log.push({
          id: `act_${order.id}_4`,
          title: 'Dispatched with Carrier',
          description: 'Package in transit via Express Logistics Courier',
          timestamp: new Date(new Date(order.orderedAt).getTime() + 8 * 60 * 1000).toISOString(),
          type: 'status_change'
        });
      }

      if (order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
        log.push({
          id: `act_${order.id}_5`,
          title: 'Out for Delivery',
          description: 'Courier agent en route for doorstep OTP verification',
          timestamp: new Date(new Date(order.orderedAt).getTime() + 25 * 60 * 1000).toISOString(),
          type: 'status_change'
        });
      }

      if (order.status === 'DELIVERED') {
        log.push({
          id: `act_${order.id}_6`,
          title: 'Order Delivered',
          description: 'Package successfully delivered at customer address',
          timestamp: order.deliveredAt || new Date(new Date(order.orderedAt).getTime() + 60 * 60 * 1000).toISOString(),
          type: 'status_change'
        });
      }

      if (order.status === 'CANCELLED') {
        log.push({
          id: `act_${order.id}_cancel`,
          title: 'Order Cancelled',
          description: order.cancellationReason ? `Reason: ${order.cancellationReason}` : 'Cancelled by customer',
          timestamp: order.cancelledAt || new Date().toISOString(),
          type: 'cancellation'
        });
        log.push({
          id: `act_${order.id}_refund`,
          title: 'Demo Refund Initiated',
          description: `Simulated refund of ₹${order.totalAmount.toLocaleString()} credited to source payment method`,
          timestamp: order.cancelledAt || new Date().toISOString(),
          type: 'refund'
        });
      }

      order.activityLog = log;
    }

    return order;
  }

  /**
   * Get orders list with search, status tabs, store filter, date range filter, and pagination
   */
  public async getOrdersFiltered(
    userId: string,
    options: OrderFilterOptions = {}
  ): Promise<{
    orders: OrderRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const allRaw = await dbClient.getOrders(userId);
    let enriched = allRaw.map((o) => this.enrichOrderRecord(o));

    // 1. Status Filter
    if (options.status && options.status !== 'all') {
      const s = options.status.toLowerCase();
      if (s === 'in_progress') {
        enriched = enriched.filter((o) => ['PLACED', 'CREATED', 'PAID', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'PENDING_VERIFICATION', 'COD_PENDING'].includes(o.status));
      } else if (s === 'delivered') {
        enriched = enriched.filter((o) => o.status === 'DELIVERED');
      } else if (s === 'cancelled') {
        enriched = enriched.filter((o) => o.status === 'CANCELLED');
      } else {
        enriched = enriched.filter((o) => o.status.toLowerCase() === s);
      }
    }

    // 2. Store Filter
    if (options.store && options.store !== 'all') {
      const st = options.store.toLowerCase();
      enriched = enriched.filter((o) => o.store.toLowerCase() === st);
    }

    // 3. Date Range Filter
    if (options.dateRange && options.dateRange !== 'all') {
      const now = Date.now();
      const dr = options.dateRange.toLowerCase();

      enriched = enriched.filter((o) => {
        const orderTime = new Date(o.orderedAt).getTime();
        if (dr === '30d') {
          return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
        } else if (dr === '6m') {
          return now - orderTime <= 180 * 24 * 60 * 60 * 1000;
        } else if (dr === '2026') {
          return new Date(o.orderedAt).getFullYear() === 2026;
        } else if (dr === '2025') {
          return new Date(o.orderedAt).getFullYear() === 2025;
        }
        return true;
      });
    }

    // 4. Search Filter (by title, order ID, product name, or brand)
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      enriched = enriched.filter((o) => {
        const titleMatch = o.productTitle.toLowerCase().includes(q);
        const idMatch = o.orderId.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
        const itemMatch = (o.orderItems || []).some((i) => i.title.toLowerCase().includes(q) || (i.brand && i.brand.toLowerCase().includes(q)));
        return titleMatch || idMatch || itemMatch;
      });
    }

    // 5. Sorting
    const sort = options.sort || 'newest';
    enriched.sort((a, b) => {
      const timeA = new Date(a.orderedAt).getTime();
      const timeB = new Date(b.orderedAt).getTime();
      return sort === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    // 6. Pagination
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.max(1, Number(options.limit || 10));
    const total = enriched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedOrders = enriched.slice((page - 1) * limit, page * limit);

    return {
      orders: paginatedOrders,
      total,
      page,
      limit,
      totalPages
    };
  }

  public async getOrders(userId: string = 'guest_default_session'): Promise<OrderRecord[]> {
    const raw = await dbClient.getOrders(userId);
    return raw.map((o) => this.enrichOrderRecord(o));
  }

  public async getLatestOrder(userId: string = 'guest_default_session'): Promise<OrderRecord | null> {
    const orders = await this.getOrders(userId);
    return orders.length > 0 ? orders[0] : null;
  }

  public async getOrderById(orderId: string, userId?: string): Promise<OrderRecord | null> {
    const order = await dbClient.getOrderById(orderId, userId);
    if (!order) return null;
    return this.enrichOrderRecord(order);
  }

  /**
   * Cancel an order if it's before SHIPPED stage
   */
  public async cancelOrder(orderId: string, userId: string, reason: string = 'Customer request'): Promise<OrderRecord> {
    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'CANCELLED') {
      return order;
    }

    if (order.status === 'SHIPPED' || order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED') {
      throw new Error(`Order cannot be cancelled after being dispatched (${order.status}).`);
    }

    if (order.isExternal) {
      throw new Error('External orders placed on Amazon, Flipkart, or Meesho must be managed directly on the respective store website.');
    }

    const nowIso = new Date().toISOString();
    order.status = 'CANCELLED';
    order.cancelledAt = nowIso;
    order.cancellationReason = reason;
    order.canCancel = false;

    // Update timeline
    order.timeline = [
      ...order.timeline.map((step) => ({ ...step, current: false })),
      {
        stage: 'Cancelled',
        description: `Order cancelled by user (${reason})`,
        timestamp: nowIso,
        completed: true,
        current: true
      }
    ];

    // Mark refund if demo payment
    if (order.paymentDetails) {
      order.paymentDetails.status = 'REFUND_INITIATED';
      order.paymentDetails.refundId = `rfnd_vc_${Date.now().toString().slice(-6)}`;
      order.paymentDetails.refundStatus = 'Refund Initiated';
      order.paymentDetails.refundAmount = order.totalAmount;
    }

    // Add activity log entries
    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push(
      {
        id: `act_${Date.now()}_cancel`,
        title: 'Order Cancelled',
        description: `Cancellation requested: "${reason}". Order has been cancelled.`,
        timestamp: nowIso,
        type: 'cancellation'
      },
      {
        id: `act_${Date.now()}_refund`,
        title: 'Refund Initiated',
        description: `Refund of ₹${order.totalAmount.toLocaleString()} has been initiated back to your original payment method.`,
        timestamp: nowIso,
        type: 'refund'
      }
    );

    await dbClient.saveOrder(order, userId);
    return order;
  }

  /**
   * Process Pay Before Delivery for an eligible Cash on Delivery (COD) order.
   * Validates user ownership, verifies payment via server-side gateway integration,
   * updates payment status to PAID, and records transaction details while preserving delivery tracking.
   */
  public async processPayBeforeDelivery(params: {
    orderId: string;
    userId: string;
    method: string;
    demoResult?: 'SUCCESS' | 'FAILED' | 'PENDING';
    failureReason?: string;
    paymentDetails?: any;
  }): Promise<{
    success: boolean;
    message: string;
    order: OrderRecord;
    paymentId?: string;
    isPaid?: boolean;
    signature?: string;
    method?: string;
    amount?: number;
    error?: string;
  }> {
    const { orderId, userId, method, demoResult = 'SUCCESS', failureReason, paymentDetails } = params;

    // 1. Fetch order with user isolation check
    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new Error('Order not found or you are not authorized to view this order.');
    }

    // 2. Business rules checks
    if (order.status === 'CANCELLED') {
      throw new Error('This order has been cancelled. Cannot proceed with payment.');
    }
    if (order.status === 'REFUNDED') {
      throw new Error('This order has already been refunded.');
    }
    if (order.status === 'DELIVERED') {
      throw new Error('This order has already been delivered.');
    }
    if (order.paidOnlineBeforeDelivery || order.paymentDetails?.status === 'PAID') {
      throw new Error('This order has already been paid online. No further payment is required.');
    }

    // 3. Process payment confirmation with payment gateway
    const confirmation = await demoPaymentService.processPaymentConfirmation({
      orderId: order.orderId || order.id,
      method: method || 'UPI',
      amount: order.totalAmount,
      demoResult,
      failureReason,
      paymentDetails
    });

    if (confirmation.status === 'FAILED') {
      // Record failed attempt in order activity log but keep order valid and pending
      const nowIso = new Date().toISOString();
      order.activityLog = order.activityLog || [];
      order.activityLog.push({
        id: `act_${Date.now()}`,
        title: 'Online Payment Attempt Failed',
        description: `Pay Before Delivery attempt via ${confirmation.method} failed: ${confirmation.message}. Order remains valid for Cash on Delivery or online retry.`,
        timestamp: nowIso,
        type: 'payment'
      });
      await dbClient.saveOrder(order, userId);
      return {
        success: false,
        isPaid: false,
        error: confirmation.message || 'Payment declined by issuing bank. Please retry.',
        message: confirmation.message || 'Payment declined by issuing bank. Please retry.',
        order: this.enrichOrderRecord(order)
      };
    }

    // 4. Update order to Paid Online Before Delivery
    const nowIso = new Date().toISOString();
    order.paymentId = confirmation.paymentId;
    order.paymentMethod = confirmation.method;
    order.paidAt = nowIso;
    order.paidOnlineBeforeDelivery = true;
    order.paymentStatus = 'PAID';

    // Normalize tracking status if it was COD_PENDING
    if (order.status === 'COD_PENDING') {
      order.status = 'CONFIRMED' as any;
    }

    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      method: confirmation.method,
      methodCode: confirmation.methodCode,
      status: 'PAID',
      paymentId: confirmation.paymentId,
      transactionTime: nowIso,
      paidOnlineBeforeDelivery: true,
      signature: confirmation.signature,
      cardBrand: paymentDetails?.cardBrand,
      cardLast4: paymentDetails?.cardLast4
    };

    // Update timeline and activity log
    order.activityLog = order.activityLog || [];
    order.activityLog.push({
      id: `act_${Date.now()}`,
      title: 'Pay Before Delivery Completed',
      description: `Payment of ₹${order.totalAmount.toLocaleString()} received online via ${confirmation.method} (Ref: ${confirmation.paymentId}). Zero cash due upon delivery.`,
      timestamp: nowIso,
      type: 'payment'
    });

    order.timeline = order.timeline || [];
    order.timeline.push({
      stage: 'Paid Online',
      description: `Paid ₹${order.totalAmount.toLocaleString()} via ${confirmation.method} (Ref: ${confirmation.paymentId}) before delivery. Zero cash due on delivery.`,
      timestamp: nowIso,
      completed: true,
      current: false
    });

    const enriched = this.enrichOrderRecord(order);
    await dbClient.saveOrder(enriched, userId);

    return {
      success: true,
      isPaid: true,
      message: 'Payment successful! Your order will be delivered as scheduled.',
      order: enriched,
      paymentId: confirmation.paymentId,
      signature: confirmation.signature,
      method: confirmation.method,
      amount: order.totalAmount
    };
  }

  /**
   * Reorder items: adds items back into user's cart
   */
  public async reorderOrder(orderId: string, userId: string): Promise<{ itemsAdded: number; cart: CartItem[] }> {
    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new Error('Order not found');
    }

    const items = order.orderItems || order.items || [];
    let count = 0;

    for (const item of items) {
      const prod = (item as any).product || item;
      const cartItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        product: {
          store: prod.store || order.store || 'amazon',
          productId: prod.productId || `PROD_${Date.now()}`,
          title: prod.title || order.productTitle,
          imageUrl: prod.imageUrl || order.productImage || '',
          price: prod.price || order.totalAmount,
          mrp: prod.mrp || Math.round((prod.price || order.totalAmount) * 1.2),
          discountPct: prod.discountPct || 15,
          rating: prod.rating || 4.2,
          ratingCount: prod.ratingCount || 1200,
          deliveryDays: prod.deliveryDays || 2,
          shippingFee: 0,
          seller: prod.seller || 'Verified Seller',
          inStock: true,
          productUrl: prod.productUrl || order.storeUrl,
          affiliateUrl: prod.affiliateUrl || order.storeUrl,
          returnPolicy: prod.returnPolicy || '7 Days Return'
        },
        quantity: item.quantity || 1,
        addedPrice: prod.price || order.totalAmount,
        currentPrice: prod.price || order.totalAmount,
        priceChanged: false,
        priceDelta: 0,
        addedAt: new Date().toISOString()
      };

      await dbClient.saveCartItem(cartItem, userId);
      count++;
    }

    const cart = await dbClient.getCart(userId);
    return { itemsAdded: count, cart };
  }

  /**
   * Parses raw SMS or confirmation email body to extract Store and Order ID.
   */
  public parseOrderText(text: string): {
    store: StoreName;
    orderId: string;
    productTitle?: string;
    amount?: number;
  } | null {
    const lower = text.toLowerCase();
    let detectedStore: StoreName = 'amazon';

    if (lower.includes('flipkart') || /OD\d{12,}/i.test(text)) {
      detectedStore = 'flipkart';
    } else if (lower.includes('meesho')) {
      detectedStore = 'meesho';
    } else if (lower.includes('amazon') || /\d{3}-\d{7}-\d{7}/.test(text)) {
      detectedStore = 'amazon';
    }

    const amazonPattern = /\b\d{3}-\d{7}-\d{7}\b/;
    const flipkartPattern = /\bOD\d{12,20}\b/i;
    const meeshoPattern = /\b(?:MEE-|order\s*#?|#)(\d{7,15})\b/i;
    const genericPattern = /\b([A-Z0-9]{8,24})\b/i;

    let orderId = '';
    if (detectedStore === 'amazon') {
      const match = text.match(amazonPattern);
      if (match) orderId = match[0];
    } else if (detectedStore === 'flipkart') {
      const match = text.match(flipkartPattern);
      if (match) orderId = match[0];
    } else if (detectedStore === 'meesho') {
      const match = text.match(meeshoPattern);
      if (match) orderId = match[1] || match[0];
    }

    if (!orderId) {
      const match = text.match(genericPattern);
      if (match) orderId = match[0];
    }

    if (!orderId) return null;

    const amountMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    return {
      store: detectedStore,
      orderId,
      amount: amount > 0 ? amount : 1499
    };
  }

  public async trackAndSaveOrder(params: {
    store: StoreName;
    orderId: string;
    productTitle?: string;
    productImage?: string;
    totalAmount?: number;
  }, userId: string = 'guest_default_session'): Promise<OrderRecord> {
    const now = new Date();
    const trackingUrls: Record<StoreName, string> = {
      amazon: `https://www.amazon.in/gp/your-account/order-details?orderID=${params.orderId}`,
      flipkart: `https://www.flipkart.com/account/orders?orderId=${params.orderId}`,
      meesho: `https://www.meesho.com/orders/${params.orderId}`,
      voicecart: `http://localhost:5173/orders?id=${params.orderId}`
    };

    const newOrder: OrderRecord = {
      id: uuidv4(),
      orderId: params.orderId,
      userId,
      store: params.store,
      productTitle: params.productTitle || `${params.store.toUpperCase()} Verified Purchase (#${params.orderId})`,
      productImage: params.productImage || '',
      totalAmount: params.totalAmount || 1499,
      status: 'SHIPPED',
      orderedAt: now.toISOString(),
      estimatedDeliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      trackingUrl: trackingUrls[params.store],
      storeUrl: trackingUrls[params.store],
      isExternal: params.store !== 'voicecart',
      canCancel: false,
      timeline: [
        {
          stage: 'Ordered',
          description: `Purchased on ${params.store.toUpperCase()}`,
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          completed: true,
          current: false
        },
        {
          stage: 'Packed',
          description: `Dispatched from ${params.store.toUpperCase()} merchant center`,
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
          completed: true,
          current: false
        },
        {
          stage: 'Shipped',
          description: `In transit via ${params.store.toUpperCase()} courier partner`,
          timestamp: now.toISOString(),
          completed: true,
          current: true
        },
        {
          stage: 'Out for delivery',
          description: 'Courier agent will deliver with OTP verification',
          timestamp: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          completed: false,
          current: false
        },
        {
          stage: 'Delivered',
          description: 'Package delivered at your doorstep',
          timestamp: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          completed: false,
          current: false
        }
      ]
    };

    const enriched = this.enrichOrderRecord(newOrder);
    return dbClient.saveOrder(enriched, userId);
  }

  /**
   * Submit or update 5-star customer feedback and review for an order
   */
  public async submitOrderFeedback(params: {
    orderId: string;
    userId: string;
    rating: number;
    comment?: string;
    tags?: string[];
  }): Promise<OrderRecord> {
    const { orderId, userId, rating, comment, tags } = params;

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }

    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new Error('Order not found or you are not authorized to rate this order.');
    }

    const nowIso = new Date().toISOString();
    const isUpdate = Boolean(order.customerFeedback);

    order.customerFeedback = {
      rating: Math.round(numRating),
      comment: (comment || '').trim(),
      tags: Array.isArray(tags) ? tags : [],
      submittedAt: order.customerFeedback?.submittedAt || nowIso,
      updatedAt: isUpdate ? nowIso : undefined
    };

    order.activityLog = order.activityLog || [];
    order.activityLog.push({
      id: `act_${Date.now()}`,
      title: isUpdate ? 'Delivery Review Updated' : 'Customer 5-Star Delivery Feedback Submitted',
      description: `Rated ${Math.round(numRating)}/5 stars${comment ? `: "${comment.slice(0, 80)}${comment.length > 80 ? '...' : ''}"` : ''}`,
      timestamp: nowIso,
      type: 'info'
    });

    const enriched = this.enrichOrderRecord(order);
    await dbClient.saveOrder(enriched, userId);
    return enriched;
  }
}

export const orderTrackerService = new OrderTrackerService();
