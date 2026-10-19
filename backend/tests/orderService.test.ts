import { orderTrackerService } from '../src/services/orderTrackerService';
import { dbClient } from '../src/db/dbClient';
import { OrderRecord } from '../src/types/product';

describe('OrderTrackerService & Orders Functionality Tests', () => {
  const testUserId = 'test_user_orders_123';
  const otherUserId = 'other_user_456';

  beforeEach(async () => {
    // Clear user data
    await dbClient.deleteUserAccount(testUserId);
    await dbClient.deleteUserAccount(otherUserId);
  });

  test('should create, isolate and fetch user orders', async () => {
    const order1 = await orderTrackerService.trackAndSaveOrder(
      {
        store: 'amazon',
        orderId: '402-1234567-8901234',
        productTitle: 'boAt Airdopes 141 ANC Earbuds',
        totalAmount: 1299
      },
      testUserId
    );

    expect(order1.orderId).toBe('402-1234567-8901234');
    expect(order1.store).toBe('amazon');

    // Test user can fetch their order
    const userOrders = await orderTrackerService.getOrders(testUserId);
    expect(userOrders.length).toBe(1);
    expect(userOrders[0].orderId).toBe('402-1234567-8901234');

    // Other user cannot see this order (ownership isolation)
    const otherOrders = await orderTrackerService.getOrders(otherUserId);
    expect(otherOrders.length).toBe(0);

    const forbiddenFetch = await orderTrackerService.getOrderById(order1.id, otherUserId);
    expect(forbiddenFetch).toBeNull();
  });

  test('should filter orders by status, store, search and sort', async () => {
    // Add multiple orders
    await orderTrackerService.trackAndSaveOrder(
      { store: 'amazon', orderId: 'AMZ-101', productTitle: 'Apple iPhone 15 Black 128GB', totalAmount: 69999 },
      testUserId
    );
    await orderTrackerService.trackAndSaveOrder(
      { store: 'flipkart', orderId: 'FLP-202', productTitle: 'Sony WH-1000XM5 Headphones', totalAmount: 24999 },
      testUserId
    );
    await orderTrackerService.trackAndSaveOrder(
      { store: 'meesho', orderId: 'MSH-303', productTitle: 'Casual Cotton T-Shirt', totalAmount: 399 },
      testUserId
    );

    // Search by product title
    const searchRes = await orderTrackerService.getOrdersFiltered(testUserId, { search: 'Sony' });
    expect(searchRes.orders.length).toBe(1);
    expect(searchRes.orders[0].orderId).toBe('FLP-202');

    // Store filter
    const storeRes = await orderTrackerService.getOrdersFiltered(testUserId, { store: 'amazon' });
    expect(storeRes.orders.length).toBe(1);
    expect(storeRes.orders[0].orderId).toBe('AMZ-101');

    // Pagination
    const pageRes = await orderTrackerService.getOrdersFiltered(testUserId, { page: 1, limit: 2 });
    expect(pageRes.orders.length).toBe(2);
    expect(pageRes.total).toBe(3);
    expect(pageRes.totalPages).toBe(2);
  });

  test('should cancel demo order and initiate demo refund before shipped', async () => {
    const demoOrder: OrderRecord = {
      id: 'demo_ord_cancel_test',
      orderId: 'VC-DEMO-998877',
      userId: testUserId,
      store: 'voicecart',
      productTitle: 'boAt Rockerz 450 Bluetooth Headphone',
      totalAmount: 1499,
      status: 'PLACED',
      orderedAt: new Date().toISOString(),
      trackingUrl: '/orders/VC-DEMO-998877',
      storeUrl: '/orders/VC-DEMO-998877',
      isDemo: true,
      canCancel: true,
      timeline: [
        { stage: 'Ordered', description: 'Placed', timestamp: new Date().toISOString(), completed: true, current: true }
      ]
    };

    await dbClient.saveOrder(demoOrder, testUserId);

    const cancelled = await orderTrackerService.cancelOrder(demoOrder.id, testUserId, 'Found cheaper elsewhere');
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancellationReason).toBe('Found cheaper elsewhere');
    expect(cancelled.paymentDetails?.status).toBe('REFUND_INITIATED');
  });

  test('should reorder items and add them to user cart', async () => {
    const order = await orderTrackerService.trackAndSaveOrder(
      { store: 'amazon', orderId: 'AMZ-REORDER-1', productTitle: 'boAt Airdopes 141', totalAmount: 1299 },
      testUserId
    );

    const reorderRes = await orderTrackerService.reorderOrder(order.id, testUserId);
    expect(reorderRes.itemsAdded).toBeGreaterThanOrEqual(1);

    const cart = await dbClient.getCart(testUserId);
    expect(cart.length).toBeGreaterThanOrEqual(1);
  });
});
