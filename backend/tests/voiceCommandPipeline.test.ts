import { commandRouter } from '../src/voice/commandRouter';

describe('Voice Command Pipeline - Two-Layer Command Router', () => {
  describe('Rule Layer - Normalization', () => {
    it('normalizes lowercase, punctuation, and number words in EN, HI, KN', () => {
      expect(commandRouter.normalize('  Show me the FIRST one!  ')).toBe('show me the 1st one');
      expect(commandRouter.normalize('add two items under 500?')).toBe('add 2 items under 500');
      expect(commandRouter.normalize('पहला आइटम हटाओ')).toBe('1st आइटम हटाओ');
      expect(commandRouter.normalize('ಎರಡನೇ ಆಯ್ಕೆ ತೋರಿಸು')).toBe('2nd ಆಯ್ಕೆ ತೋರಿಸು');
    });
  });

  describe('Rule Layer - 10+ Phrases per Action across English, Hindi & Kannada', () => {
    // 1. OPEN CART
    it('matches open_cart across English, Hindi, and Kannada', () => {
      const phrases = [
        'open cart',
        'go to cart',
        'show cart',
        'view my cart',
        'open shopping cart',
        'open basket',
        'कार्ट खोलो',
        'मेरा कार्ट दिखाओ',
        'कार्ट पर जाओ',
        'ಕಾರ್ಟ್ ತೆರೆ',
        'ನನ್ನ ಕಾರ್ಟ್ ತೋರಿಸು',
        'ಕಾರ್ಟ್‌ಗೆ ಹೋಗು'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('open_cart');
        expect(res?.layer).toBe('rule');
        expect(res?.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    // 2. OPEN ORDERS
    it('matches open_orders across English, Hindi, and Kannada', () => {
      const phrases = [
        'open orders',
        'show my orders',
        'view order history',
        'past orders',
        'my purchases',
        'ऑर्डर दिखाओ',
        'मेरे ऑर्डर खोलो',
        'पुरानी खरीदारी दिखाओ',
        'ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸು',
        'ನನ್ನ ಆರ್ಡರ್ ತೆರೆ',
        'ಹಿಂದಿನ ಖರೀದಿಗಳು'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('open_orders');
      });
    });

    // 3. OPEN HOME
    it('matches open_home across English, Hindi, and Kannada', () => {
      const phrases = [
        'go home',
        'open home',
        'back to home',
        'go to homepage',
        'main screen',
        'होम पर जाओ',
        'होम स्क्रीन खोलो',
        'मुख्य पृष्ठ',
        'ಮುಖಪುಟಕ್ಕೆ ಹೋಗು',
        'ಹೋಮ್ ಸ್ಕ್ರೀನ್ ತೆರೆ'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('open_home');
      });
    });

    // 4. OPEN SETTINGS
    it('matches open_settings across English, Hindi, and Kannada', () => {
      const phrases = [
        'open settings',
        'show settings',
        'go to preferences',
        'app settings',
        'change preferences',
        'सेटिंग्स खोलो',
        'सेटिंग्स दिखाओ',
        'मेरी सेटिंग्स',
        'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆ',
        'ಸೆಟ್ಟಿಂಗ್ಸ್ ತೋರಿಸು'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('open_settings');
      });
    });

    // 5. ADD TO CART (with reference resolution)
    it('matches add_to_cart with ordinals and references', () => {
      const testCases = [
        { phrase: 'add this to cart', ref: 'this' },
        { phrase: 'add the best to cart', ref: 'best' },
        { phrase: 'add the cheapest to cart', ref: 'cheapest' },
        { phrase: 'add lowest price to cart', ref: 'cheapest' },
        { phrase: 'add first item to cart', ref: 'first' },
        { phrase: 'add second one to cart', ref: 'second' },
        { phrase: 'add Flipkart one to cart', store: 'flipkart' },
        { phrase: 'add Amazon product to cart', store: 'amazon' },
        { phrase: 'इसे कार्ट में डालो', ref: 'this' },
        { phrase: 'सबसे सस्ता कार्ट में जोड़ो', ref: 'cheapest' },
        { phrase: 'ಅತ್ಯುತ್ತಮವಾದದ್ದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು', ref: 'best' },
        { phrase: 'ಕಡಿಮೆ ಬೆಲೆಯದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು', ref: 'cheapest' }
      ];

      testCases.forEach(({ phrase, ref, store }) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('add_to_cart');
        if (ref) expect(res?.params.targetRef).toBe(ref);
        if (store) expect(res?.params.store).toBe(store);
      });
    });

    // 6. REMOVE FROM CART
    it('matches remove_from_cart in English, Hindi, and Kannada', () => {
      const phrases = [
        'remove item',
        'remove this item',
        'remove the first item',
        'delete item from cart',
        'remove from basket',
        'आइटम हटाओ',
        'कार्ट से निकालो',
        'पहला आइटम हटा दो',
        'ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆ',
        'ಮೊದಲ ವಸ್ತುವನ್ನು ತೆಗೆಯಿರಿ',
        'ತೆಗೆದುಹಾಕು'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('remove_from_cart');
      });
    });

    // 7. BUY / CHECKOUT
    it('matches buy / checkout in English, Hindi, and Kannada', () => {
      const phrases = [
        'buy this',
        'buy now',
        'place order',
        'proceed to checkout',
        'checkout on amazon',
        'checkout on flipkart',
        'इसे खरीदो',
        'ऑर्डर बुक करो',
        'चेकआउट करो',
        'ಇದನ್ನು ಖರೀದಿಸು',
        'ಆರ್ಡರ್ ಮಾಡು',
        'ಈಗಲೇ ಖರೀದಿಸಿ'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('buy');
      });
    });

    // 8. PAYMENT MODES (cod, upi, qr, wallet, card, netbanking)
    it('matches pay with specific payment modes', () => {
      const cases = [
        { phrase: 'pay cash on delivery', mode: 'cod' },
        { phrase: 'pay with cod', mode: 'cod' },
        { phrase: 'pay with upi', mode: 'upi' },
        { phrase: 'pay via google pay', mode: 'upi' },
        { phrase: 'show qr code', mode: 'qr' },
        { phrase: 'scan qr code', mode: 'qr' },
        { phrase: 'pay by card', mode: 'card' },
        { phrase: 'pay with credit card', mode: 'card' },
        { phrase: 'pay with wallet', mode: 'wallet' },
        { phrase: 'pay with paytm wallet', mode: 'wallet' },
        { phrase: 'pay via netbanking', mode: 'netbanking' },
        { phrase: 'यूपीआई से भुगतान करो', mode: 'upi' },
        { phrase: 'कैश ऑन डिलीवरी से भुगतान करो', mode: 'cod' },
        { phrase: 'क्यूआर कोड दिखाओ', mode: 'qr' },
        { phrase: 'ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸು', mode: 'upi' },
        { phrase: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸು', mode: 'qr' },
        { phrase: 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ ಪಾವತಿ', mode: 'cod' }
      ];

      cases.forEach(({ phrase, mode }) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('pay');
        expect(res?.params.paymentMethod).toBe(mode);
      });
    });

    // 9. TRACK ORDER
    it('matches track_order in English, Hindi, and Kannada', () => {
      const phrases = [
        'where is my order',
        'track order',
        'track my package',
        'order status',
        'where is my delivery',
        'मेरा ऑर्डर कहाँ है',
        'ऑर्डर ट्रैक करो',
        'डिलीवरी की स्थिति क्या है',
        'ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ',
        'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡು',
        'ಡೆಲಿವರಿ ಸ್ಥಿತಿ ತಿಳಿಸಿ'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(res?.action).toBe('track_order');
      });
    });

    // 10. READ DETAILS / PRICE
    it('matches read_details in English, Hindi, and Kannada', () => {
      const phrases = [
        'read the details',
        'tell me the price',
        'show product details',
        'what is the price',
        'read specs',
        'कीमत बताओ',
        'विवरण पढ़ो',
        'प्राइस क्या है',
        'ಬೆಲೆ ಎಷ್ಟು',
        'ವಿವರಗಳನ್ನು ಓದಿ',
        'ಉತ್ಪನ್ನ ವಿವರ ತಿಳಿಸಿ'
      ];
      phrases.forEach((phrase) => {
        const res = commandRouter.matchRule(phrase);
        expect(res).not.toBeNull();
        expect(['read_details', 'get_specifications']).toContain(res?.action);
      });
    });

    // 11. CHANGE LANGUAGE, GO BACK, STOP, HELP
    it('matches navigation & utility controls', () => {
      expect(commandRouter.matchRule('switch to hindi')?.action).toBe('change_language');
      expect(commandRouter.matchRule('switch to kannada')?.action).toBe('change_language');
      expect(commandRouter.matchRule('switch to english')?.action).toBe('change_language');
      expect(commandRouter.matchRule('go back')?.action).toBe('go_back');
      expect(commandRouter.matchRule('stop')?.action).toBe('stop');
      expect(commandRouter.matchRule('help me')?.action).toBe('help');
    });

    // 12. SEARCH / PRODUCT COMPARISON
    it('matches search with budget and query extraction', () => {
      const res1 = commandRouter.matchRule('find wireless earbuds under 2000');
      expect(res1?.action).toBe('search');
      expect(res1?.params.query).toContain('wireless earbuds');
      expect(res1?.params.maxBudget).toBe(2000);

      const res2 = commandRouter.matchRule('search running shoes under 1500');
      expect(res2?.action).toBe('search');
      expect(res2?.params.query).toContain('running shoes');
      expect(res2?.params.maxBudget).toBe(1500);

      const res3 = commandRouter.matchRule('2000 के अंदर ईयरबड्स खोजो');
      expect(res3?.action).toBe('search');
    });
  });

  describe('Mixed-Language Sentences & Transliteration', () => {
    it('handles mixed-language voice queries gracefully', () => {
      expect(commandRouter.matchRule('cart me dalo')?.action).toBe('add_to_cart');
      expect(commandRouter.matchRule('UPI se payment karo')?.action).toBe('pay');
      expect(commandRouter.matchRule('cheapest earbuds dikhao')?.action).toBe('search');
      expect(commandRouter.matchRule('first item delete karo')?.action).toBe('remove_from_cart');
    });
  });

  describe('End-to-End Voice Scenario Simulation', () => {
    it('executes full sequence: Search -> Add Cheapest -> Open Cart -> Pay with UPI -> Track Order', async () => {
      // Step 1: User says "search boAt earbuds under 2000"
      const step1 = await commandRouter.route('search boAt earbuds under 2000');
      expect(step1.action).toBe('search');
      expect(step1.params.maxBudget).toBe(2000);

      // Step 2: User says "add the cheapest to cart"
      const step2 = await commandRouter.route('add the cheapest to cart');
      expect(step2.action).toBe('add_to_cart');
      expect(step2.params.targetRef).toBe('cheapest');

      // Step 3: User says "open cart"
      const step3 = await commandRouter.route('open cart');
      expect(step3.action).toBe('open_cart');

      // Step 4: User says "pay with UPI"
      const step4 = await commandRouter.route('pay with UPI');
      expect(step4.action).toBe('pay');
      expect(step4.params.paymentMethod).toBe('upi');

      // Step 5: User says "where is my order"
      const step5 = await commandRouter.route('where is my order');
      expect(step5.action).toBe('track_order');
    });
  });
});
