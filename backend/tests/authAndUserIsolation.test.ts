import { cartService } from '../src/services/cartService';
import { orderTrackerService } from '../src/services/orderTrackerService';
import { dbClient } from '../src/db/dbClient';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../src/middleware/auth';
import { CommandRouter } from '../src/voice/commandRouter';
import { Product } from '../src/types/product';
import { Response } from 'express';

describe('VoiceCart Authentication, Isolation & Voice Pipeline Tests', () => {
  const commandRouter = new CommandRouter();

  const mockProductA: Product = {
    productId: 'PROD_A1',
    title: 'Sony WH-1000XM5 Headphones',
    price: 26990,
    mrp: 29990,
    discountPct: 10,
    rating: 4.8,
    ratingCount: 1240,
    deliveryDays: 2,
    shippingFee: 0,
    seller: 'Appario Retail',
    store: 'amazon',
    productUrl: 'https://amazon.in/dp/mockA',
    affiliateUrl: 'https://amazon.in/dp/mockA?tag=voxacart-21',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    inStock: true
  };

  const mockProductB: Product = {
    productId: 'PROD_B1',
    title: 'Apple iPad Air M2',
    price: 59900,
    mrp: 64900,
    discountPct: 8,
    rating: 4.9,
    ratingCount: 520,
    deliveryDays: 1,
    shippingFee: 0,
    seller: 'SuperComNet',
    store: 'flipkart',
    productUrl: 'https://flipkart.com/dp/mockB',
    affiliateUrl: 'https://flipkart.com/dp/mockB',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
    inStock: true
  };

  beforeEach(async () => {
    await cartService.clearCart('usr_test_user_a');
    await cartService.clearCart('usr_test_user_b');
    await cartService.clearCart('guest_test_session');
    await dbClient.deleteUserAccount('usr_test_user_a');
    await dbClient.deleteUserAccount('usr_test_user_b');
  });

  describe('1. Protected API Auth Middleware', () => {
    it('returns 401 JSON when Authorization header is missing on protected endpoint', async () => {
      const req = {
        headers: {},
        query: {}
      } as unknown as AuthenticatedRequest;

      let statusCode = 0;
      let jsonBody: any = null;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        }
      } as unknown as Response;

      const next = jest.fn();

      await requireAuth(req, res, next);
      expect(statusCode).toBe(401);
      expect(jsonBody).toHaveProperty('error');
      expect(jsonBody.error).toContain('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 JSON when invalid token is provided', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid_garbage_token' },
        query: {}
      } as unknown as AuthenticatedRequest;

      let statusCode = 0;
      let jsonBody: any = null;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return res;
        },
        json: (body: any) => {
          jsonBody = body;
          return res;
        }
      } as unknown as Response;

      const next = jest.fn();

      await requireAuth(req, res, next);
      expect(statusCode).toBe(401);
      expect(jsonBody.error).toContain('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });

    it('passes to next() and populates req.user when valid token is provided', async () => {
      const req = {
        headers: { authorization: 'Bearer usr_demo_4f8e21ab' },
        query: {}
      } as unknown as AuthenticatedRequest;

      const res = {} as unknown as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe('usr_demo_4f8e21ab');
    });

    it('optionalAuth populates guestSessionId when unauthenticated', async () => {
      const req = {
        headers: { 'x-guest-session-id': 'guest_sess_xyz' },
        query: {}
      } as unknown as AuthenticatedRequest;

      const res = {} as unknown as Response;
      const next = jest.fn();

      await optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.guestSessionId).toBe('guest_sess_xyz');
    });
  });

  describe('2. User Cart and Order Isolation', () => {
    it('User A and User B maintain separate isolated carts', async () => {
      // User A adds product A
      await cartService.addToCart(mockProductA, 1, 'usr_test_user_a');
      // User B adds product B
      await cartService.addToCart(mockProductB, 2, 'usr_test_user_b');

      const cartA = await cartService.getCart('usr_test_user_a');
      const cartB = await cartService.getCart('usr_test_user_b');

      expect(cartA.length).toBe(1);
      expect(cartA[0].product.productId).toBe('PROD_A1');

      expect(cartB.length).toBe(1);
      expect(cartB[0].product.productId).toBe('PROD_B1');
      expect(cartB[0].quantity).toBe(2);
    });

    it('Guest cart merges into authenticated user account on login', async () => {
      // Guest adds product A
      await cartService.addToCart(mockProductA, 1, 'guest_test_session');

      // User A logs in and merges guest cart
      const mergedCart = await cartService.mergeCart('guest_test_session', 'usr_test_user_a');

      expect(mergedCart.length).toBe(1);
      expect(mergedCart[0].product.productId).toBe('PROD_A1');

      // Guest cart should now be empty
      const guestCartAfter = await cartService.getCart('guest_test_session');
      expect(guestCartAfter.length).toBe(0);
    });

    it('User A cannot read User B orders', async () => {
      await orderTrackerService.trackAndSaveOrder({
        store: 'amazon',
        orderId: '402-1111111-2222222',
        productTitle: 'Secret Order for User A',
        totalAmount: 2499
      }, 'usr_test_user_a');

      const ordersB = await orderTrackerService.getOrders('usr_test_user_b');
      expect(ordersB.length).toBe(0);

      const ordersA = await orderTrackerService.getOrders('usr_test_user_a');
      expect(ordersA.length).toBe(1);
      expect(ordersA[0].orderId).toBe('402-1111111-2222222');
    });
  });

  describe('3. Voice Commands for Authentication (English, Hindi, Kannada)', () => {
    it('handles "who am i" in English, Hindi, and Kannada', () => {
      const en = commandRouter.matchRule('who am i', 'en');
      expect(en?.action).toBe('whoami');

      const hi = commandRouter.matchRule('mera account', 'hi');
      expect(hi?.action).toBe('whoami');

      const kn = commandRouter.matchRule('ನಾನು ಯಾರು', 'kn');
      expect(kn?.action).toBe('whoami');
    });

    it('handles "log out" in English, Hindi, and Kannada', () => {
      const en = commandRouter.matchRule('log out', 'en');
      expect(en?.action).toBe('logout');

      const hi = commandRouter.matchRule('logout karo', 'hi');
      expect(hi?.action).toBe('logout');

      const kn = commandRouter.matchRule('ಲಾಗ್ ಔಟ್', 'kn');
      expect(kn?.action).toBe('logout');
    });

    it('handles "login" in English, Hindi, and Kannada', () => {
      const en = commandRouter.matchRule('login please', 'en');
      expect(en?.action).toBe('login');

      const hi = commandRouter.matchRule('login karo', 'hi');
      expect(hi?.action).toBe('login');

      const kn = commandRouter.matchRule('ಲಾಗಿನ್ ಮಾಡಿ', 'kn');
      expect(kn?.action).toBe('login');
    });
  });
});
