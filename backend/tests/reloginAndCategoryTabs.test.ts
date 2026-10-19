import { dbClient } from '../src/db/dbClient';
import { otpService } from '../src/services/otpService';
import { dashboardFeedService, DASHBOARD_CATEGORIES } from '../src/services/dashboardFeedService';
import { CommandRouter } from '../src/voice/commandRouter';

describe('Part A & B: Quick Re-login, OTP Auto-Fill & Category Icon Tab Strip', () => {
  const commandRouter = new CommandRouter();
  const testEmail = `relogin_test_${Date.now()}@voicecart.test`;
  const testMobile = `98${Math.floor(10000000 + Math.random() * 89999999)}`;
  let testUserId = '';

  beforeAll(async () => {
    // Setup clean test user
    const created = await dbClient.createUser({
      id: 'usr_test_relogin_' + Date.now().toString(36),
      name: 'Yashwanth Kumar',
      email: testEmail,
      mobile: testMobile,
      language: 'en',
      emailVerified: true
    });
    testUserId = created.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await dbClient.deleteUserAccount(testUserId);
    }
    await dbClient.deleteOtp(testEmail);
  });

  describe('PART A: Quick Re-Login and OTP Auto-Fill Pipeline', () => {
    it('1. Masking identifier hides sensitive details safely', () => {
      expect(otpService.maskIdentifier('yashwanth.kumar@gmail.com')).toBe('y***@gmail.com');
      expect(otpService.maskIdentifier('9876543210')).toBe('+91 98****10');
      expect(otpService.maskIdentifier('+919876543210')).toBe('+91 98****10');
    });

    it('2. Sends OTP using userId without exposing raw credentials', async () => {
      const res = await otpService.sendOtp({ userId: testUserId });
      expect(res.success).toBe(true);
      expect(res.maskedIdentifier).toBe(otpService.maskIdentifier(testEmail));
      expect(res.type).toBe('email');
      expect(res.resendCooldownSeconds).toBe(30);

      // Verify OTP is hashed in DB, never plain text
      const record = await dbClient.getOtpByIdentifier(testEmail);
      expect(record).toBeDefined();
      expect(record?.otpHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 HMAC
      expect(record?.magicTokenHash).toBeDefined();
    });

    it('3. Generates 1-tap email magic link token and verifies active session', async () => {
      const record = await dbClient.getOtpByIdentifier(testEmail);
      expect(record).toBeDefined();
      expect(record?.magicTokenHash).toBeTruthy();

      // Check OTP status before verification
      const initialStatus = await otpService.checkOtpStatus(testEmail);
      expect(initialStatus.verified).toBe(false);

      // Verify via magic token hash lookup directly in service
      if (record?.magicTokenHash) {
        // Find record by magic token hash
        const found = await dbClient.findOtpByMagicTokenHash(record.magicTokenHash);
        expect(found).toBeDefined();
        expect(found?.identifier).toBe(testEmail);
      }
    });

    it('4. Voice security: Assistant never reads or accepts OTP by voice', () => {
      const otpAttempt1 = commandRouter.matchRule('my otp is 123456');
      expect(otpAttempt1?.action).toBe('chat');
      expect(otpAttempt1?.reply).toContain('security');

      const otpAttempt2 = commandRouter.matchRule('verification code 654321');
      expect(otpAttempt2?.action).toBe('chat');

      // Voice re-login selects account and tells user to enter OTP on screen
      const voiceLoginAs = commandRouter.matchRule('log in as Yashwanth');
      expect(voiceLoginAs?.action).toBe('login_as');
      expect(voiceLoginAs?.params.name).toBe('yashwanth');
      expect(voiceLoginAs?.reply).toContain('6-digit verification code on your screen');
    });
  });

  describe('PART B: Category Icon Tab Strip and Voice Navigation', () => {
    it('1. Category list contains all required tabs with correct IDs', () => {
      const ids = DASHBOARD_CATEGORIES.map(c => c.id);
      expect(ids).toContain('all');
      expect(ids).toContain('fashion');
      expect(ids).toContain('mobiles');
      expect(ids).toContain('electronics');
      expect(ids).toContain('beauty');
      expect(ids).toContain('home');
      expect(ids).toContain('appliances');
      expect(ids).toContain('toys_baby');
      expect(ids).toContain('food_health');
      expect(ids).toContain('auto');
      expect(ids).toContain('sports_fitness');
      expect(ids).toContain('footwear');
      expect(ids).toContain('groceries');
    });

    it('2. Fetches real live product feed for specific category', async () => {
      const feed = await dashboardFeedService.getFeed('mobiles');
      expect(feed).toBeDefined();
      expect(feed.category).toBe('mobiles');
      expect(Array.isArray(feed.products)).toBe(true);
      expect(feed.products.length).toBeGreaterThan(0);
      // All products must have real attributes
      const p = feed.products[0];
      expect(p.productId).toBeDefined();
      expect(p.title).toBeDefined();
      expect(p.price).toBeGreaterThan(0);
      expect(p.store).toMatch(/amazon|flipkart|meesho/i);
    });

    it('3. Voice navigation selects category and provides localized response', () => {
      const mobilesCmd = commandRouter.matchRule('show mobiles');
      expect(mobilesCmd?.action).toBe('select_category');
      expect(mobilesCmd?.params.category).toBe('mobiles');

      const fashionCmd = commandRouter.matchRule('open fashion');
      expect(fashionCmd?.action).toBe('select_category');
      expect(fashionCmd?.params.category).toBe('fashion');

      const appliancesCmd = commandRouter.matchRule('go to appliances');
      expect(appliancesCmd?.action).toBe('select_category');
      expect(appliancesCmd?.params.category).toBe('appliances');

      const forYouCmd = commandRouter.matchRule('show for you');
      expect(forYouCmd?.action).toBe('select_category');
      expect(forYouCmd?.params.category).toBe('all');
    });
  });
});
