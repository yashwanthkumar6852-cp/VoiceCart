import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import axios from 'axios';
import { API_ROUTES as BACKEND_ROUTES, VALID_FEED_CATEGORIES as BACKEND_CATEGORIES } from '../src/constants/routes';
import feedRoutes from '../src/routes/feedRoutes';
import { dashboardFeedService } from '../src/services/dashboardFeedService';

describe('Shared API Contract & Feed Routing Verification Suite', () => {
  let app: express.Application;
  let server: http.Server;
  let baseUrl: string;

  beforeAll((done) => {
    app = express();
    app.use(express.json());
    app.use('/api/feed', feedRoutes);

    // 404 handler for unknown routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
        path: req.originalUrl,
        status: 404
      });
    });

    server = app.listen(0, () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('1. Frontend vs Backend Contract Strict Consistency', () => {
    test('Frontend and Backend route constants must match character-by-character', () => {
      const frontendRoutesPath = path.resolve(__dirname, '../../frontend/src/constants/routes.ts');
      const backendRoutesPath = path.resolve(__dirname, '../src/constants/routes.ts');

      const frontendContent = fs.readFileSync(frontendRoutesPath, 'utf8').trim().replace(/\r\n/g, '\n');
      const backendContent = fs.readFileSync(backendRoutesPath, 'utf8').trim().replace(/\r\n/g, '\n');

      expect(frontendContent).toBe(backendContent);
    });

    test('FEED route must be exactly "/api/feed"', () => {
      expect(BACKEND_ROUTES.FEED).toBe('/api/feed');
    });

    test('HEALTH route must be exactly "/api/health"', () => {
      expect(BACKEND_ROUTES.HEALTH).toBe('/api/health');
    });

    test('All required categories must be present in VALID_FEED_CATEGORIES', () => {
      const expected = [
        'all',
        'for-you',
        'fashion',
        'mobiles',
        'electronics',
        'beauty',
        'home',
        'appliances',
        'toys-baby',
        'food-health',
        'auto',
        'sports'
      ];
      for (const cat of expected) {
        expect(BACKEND_CATEGORIES).toContain(cat);
      }
    });
  });

  describe('2. Feed Endpoint Integration & Status Guarantees', () => {
    test('GET /api/feed (missing category) defaults to 200 with category="all"', async () => {
      const res = await axios.get(`${baseUrl}/api/feed`);
      expect(res.status).toBe(200);
      expect(res.data.category).toBe('all');
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(['ready', 'building', 'unavailable']).toContain(res.data.status);
    });

    test('GET /api/feed?category=all returns 200 with balanced mix', async () => {
      const res = await axios.get(`${baseUrl}/api/feed?category=all`);
      expect(res.status).toBe(200);
      expect(res.data.category).toBe('all');
      expect(['ready', 'building', 'unavailable']).toContain(res.data.status);
    });

    test('GET /api/feed?category=for-you maps correctly to category "all"', async () => {
      const res = await axios.get(`${baseUrl}/api/feed?category=for-you`);
      expect(res.status).toBe(200);
      expect(res.data.category).toBe('all');
    });

    test('GET /api/feed/mobiles (permanent alias) returns 200', async () => {
      const res = await axios.get(`${baseUrl}/api/feed/mobiles`);
      expect(res.status).toBe(200);
      expect(res.data.category).toBe('mobiles');
    });

    test('GET /api/feed?category=invalid_xyz returns 400 with standard error JSON', async () => {
      try {
        await axios.get(`${baseUrl}/api/feed?category=invalid_xyz`);
        throw new Error('Expected request to fail with 400');
      } catch (err: any) {
        expect(err.response?.status).toBe(400);
        expect(err.response?.data?.error).toBe('INVALID_CATEGORY');
        expect(err.response?.data?.message).toMatch(/Invalid category/);
        expect(err.response?.data?.path).toContain('/api/feed');
        expect(Array.isArray(err.response?.data?.validCategories)).toBe(true);
      }
    });

    test('GET /api/unknown_route_999 returns 404 with NOT_FOUND', async () => {
      try {
        await axios.get(`${baseUrl}/api/unknown_route_999`);
        throw new Error('Expected request to fail with 404');
      } catch (err: any) {
        expect(err.response?.status).toBe(404);
        expect(err.response?.data?.error).toBe('NOT_FOUND');
        expect(err.response?.data?.path).toBe('/api/unknown_route_999');
      }
    });

    test('Category normalization handles slugs and aliases', () => {
      expect(dashboardFeedService.normalizeCategory('for-you')).toBe('all');
      expect(dashboardFeedService.normalizeCategory('for_you')).toBe('all');
      expect(dashboardFeedService.normalizeCategory('toys-baby')).toBe('toys_baby');
      expect(dashboardFeedService.normalizeCategory('sports')).toBe('sports_fitness');
      expect(dashboardFeedService.normalizeCategory('mobiles')).toBe('mobiles');
    });
  });
});
