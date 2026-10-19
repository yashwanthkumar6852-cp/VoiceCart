import { commandRouter } from '../src/voice/commandRouter';

describe('VoiceCart End-to-End Voice Flow & Booking State Machine Tests', () => {
  describe('1. Voice Search & Budget Extraction (EN, HI, KN)', () => {
    it('should parse English search query and budget correctly', () => {
      const res = commandRouter.matchRule('I want boAt earbuds under 2000');
      expect(res).not.toBeNull();
      expect(res?.action).toBe('search');
      expect(res?.params.maxBudget).toBe(2000);
      expect(res?.params.query?.toLowerCase()).toContain('boat earbuds');
    });

    it('should parse Hindi search query and budget correctly', () => {
      const res = commandRouter.matchRule('मुझे 2000 के अंदर boAt ईयरबड्स ढूंढो');
      expect(res).not.toBeNull();
      expect(res?.action).toBe('search');
      expect(res?.params.maxBudget).toBe(2000);
    });

    it('should parse Kannada search query and budget correctly', () => {
      const res = commandRouter.matchRule('ನನಗೆ 2000 ರ ಒಳಗೆ boAt ಇಯರ್‌ಬಡ್ಸ್ ಹುಡುಕು');
      expect(res).not.toBeNull();
      expect(res?.action).toBe('search');
      expect(res?.params.maxBudget).toBe(2000);
    });
  });

  describe('2. Voice Follow-up Q&A Rules (Battery, Price Comparison, Next Option, Specs)', () => {
    it('should match battery life follow-up queries across languages', () => {
      const en = commandRouter.matchRule('what is the battery life');
      expect(en?.action).toBe('get_battery_life');

      const hi = commandRouter.matchRule('बैटरी लाइफ कितनी है');
      expect(hi?.action).toBe('get_battery_life');

      const kn = commandRouter.matchRule('ಬ್ಯಾಟರಿ ಲೈಫ್ ಎಷ್ಟು');
      expect(kn?.action).toBe('get_battery_life');
    });

    it('should match store price comparison queries', () => {
      const en = commandRouter.matchRule('is it cheaper on flipkart');
      expect(en?.action).toBe('compare_prices');
      expect(en?.params.store).toBe('flipkart');

      const hi = commandRouter.matchRule('फ्लिपकार्ट पर सस्ता है क्या');
      expect(hi?.action).toBe('compare_prices');

      const kn = commandRouter.matchRule('ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ನಲ್ಲಿ ಬೆಲೆ ಎಷ್ಟು');
      expect(kn?.action).toBe('compare_prices');
    });

    it('should match next option / second option queries', () => {
      const en = commandRouter.matchRule('show the next one');
      expect(en?.action).toBe('show_next_option');

      const en2 = commandRouter.matchRule('compare with the second option');
      expect(en2?.action).toBe('show_next_option');

      const hi = commandRouter.matchRule('अगला विकल्प दिखाओ');
      expect(hi?.action).toBe('show_next_option');

      const kn = commandRouter.matchRule('ಮುಂದಿನ ಆಯ್ಕೆ ತೋರಿಸು');
      expect(kn?.action).toBe('show_next_option');
    });

    it('should match specifications query', () => {
      const en = commandRouter.matchRule('show the specifications');
      expect(en?.action).toBe('get_specifications');

      const hi = commandRouter.matchRule('स्पेसिफिकेशन दिखाओ');
      expect(hi?.action).toBe('get_specifications');

      const kn = commandRouter.matchRule('ವಿವರಣೆಗಳನ್ನು ತೋರಿಸು');
      expect(kn?.action).toBe('get_specifications');
    });
  });

  describe('3. Booking State Machine & Confirmation Flow', () => {
    it('should identify booking intents across English, Hindi, Kannada', () => {
      const en = commandRouter.matchRule('book it');
      expect(en?.action).toBe('buy');

      const en2 = commandRouter.matchRule('order this');
      expect(en2?.action).toBe('buy');

      const hi = commandRouter.matchRule('ऑर्डर बुक करो');
      expect(hi?.action).toBe('buy');

      const kn = commandRouter.matchRule('ಇದನ್ನು ಬುಕ್ ಮಾಡು');
      expect(kn?.action).toBe('buy');
    });

    it('should identify confirmation YES and NO in all 3 languages', () => {
      expect(commandRouter.matchRule('yes')?.action).toBe('confirm_yes');
      expect(commandRouter.matchRule('हाँ')?.action).toBe('confirm_yes');
      expect(commandRouter.matchRule('ಹೌದು')?.action).toBe('confirm_yes');

      expect(commandRouter.matchRule('no')?.action).toBe('confirm_no');
      expect(commandRouter.matchRule('नहीं')?.action).toBe('confirm_no');
      expect(commandRouter.matchRule('ಬೇಡ')?.action).toBe('confirm_no');
    });
  });

  describe('4. Cart and Post-Booking Commands', () => {
    it('should identify cart actions and navigation', () => {
      expect(commandRouter.matchRule('open cart')?.action).toBe('open_cart');
      expect(commandRouter.matchRule('increase quantity')?.action).toBe('increase_quantity');
      expect(commandRouter.matchRule('continue shopping')?.action).toBe('continue_shopping');
      expect(commandRouter.matchRule('proceed to payment')?.action).toBe('proceed_to_payment');
    });

    it('should identify order tracking and cancellation commands', () => {
      expect(commandRouter.matchRule('where is my order')?.action).toBe('track_order');
      expect(commandRouter.matchRule('cancel my order')?.action).toBe('cancel_order');
      expect(commandRouter.matchRule('buy it again')?.action).toBe('buy_again');
    });

    it('should reject sensitive information by voice', () => {
      const pinAttempt = commandRouter.matchRule('my upi pin is 1234');
      expect(pinAttempt?.reply).toContain('security');

      const pwdAttempt = commandRouter.matchRule('enter my password');
      expect(pwdAttempt?.reply).toContain('security');
    });
  });
});
