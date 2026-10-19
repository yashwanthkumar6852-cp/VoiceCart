import { dbClient } from '../src/db/dbClient';
import { authService } from '../src/services/authService';
import { cartService } from '../src/services/cartService';
import { orderTrackerService } from '../src/services/orderTrackerService';
import { Product } from '../src/types/product';

describe('Auth & Database Persistence Integration Tests', () => {
  jest.setTimeout(20000);
  const testEmail = 'persist_user_' + Date.now() + '@voicecart.app';
  const testPassword = 'Password123!';
  let createdUserId: string;

  it('1. Signs up a user and persists into database', async () => {
    const signupRes = await authService.signup({
      name: 'Persist Test User',
      email: testEmail,
      password: testPassword,
      language: 'en'
    });

    expect(signupRes.session.user).toBeDefined();
    expect(signupRes.session.user.email).toBe(testEmail.toLowerCase());
    createdUserId = signupRes.session.user.id;

    // Verify row exists directly in database
    const dbUser = await dbClient.findUserById(createdUserId);
    expect(dbUser).toBeDefined();
    expect(dbUser?.email).toBe(testEmail.toLowerCase());
    expect(dbUser?.passwordHash).not.toBe(testPassword);
    expect(dbUser?.passwordHash?.startsWith('$2')).toBe(true); // bcrypt hash prefix
  });

  it('2. Normalizes identifier (handles casing and whitespace in email and mobile)', async () => {
    // Attempt login with extra spaces and upper casing
    const loginRes = await authService.login({
      identifier: `   ${testEmail.toUpperCase()}   `,
      password: testPassword,
      rememberMe: true
    });

    expect(loginRes.session.user.id).toBe(createdUserId);
    expect(loginRes.session.accessToken).toBeDefined();
    expect(loginRes.refreshToken).toBeDefined();
  });

  it('3. Fails gracefully with helpful diagnostic messages', async () => {
    // Unknown email
    await expect(authService.login({
      identifier: 'nonexistent_person_9999@voicecart.app',
      password: testPassword
    })).rejects.toThrow('No account found with this email or mobile number. Create one?');

    // Wrong password
    await expect(authService.login({
      identifier: testEmail,
      password: 'WrongPassword999!'
    })).rejects.toThrow('Wrong password. Try again or reset it.');
  });

  it('4. Handles duplicate signup prevention', async () => {
    await expect(authService.signup({
      name: 'Duplicate User',
      email: `  ${testEmail.toUpperCase()}  `,
      password: 'AnotherPassword!'
    })).rejects.toThrow('An account with this email already exists. Please sign in instead.');
  });

  it('5. Enforces rate limiting and account lockout after 5 failed attempts', async () => {
    const lockoutEmail = 'lockout_test_' + Date.now() + '@voicecart.app';
    await authService.signup({
      name: 'Lockout User',
      email: lockoutEmail,
      password: 'ValidPassword123!'
    });

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login({ identifier: lockoutEmail, password: 'WrongPassword!' });
      } catch (err) {
        // expected wrong password
      }
    }

    // 6th attempt should trigger lockout message
    await expect(authService.login({
      identifier: lockoutEmail,
      password: 'ValidPassword123!'
    })).rejects.toThrow(/Too many failed login attempts/);
  });

  it('6. Supports forgot password token generation & password reset', async () => {
    const resetRes = await authService.forgotPassword(testEmail);
    expect(resetRes.resetToken).toBeDefined();

    const newPassword = 'NewSecretPassword2026!';
    await authService.resetPassword(resetRes.resetToken!, newPassword);

    // Old password should now fail
    await expect(authService.login({
      identifier: testEmail,
      password: testPassword
    })).rejects.toThrow('Wrong password. Try again or reset it.');

    // New password should succeed
    const freshLogin = await authService.login({
      identifier: testEmail,
      password: newPassword
    });
    expect(freshLogin.session.user.id).toBe(createdUserId);
  });

  it('7. Seeds & validates Quick 1-Click Demo Login user', async () => {
    const demoUser = await authService.seedDemoUser();
    expect(demoUser).toBeDefined();
    expect(demoUser.email).toBe('demo@voicecart.app');

    const demoLoginRes = await authService.login({
      identifier: 'demo@voicecart.app',
      password: 'Demo@VoiceCart2026!'
    });
    expect(demoLoginRes.session.user.email).toBe('demo@voicecart.app');
    expect(demoLoginRes.session.accessToken).toBeDefined();
  });

  it('8. Supports Google auth user creation and email matching', async () => {
    const googleProfile = {
      googleId: 'goog_123456789',
      email: 'google_user_' + Date.now() + '@gmail.com',
      name: 'Google User',
      avatarUrl: 'https://lh3.googleusercontent.com/a/test'
    };

    const googleAuthRes = await authService.googleLogin(googleProfile);
    expect(googleAuthRes.session.user.email).toBe(googleProfile.email.toLowerCase());
    expect(googleAuthRes.session.user.name).toBe(googleProfile.name);
    expect(googleAuthRes.session.user.avatarUrl).toBe(googleProfile.avatarUrl);
  });

  it('9. Links cart, orders, and addresses permanently to userId in database', async () => {
    const mockProduct: Product = {
      productId: 'prod_99',
      title: 'VoiceCart Persistent Smartphone',
      price: 19999,
      mrp: 24999,
      discountPct: 20,
      seller: 'RetailNet',
      affiliateUrl: 'https://flipkart.com/item',
      store: 'flipkart',
      imageUrl: 'https://example.com/phone.jpg',
      rating: 4.5,
      ratingCount: 120,
      deliveryDays: 2,
      shippingFee: 0,
      productUrl: 'https://flipkart.com/item',
      inStock: true
    };

    // 1. Add item to cart for this user
    await cartService.addToCart(mockProduct, 2, createdUserId);

    const userCart = await cartService.getCart(createdUserId);
    expect(userCart.length).toBeGreaterThanOrEqual(1);
    expect(userCart[0].product.title).toBe('VoiceCart Persistent Smartphone');

    // 2. Create an order for this user
    const order = await orderTrackerService.trackAndSaveOrder({
      store: 'flipkart',
      orderId: 'OD_PERSIST_9999',
      productTitle: 'VoiceCart Persistent Smartphone',
      totalAmount: 39998
    }, createdUserId);

    expect(order.id).toBeDefined();
    expect(order.userId).toBe(createdUserId);

    // Verify order is retrievable by userId
    const userOrders = await orderTrackerService.getOrders(createdUserId);
    expect(userOrders.length).toBeGreaterThanOrEqual(1);
    expect(userOrders[0].orderId).toBe('OD_PERSIST_9999');
    expect(userOrders[0].totalAmount).toBe(39998);
  });
});
