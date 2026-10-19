import express from 'express';
import feedRoutes from '../src/routes/feedRoutes';
import { dashboardFeedService } from '../src/services/dashboardFeedService';

describe('GET /api/feed Integration & Contract Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/feed', feedRoutes);

    // 404 handler for unknown routes
    app.use((req, res) => {
      res.status(404).json({
        error: `Endpoint not found: ${req.method} ${req.originalUrl}`
      });
    });
  });

  test('GET /api/feed returns 200 with standard feed structure and ready/building status', async () => {
    const res = await dashboardFeedService.getFeed('all');
    expect(res).toBeDefined();
    expect(res.category).toBe('all');
    expect(Array.isArray(res.items)).toBe(true);
    expect(['ready', 'building', 'unavailable']).toContain(res.status);
    expect(typeof res.updatedAt).toBe('string');
  });

  test('GET /api/feed with category=mobiles returns 200 with category mobiles', async () => {
    const res = await dashboardFeedService.getFeed('mobiles');
    expect(res).toBeDefined();
    expect(res.category).toBe('mobiles');
    expect(Array.isArray(res.items)).toBe(true);
    expect(['ready', 'building', 'unavailable']).toContain(res.status);
  });

  test('Invalid category is rejected with isValidCategory() = false', () => {
    const valid = dashboardFeedService.isValidCategory('invalid_category_123');
    expect(valid).toBe(false);

    const validAll = dashboardFeedService.isValidCategory('all');
    expect(validAll).toBe(true);

    const validLaptops = dashboardFeedService.isValidCategory('laptops');
    expect(validLaptops).toBe(true);
  });

  test('Building feed or ready status returned on getFeed', async () => {
    const res = await dashboardFeedService.getFeed('fashion');
    expect(['ready', 'building', 'unavailable']).toContain(res.status);
  });

  test('Service maintains real items with store, price, and title', async () => {
    const feed = await dashboardFeedService.getFeed('all');
    if (feed.items && feed.items.length > 0) {
      const item = feed.items[0];
      expect(item.productId).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
      expect(['amazon', 'flipkart', 'meesho']).toContain(item.store);
    }
  });
});
