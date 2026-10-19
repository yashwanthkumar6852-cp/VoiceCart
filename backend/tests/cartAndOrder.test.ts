import { cartService } from '../src/services/cartService';
import { orderTrackerService } from '../src/services/orderTrackerService';
import { Product } from '../src/types/product';

describe('Cart & Order Management Tests', () => {
  const dummyProduct: Product = {
    store: 'amazon',
    productId: 'B0TESTASIN1',
    title: 'Test Earbuds ANC',
    imageUrl: 'https://example.com/test.jpg',
    price: 1999,
    mrp: 3999,
    discountPct: 50,
    rating: 4.5,
    ratingCount: 1000,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'Appario',
    inStock: true,
    productUrl: 'https://www.amazon.in/dp/B0TESTASIN1',
    affiliateUrl: 'https://www.amazon.in/dp/B0TESTASIN1?tag=voicecart0a-21'
  };

  beforeEach(async () => {
    await cartService.clearCart();
  });

  test('should add product to cart and verify cart contents', async () => {
    const item = await cartService.addToCart(dummyProduct, 1);
    expect(item.product.productId).toBe('B0TESTASIN1');
    expect(item.quantity).toBe(1);

    const cart = await cartService.getCart();
    expect(cart.length).toBe(1);
    expect(cart[0].addedPrice).toBe(1999);
  });

  test('should parse SMS notification text for Flipkart order', () => {
    const sms = 'Your Flipkart order OD987654321012345678 of Rs. 1499 has been packed and shipped!';
    const parsed = orderTrackerService.parseOrderText(sms);
    expect(parsed).not.toBeNull();
    expect(parsed?.store).toBe('flipkart');
    expect(parsed?.orderId).toBe('OD987654321012345678');
    expect(parsed?.amount).toBe(1499);
  });

  test('should parse SMS notification text for Amazon order', () => {
    const sms = 'Amazon.in: Your package with order 402-8765432-1234567 has arrived at the delivery station.';
    const parsed = orderTrackerService.parseOrderText(sms);
    expect(parsed).not.toBeNull();
    expect(parsed?.store).toBe('amazon');
    expect(parsed?.orderId).toBe('402-8765432-1234567');
  });
});
