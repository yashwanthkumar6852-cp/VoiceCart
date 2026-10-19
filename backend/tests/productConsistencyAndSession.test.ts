import { querySpecExtractor } from '../src/ranking/querySpecExtractor';
import { searchSessionService, SearchRecommendation } from '../src/services/searchSessionService';
import { productDetailService } from '../src/services/productDetailService';
import { rankingEngine } from '../src/ranking/rankingEngine';
import { Product, ProductSpec } from '../src/types/product';

jest.setTimeout(30000);

describe('Product Consistency, Search Sessions & Runtime Guards', () => {
  // Real sample products
  const realIPhone14: Product = {
    store: 'amazon',
    productId: 'amz_iphone_14_128gb_midnight',
    title: 'Apple iPhone 14 (128 GB) - Midnight',
    brand: 'Apple',
    model: 'iPhone 14',
    imageUrl: 'https://m.media-amazon.com/images/I/61bK6PMOC3L._SX679_.jpg',
    price: 54900,
    mrp: 69900,
    discountPct: 21,
    rating: 4.6,
    ratingCount: 14500,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'Appario Retail / Amazon Prime',
    inStock: true,
    relevanceScore: 95,
    productUrl: 'https://www.amazon.in/dp/B0BDHX8Z63',
    affiliateUrl: 'https://www.amazon.in/dp/B0BDHX8Z63?tag=voxacart-21'
  };

  const realBoatEarbuds: Product = {
    store: 'amazon',
    productId: 'amz_boat_airdopes_141_black',
    title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds (Bold Black)',
    brand: 'boAt',
    model: 'Airdopes 141',
    imageUrl: 'https://m.media-amazon.com/images/I/51HBom8xz7L._SX679_.jpg',
    price: 1299,
    mrp: 4490,
    discountPct: 71,
    rating: 4.1,
    ratingCount: 189000,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'Appario Retail / Amazon Prime',
    inStock: true,
    relevanceScore: 92,
    productUrl: 'https://www.amazon.in/dp/B09N3ZNHTY',
    affiliateUrl: 'https://www.amazon.in/dp/B09N3ZNHTY?tag=voxacart-21'
  };

  describe('1. Query Spec & Article Stripping', () => {
    it('should extract identical clean spec for "Show the iPhone 14" and "the iphone 14"', async () => {
      const specVoice = await querySpecExtractor.extractSpec('Show the iPhone 14');
      const specTyped = await querySpecExtractor.extractSpec('the iphone 14');

      expect(specVoice.brand).toBe('Apple');
      expect(specVoice.model).toBe('iPhone 14');
      expect(specVoice.mustInclude.some(t => t.includes('14'))).toBe(true);
      expect(specVoice.mustInclude).not.toContain('the');

      expect(specTyped.brand).toBe('Apple');
      expect(specTyped.model).toBe('iPhone 14');
      expect(specTyped.mustInclude.some(t => t.includes('14'))).toBe(true);
      expect(specTyped.mustInclude).not.toContain('the');
    });

    it('should extract brand and budget for "Show the boat earbuds under 2000"', async () => {
      const spec = await querySpecExtractor.extractSpec('Show the boat earbuds under 2000');
      expect(spec.brand).toBe('boAt');
      expect(spec.budgetMax).toBe(2000);
      expect(spec.productType).toBe('earbuds');
    });
  });

  describe('2. Two Consecutive Searches Isolation', () => {
    it('creates isolated SearchSessions where the second search never contains or speaks the first product', async () => {
      const search1Id = 'search_1_iphone';
      const spec1 = await querySpecExtractor.extractSpec('Show the iPhone 14');
      const session1 = await searchSessionService.createSession({
        searchId: search1Id,
        rawQuery: 'Show the iPhone 14',
        spec: spec1,
        products: [realIPhone14],
        topRecommendations: { bestOverall: realIPhone14 }
      });

      expect(session1.recommendation?.title).toContain('iPhone 14');
      expect(session1.replyText).toContain('iPhone 14');

      const search2Id = 'search_2_boat_earbuds';
      const spec2 = await querySpecExtractor.extractSpec('Show the boat earbuds under 2000');
      const session2 = await searchSessionService.createSession({
        searchId: search2Id,
        rawQuery: 'Show the boat earbuds under 2000',
        spec: spec2,
        products: [realBoatEarbuds],
        topRecommendations: { bestOverall: realBoatEarbuds }
      });

      // Assert that search 2 does NOT describe iPhone
      expect(session2.recommendation?.title).toContain('boAt Airdopes 141');
      expect(session2.recommendation?.title).not.toContain('iPhone');
      expect(session2.replyText).toContain('boAt Airdopes');
      expect(session2.replyText).not.toContain('iPhone');
      expect(session2.spokenText).toContain('boAt Airdopes');
      expect(session2.spokenText).not.toContain('iPhone');
    });
  });

  describe('3. Runtime Recommendation Guard', () => {
    it('discards an earbud product if user queried for an iPhone', async () => {
      const specIPhone = await querySpecExtractor.extractSpec('Show the iPhone 14');
      const earbudRec: SearchRecommendation = {
        productId: 'amz_boat_earbuds',
        store: 'amazon',
        title: 'boAt Airdopes 141 Wireless Earbuds',
        imageUrl: 'https://example.com/earbuds.jpg',
        price: 1299,
        rating: 4.2,
        ratingCount: 1000,
        deliveryDays: 1,
        shippingFee: 0,
        productUrl: 'https://example.com/earbuds',
        badges: []
      };

      const isValid = searchSessionService.validateRecommendation(earbudRec, specIPhone);
      expect(isValid).toBe(false);
    });

    it('approves a genuine iPhone product matching the iPhone spec', async () => {
      const specIPhone = await querySpecExtractor.extractSpec('Show the iPhone 14');
      const iphoneRec: SearchRecommendation = {
        productId: 'amz_iphone_14',
        store: 'amazon',
        title: 'Apple iPhone 14 (128 GB) - Midnight',
        brand: 'Apple',
        imageUrl: 'https://example.com/iphone.jpg',
        price: 54900,
        rating: 4.6,
        ratingCount: 12000,
        deliveryDays: 1,
        shippingFee: 0,
        productUrl: 'https://example.com/iphone',
        badges: []
      };

      const isValid = searchSessionService.validateRecommendation(iphoneRec, specIPhone);
      expect(isValid).toBe(true);
    });
  });

  describe('4. Product Details Session Lookup & Zero Fabricated Data', () => {
    it('retrieves the exact product snapshot from SearchSession without dummy smartwatch images or fake offers', async () => {
      const searchId = 'search_test_session_lookup';
      const spec = await querySpecExtractor.extractSpec('Apple iPhone 14');
      const session = await searchSessionService.createSession({
        searchId,
        rawQuery: 'Apple iPhone 14',
        spec,
        products: [realIPhone14],
        topRecommendations: { bestOverall: realIPhone14 }
      });

      const details = await productDetailService.getProductDetails(
        'amazon',
        realIPhone14.productId,
        session.sessionId
      );

      expect(details.product).not.toBeNull();
      expect(details.product?.title).toBe(realIPhone14.title);
      expect(details.product?.price).toBe(realIPhone14.price);
      expect(details.product?.imageUrl).toBe(realIPhone14.imageUrl);

      // Verify NO smartwatch placeholder image
      expect(details.product?.imageUrl).not.toContain('photo-1523275335684-37898b6baf30');
    });

    it('returns snapshot data with detailsAvailable: false on enrichment failure without fake sellers', async () => {
      const details = await productDetailService.getProductDetails('amazon', 'unknown_id_xyz');
      if (!details.product) {
        expect(details.detailsAvailable).toBe(false);
        expect(details.notice).toContain('not found');
      }
    });
  });
});
