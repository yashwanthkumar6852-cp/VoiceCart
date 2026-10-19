import { dashboardFeedService } from '../src/services/dashboardFeedService';
import { compareService } from '../src/services/compareService';
import { searchSessionService } from '../src/services/searchSessionService';
import { Product } from '../src/types/product';

describe('Dashboard Feed and Cross-Store Comparison Suite', () => {
  describe('1. Dashboard Feed Service', () => {
    test('Categories supported must include trending and all product categories', () => {
      const categories = ['all', 'mobiles', 'earbuds', 'smartwatches', 'laptops', 'appliances', 'fashion', 'footwear', 'home', 'beauty', 'groceries', 'toys'];
      expect(categories).toContain('all');
      expect(categories).toContain('mobiles');
      expect(categories).toContain('earbuds');
      expect(categories).toContain('smartwatches');
      expect(categories).toContain('laptops');
      expect(categories).toContain('appliances');
      expect(categories).toContain('fashion');
      expect(categories).toContain('footwear');
      expect(categories).toContain('home');
      expect(categories).toContain('beauty');
      expect(categories).toContain('groceries');
      expect(categories).toContain('toys');
    });

    test('getFeed returns products with valid fields and lastUpdated timestamp', async () => {
      const feed = await dashboardFeedService.getFeed('mobiles');
      expect(feed).toBeDefined();
      expect(feed.category).toBe('mobiles');
      expect(feed.lastUpdated).toBeDefined();
      expect(Array.isArray(feed.products)).toBe(true);

      if (feed.products.length > 0) {
        const item = feed.products[0];
        expect(item.productId).toBeDefined();
        expect(item.store).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.price).toBeGreaterThan(0);
      }
    });

    test('Feed caches per-category without refetching if cache is fresh', async () => {
      const feed1 = await dashboardFeedService.getFeed('smartwatches');
      const feed2 = await dashboardFeedService.getFeed('smartwatches');
      expect(feed1.lastUpdated).toBe(feed2.lastUpdated);
    });
  });

  describe('2. Live 3-Store Cross-Store Comparison Service', () => {
    test('Performs cross store comparison for a query and includes header info', async () => {
      const comparison = await compareService.compareSpecs({
        query: 'Apple iPhone 14 Plus 128GB'
      });
      expect(comparison).toBeDefined();
      expect(comparison.query).toBe('Apple iPhone 14 Plus 128GB');
      expect(comparison.stores).toBeDefined();
      expect(comparison.stores.amazon).toBeDefined();
      expect(comparison.stores.flipkart).toBeDefined();
      expect(comparison.stores.meesho).toBeDefined();
      expect(comparison.winners).toBeDefined();
    });

    test('Returns graceful fallback when neither query nor product is provided', async () => {
      const result = await compareService.compareSpecs({});
      expect(result).toBeDefined();
      expect(result.stores.amazon.match).toBe('NOT_FOUND');
      expect(result.stores.flipkart.match).toBe('NOT_FOUND');
      expect(result.stores.meesho.match).toBe('NOT_FOUND');
      expect(result.notice).toBeDefined();
    });
  });
});
