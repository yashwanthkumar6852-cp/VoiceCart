import { RankingEngine } from '../src/ranking/rankingEngine';
import { Product } from '../src/types/product';

describe('RankingEngine Tests', () => {
  const engine = new RankingEngine();

  const mockProducts: Product[] = [
    {
      store: 'amazon',
      productId: 'B08N5WRWNW',
      title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds',
      imageUrl: 'https://example.com/boat.jpg',
      price: 1299,
      mrp: 4490,
      discountPct: 71,
      rating: 4.3,
      ratingCount: 15400,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      productUrl: 'https://www.amazon.in/dp/B08N5WRWNW',
      affiliateUrl: 'https://www.amazon.in/dp/B08N5WRWNW?tag=voicecart0a-21',
      returnPolicy: '7 Days Replacement',
      fulfilledByStore: true
    },
    {
      store: 'flipkart',
      productId: 'FLIP12345',
      title: 'Noise Buds VS102 Truly Wireless Earbuds',
      imageUrl: 'https://example.com/noise.jpg',
      price: 999,
      mrp: 2999,
      discountPct: 66,
      rating: 4.1,
      ratingCount: 8200,
      deliveryDays: 2,
      shippingFee: 40,
      seller: 'RetailNet',
      inStock: true,
      productUrl: 'https://www.flipkart.com/item/FLIP12345',
      affiliateUrl: 'https://www.flipkart.com/item/FLIP12345?affid=voicecart',
      returnPolicy: '7 Days Return',
      fulfilledByStore: true
    },
    {
      store: 'meesho',
      productId: 'MEESH999',
      title: 'Generic Wireless Bluetooth Headphones 5.0',
      imageUrl: 'https://example.com/generic.jpg',
      price: 499,
      mrp: 999,
      discountPct: 50,
      rating: 3.2,
      ratingCount: 45,
      deliveryDays: 5,
      shippingFee: 0,
      seller: 'Supplier 88',
      inStock: true,
      productUrl: 'https://www.meesho.com/p/MEESH999',
      affiliateUrl: 'https://www.meesho.com/p/MEESH999',
      returnPolicy: 'No Returns',
      fulfilledByStore: false
    }
  ];

  test('should score and rank products accurately under balanced preference', async () => {
    const result = await engine.rank(mockProducts, 'boAt Airdopes 141', { preference: 'balanced' });
    expect(result.rankedProducts.length).toBeGreaterThanOrEqual(1);
    expect(result.topRecommendations.bestOverall).toBeDefined();

    // A high-rated, fast-delivery verified product (boAt) should score as best overall
    expect(['B08N5WRWNW', 'FLIP12345']).toContain(result.topRecommendations.bestOverall?.productId);
    expect(result.topRecommendations.bestOverall?.badges).toContain('Best Overall');
  });

  test('should prioritize price under cheapest preference', async () => {
    const result = await engine.rank(mockProducts, { preference: 'cheapest' });
    expect(result.rankedProducts[0].price).toBeLessThanOrEqual(mockProducts[0].price);
  });

  test('should filter out products strictly above budget limit', async () => {
    const result = await engine.rank(mockProducts, { maxBudget: 1000 });
    const expensive = result.rankedProducts.find((p) => p.price > 1000);
    expect(expensive).toBeUndefined();
  });

  test('should build cross-store comparison matrix correctly', async () => {
    const result = await engine.rank(mockProducts);
    expect(result.comparisonMatrix.length).toBe(3);
    const amazonSummary = result.comparisonMatrix.find((c) => c.store === 'amazon');
    expect(amazonSummary?.available).toBe(true);
    expect(amazonSummary?.lowestPrice).toBe(1299);
  });
});
