import { orderTrackerService } from '../src/services/orderTrackerService';
import { demoPaymentService } from '../src/services/demoPaymentService';
import { dbClient } from '../src/db/dbClient';
import { OrderRecord } from '../src/types/product';

describe('Pay Before Delivery for COD Orders - Business Rules & Integrity Tests', () => {
  const userId = 'usr_cod_test_999';
  const otherUserId = 'usr_intruder_888';
  let codOrder: OrderRecord;

  beforeEach(async () => {
    const rawOrder: OrderRecord = {
      id: `ord_cod_test_${Date.now()}`,
      orderId: `VC-COD-${Date.now()}`,
      store: 'voicecart',
      userId,
      productTitle: 'boAt Airdopes 141 ANC',
      productImage: 'https://example.com/boat141.jpg',
      totalAmount: 1499,
      status: 'CONFIRMED',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      paidOnlineBeforeDelivery: false,
      isCodEligibleForPrePayment: true,
      orderedAt: new Date().toISOString(),
      estimatedDeliveryDate: 'Within 2-3 Business Days',
      trackingUrl: '/orders',
      storeUrl: '/orders',
      paymentDetails: {
        method: 'COD',
        status: 'PENDING',
        paymentId: `cod_${Date.now()}`,
        isDemo: true
      },
      items: [
        {
          id: 'item_1',
          productId: 'boat-141',
          title: 'boAt Airdopes 141 ANC',
          price: 1499,
          mrp: 2999,
          discountPct: 50,
          store: 'voicecart',
          quantity: 1,
          imageUrl: 'https://example.com/boat141.jpg'
        }
      ],
      timeline: [
        {
          stage: 'Order Placed',
          description: 'Order placed using Cash on Delivery (Payment Pending)',
          timestamp: new Date().toISOString(),
          completed: true,
          current: false
        },
        {
          stage: 'Order Confirmed',
          description: 'Seller has confirmed your order',
          timestamp: new Date().toISOString(),
          completed: true,
          current: true
        }
      ]
    };

    await dbClient.saveOrder(rawOrder, userId);
    codOrder = (await orderTrackerService.getOrderById(rawOrder.orderId, userId))!;
  });

  test('1. Initial COD order has Pending payment status, Confirmed order status, and is eligible for pre-delivery payment', () => {
    expect(codOrder).toBeDefined();
    expect(codOrder.paymentMethod).toBe('COD');
    expect(codOrder.paymentStatus).toBe('PENDING');
    expect(codOrder.status).toBe('CONFIRMED');
    expect(codOrder.paidOnlineBeforeDelivery).toBe(false);
    expect(codOrder.isCodEligibleForPrePayment).toBe(true);
  });

  test('2. Server verifies gateway signature and executes Pay Before Delivery successfully', async () => {
    const result = await orderTrackerService.processPayBeforeDelivery({
      orderId: codOrder.orderId,
      userId,
      method: 'upi',
      demoResult: 'SUCCESS'
    });

    expect(result.success).toBe(true);
    expect(result.isPaid).toBe(true);
    expect(result.paymentId).toMatch(/^pay_vc_/);
    expect(result.signature).toBeDefined();

    // Verify HMAC-SHA256 signature
    const isValidSignature = demoPaymentService.verifyPaymentSignature(
      result.paymentId!,
      codOrder.orderId,
      codOrder.totalAmount,
      result.signature!
    );
    expect(isValidSignature).toBe(true);

    // Fetch updated order from DB
    const updatedOrder = (await orderTrackerService.getOrderById(codOrder.orderId, userId))!;
    expect(updatedOrder.paymentStatus).toBe('PAID');
    expect(updatedOrder.paidOnlineBeforeDelivery).toBe(true);
    expect(updatedOrder.isCodEligibleForPrePayment).toBe(false);
    expect(updatedOrder.paymentDetails?.status).toBe('PAID');
    expect(updatedOrder.paymentDetails?.paymentId).toBe(result.paymentId);
    expect(updatedOrder.paymentDetails?.method).toContain('UPI');

    // Crucial requirement: tracking status remains CONFIRMED (unchanged)
    expect(updatedOrder.status).toBe('CONFIRMED');

    // Activity log must record Pay Before Delivery Completed
    const hasPaymentLog = updatedOrder.activityLog?.some((a) => a.title.includes('Pay Before Delivery Completed'));
    expect(hasPaymentLog).toBe(true);
  });

  test('3. Idempotency guard: Rejects duplicate payment attempts on an already-paid order', async () => {
    // Pay first time
    await orderTrackerService.processPayBeforeDelivery({
      orderId: codOrder.orderId,
      userId,
      method: 'card',
      demoResult: 'SUCCESS'
    });

    // Try paying second time
    await expect(
      orderTrackerService.processPayBeforeDelivery({
        orderId: codOrder.orderId,
        userId,
        method: 'card',
        demoResult: 'SUCCESS'
      })
    ).rejects.toThrow('This order has already been paid online');
  });

  test('4. Security & User Isolation: Cannot pay or inspect an order belonging to another user', async () => {
    await expect(
      orderTrackerService.processPayBeforeDelivery({
        orderId: codOrder.orderId,
        userId: otherUserId,
        method: 'upi',
        demoResult: 'SUCCESS'
      })
    ).rejects.toThrow('Order not found or you are not authorized');
  });

  test('5. Business Rules: Rejects payment on CANCELLED or DELIVERED orders', async () => {
    // Test CANCELLED
    codOrder.status = 'CANCELLED';
    await dbClient.saveOrder(codOrder, userId);

    await expect(
      orderTrackerService.processPayBeforeDelivery({
        orderId: codOrder.orderId,
        userId,
        method: 'upi',
        demoResult: 'SUCCESS'
      })
    ).rejects.toThrow('This order has been cancelled');

    // Test DELIVERED
    codOrder.status = 'DELIVERED';
    await dbClient.saveOrder(codOrder, userId);

    await expect(
      orderTrackerService.processPayBeforeDelivery({
        orderId: codOrder.orderId,
        userId,
        method: 'upi',
        demoResult: 'SUCCESS'
      })
    ).rejects.toThrow('This order has already been delivered');
  });

  test('6. Failed payment keeps the order valid and payment status PENDING for retry', async () => {
    const result = await orderTrackerService.processPayBeforeDelivery({
      orderId: codOrder.orderId,
      userId,
      method: 'card',
      demoResult: 'FAILED',
      failureReason: 'Bank switch timeout simulation'
    });

    expect(result.success).toBe(false);
    expect(result.isPaid).toBe(false);
    expect(result.error).toContain('Bank switch timeout');

    // Verify order remains valid, pending, and retryable
    const orderAfterFail = (await orderTrackerService.getOrderById(codOrder.orderId, userId))!;
    expect(orderAfterFail.status).toBe('CONFIRMED');
    expect(orderAfterFail.paymentStatus).toBe('PENDING');
    expect(orderAfterFail.paidOnlineBeforeDelivery).toBe(false);
    expect(orderAfterFail.isCodEligibleForPrePayment).toBe(true);
  });
});
