import { orderTrackerService } from '../src/services/orderTrackerService';
import { dbClient } from '../src/db/dbClient';
import { OrderRecord } from '../src/types/product';

describe('Customer Delivery Feedback & 5-Star Rating System', () => {
  const userId = 'usr_feedback_test_101';
  let testOrder: OrderRecord;

  beforeEach(async () => {
    const rawOrder: OrderRecord = {
      id: `ord_feedback_test_${Date.now()}`,
      orderId: `VC-TEST-FB-${Date.now().toString().slice(-6)}`,
      store: 'voicecart',
      userId,
      productTitle: 'boAt Airdopes 141 ANC Earbuds',
      productImage: 'https://example.com/boat141.jpg',
      totalAmount: 1499,
      status: 'DELIVERED',
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      deliveredAt: new Date().toISOString(),
      trackingUrl: '/orders',
      storeUrl: '/orders',
      items: [
        {
          id: 'item_fb_1',
          productId: 'boat-141',
          title: 'boAt Airdopes 141 ANC Earbuds',
          price: 1499,
          mrp: 2999,
          discountPct: 50,
          imageUrl: 'https://example.com/boat141.jpg',
          store: 'voicecart',
          quantity: 1
        }
      ],
      timeline: [
        { stage: 'Delivered', description: 'Package delivered at your doorstep', timestamp: new Date().toISOString(), completed: true }
      ]
    };

    await dbClient.saveOrder(rawOrder, userId);
    testOrder = (await orderTrackerService.getOrderById(rawOrder.orderId, userId))!;
  });

  test('Successfully submit a 5-star feedback with comment and tags', async () => {
    const updated = await orderTrackerService.submitOrderFeedback({
      orderId: testOrder.orderId,
      userId,
      rating: 5,
      comment: 'Super fast delivery and the bass is amazing! Packaging was sealed.',
      tags: ['⚡ Lightning Fast Delivery', '📦 Safe & Secure Packaging', '🛡️ 100% Genuine Product']
    });

    expect(updated.customerFeedback).toBeDefined();
    expect(updated.customerFeedback?.rating).toBe(5);
    expect(updated.customerFeedback?.comment).toContain('Super fast delivery');
    expect(updated.customerFeedback?.tags?.length).toBe(3);
    expect(updated.customerFeedback?.submittedAt).toBeDefined();

    // Verify activity log entry
    const log = updated.activityLog?.find((l) => l.title.includes('5-Star Delivery Feedback'));
    expect(log).toBeDefined();
    expect(log?.description).toContain('Rated 5/5 stars');

    // Verify persistence across new DB fetch
    const reloaded = await orderTrackerService.getOrderById(testOrder.orderId, userId);
    expect(reloaded?.customerFeedback?.rating).toBe(5);
    expect(reloaded?.customerFeedback?.comment).toContain('Super fast delivery');
  });

  test('Validates rating bounds (1 to 5 stars)', async () => {
    await expect(
      orderTrackerService.submitOrderFeedback({
        orderId: testOrder.orderId,
        userId,
        rating: 6,
        comment: 'Too high'
      })
    ).rejects.toThrow('Rating must be an integer between 1 and 5 stars');

    await expect(
      orderTrackerService.submitOrderFeedback({
        orderId: testOrder.orderId,
        userId,
        rating: 0,
        comment: 'Too low'
      })
    ).rejects.toThrow('Rating must be an integer between 1 and 5 stars');
  });

  test('Allows customer to update their existing delivery review', async () => {
    // Initial 4-star review
    await orderTrackerService.submitOrderFeedback({
      orderId: testOrder.orderId,
      userId,
      rating: 4,
      comment: 'Good sound quality'
    });

    // Update to 5-star review
    const updated = await orderTrackerService.submitOrderFeedback({
      orderId: testOrder.orderId,
      userId,
      rating: 5,
      comment: 'Updated: Battery life exceeded expectations! 5 stars.',
      tags: ['💰 Best Price vs Other Stores']
    });

    expect(updated.customerFeedback?.rating).toBe(5);
    expect(updated.customerFeedback?.comment).toContain('Updated: Battery life');
    expect(updated.customerFeedback?.updatedAt).toBeDefined();
  });
});
