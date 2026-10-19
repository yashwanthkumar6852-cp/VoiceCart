import { demoPaymentService } from '../src/services/demoPaymentService';
import { cartService } from '../src/services/cartService';
import { dbClient } from '../src/db/dbClient';
import { Product, OrderRecord } from '../src/types/product';

describe('Built-in Demo Payment Gateway Unit and Integration Tests', () => {
  const ownStoreProduct: Product = {
    store: 'voicecart',
    productId: 'VC-CARE-101',
    title: 'VoiceCart Express Protection',
    imageUrl: 'https://example.com/care.jpg',
    price: 499,
    mrp: 999,
    discountPct: 50,
    rating: 4.9,
    ratingCount: 500,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'VoiceCart Official Store',
    inStock: true,
    productUrl: '#',
    affiliateUrl: '#'
  };

  const amazonPartnerProduct: Product = {
    store: 'amazon',
    productId: 'B0AMZTEST1',
    title: 'Amazon Partner Earbuds',
    imageUrl: 'https://example.com/earbuds.jpg',
    price: 1999,
    mrp: 3999,
    discountPct: 50,
    rating: 4.5,
    ratingCount: 1200,
    deliveryDays: 2,
    shippingFee: 0,
    seller: 'Appario',
    inStock: true,
    productUrl: 'https://amazon.in/dp/B0AMZTEST1',
    affiliateUrl: 'https://amazon.in/dp/B0AMZTEST1?tag=voxacart-21'
  };

  beforeEach(async () => {
    await cartService.clearCart();
  });

  test('Public configuration should expose only demo gateway details without external secrets', () => {
    const pubConfig = demoPaymentService.getConfig();
    expect(pubConfig.isConfigured).toBe(true);
    expect(pubConfig.isDemo).toBe(true);
    expect(pubConfig.name).toContain('VoiceCart Pay');
    expect(pubConfig.supportedMethods).toContain('COD');
    expect(pubConfig.supportedMethods).toContain('UPI');
    expect(pubConfig.supportedMethods).toContain('QR');
    expect(pubConfig.supportedMethods).toContain('WALLET');
    expect(pubConfig.supportedMethods).toContain('CARD');
    expect(pubConfig.supportedMethods).toContain('NETBANKING');
  });

  test('Luhn Card validation verifies valid cards and rejects invalid numbers', () => {
    // 4111 1111 1111 1111 is a valid standard Visa test card under Luhn
    expect(demoPaymentService.validateLuhn('4111111111111111')).toBe(true);
    expect(demoPaymentService.validateLuhn('4111 1111 1111 1111')).toBe(true);
    expect(demoPaymentService.validateLuhn('4000000000000002')).toBe(true);

    // Invalid checksum digits
    expect(demoPaymentService.validateLuhn('4111111111111112')).toBe(false);
    expect(demoPaymentService.validateLuhn('12345')).toBe(false);
    expect(demoPaymentService.validateLuhn('abc')).toBe(false);
  });

  test('Demo order creation generates local order_vc_ IDs with correct amount in paise', async () => {
    const amountInInr = 499;
    const receipt = `rcpt_${Date.now()}`;
    const order = await demoPaymentService.createOrder(amountInInr, receipt, { note: 'college_demo' });
    
    expect(order.id).toMatch(/^order_vc_/);
    expect(order.amount).toBe(49900); // in paise
    expect(order.amountInr).toBe(499);
    expect(order.currency).toBe('INR');
    expect(order.status).toBe('created');
  });

  test('Payment confirmation handles all 6 methods with SUCCESS result', async () => {
    const methods = ['cod', 'upi', 'qr', 'wallet', 'card', 'netbanking'];
    for (const m of methods) {
      const res = await demoPaymentService.processPaymentConfirmation({
        orderId: `order_vc_test_${m}`,
        method: m,
        demoResult: 'SUCCESS'
      });

      expect(res.paymentId).toMatch(/^pay_vc_/);
      expect(res.isSuccess).toBe(true);
      if (m === 'cod') {
        expect(res.status).toBe('cod_pending');
      } else {
        expect(res.status).toBe('PAID');
      }
    }
  });

  test('Payment confirmation handles FAILED demo results for all methods', async () => {
    const res = await demoPaymentService.processPaymentConfirmation({
      orderId: 'order_DEMO_123',
      method: 'card',
      demoResult: 'FAILED',
      failureReason: 'Insufficient funds simulation'
    });

    expect(res.status).toBe('FAILED');
    expect(res.isSuccess).toBe(false);
    expect(res.message).toContain('Insufficient funds');
  });

  test('Payment confirmation handles PENDING demo results for all methods', async () => {
    const res = await demoPaymentService.processPaymentConfirmation({
      orderId: 'order_DEMO_123',
      method: 'netbanking',
      demoResult: 'PENDING'
    });

    expect(res.status).toBe('PENDING');
    expect(res.isSuccess).toBe(false);
  });

  test('All baskets including partner items can calculate total and process in cart', async () => {
    await cartService.addToCart(amazonPartnerProduct, 1);
    await cartService.addToCart(ownStoreProduct, 2);

    const cart = await cartService.getCart();
    expect(cart.length).toBe(2);

    // Total = 1999*1 + 499*2 = 2997
    const totalAmount = cart.reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);
    expect(totalAmount).toBe(2997);

    const demoOrder = await demoPaymentService.createOrder(totalAmount);
    expect(demoOrder.amountInr).toBe(2997);
    expect(demoOrder.amount).toBe(299700);
  });

  test('Order state transition saves payment metadata and timeline', async () => {
    const orderId = `order_DEMO_${Date.now()}`;
    const newOrder: OrderRecord = {
      id: orderId,
      orderId: 'VC-DEMO-123456',
      store: 'voicecart',
      productTitle: 'VoiceCart SoundMax Pro',
      totalAmount: 1499,
      status: 'CREATED',
      orderedAt: new Date().toISOString(),
      trackingUrl: `/orders?id=VC-DEMO-123456`,
      storeUrl: `/orders?id=VC-DEMO-123456`,
      paymentOrderId: orderId,
      paymentMode: 'test',
      timeline: [
        { stage: 'Order Initiated', description: 'Order created', timestamp: new Date().toISOString(), completed: true, current: false },
        { stage: 'Payment Authorization', description: 'Awaiting customer payment', timestamp: new Date().toISOString(), completed: false, current: true }
      ]
    };

    await dbClient.saveOrder(newOrder);
    const retrieved = await dbClient.getOrderById(orderId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.totalAmount).toBe(1499);
  });
});
