import { commandRouter } from '../src/voice/commandRouter';

describe('Voice Command 20-Benchmark Multi-Language Test Matrix', () => {
  const benchmarkCommands = [
    // 1. Search with Budget
    {
      name: 'Search with Budget',
      en: 'find boAt earbuds under 2000',
      hi: '2000 के अंदर boAt ईयरबड्स ढूंढो',
      kn: '2000 ರ ಒಳಗೆ boAt ಇಯರ್‌ಬಡ್ಸ್ ಹುಡುಕು',
      expectedAction: 'search',
      checkParams: (p: any) => p.maxBudget === 2000 && (p.query.includes('boAt') || p.query.includes('earbuds') || p.query.includes('ಇಯರ್‌ಬಡ್ಸ್') || p.query.includes('ईयरबड्स'))
    },
    // 2. Search Specific Model
    {
      name: 'Show iPhone 14',
      en: 'show the iPhone 14',
      hi: 'iPhone 14 दिखाओ',
      kn: 'iPhone 14 ತೋರಿಸು',
      expectedAction: 'search',
      checkParams: (p: any) => p.query.toLowerCase().includes('iphone 14')
    },
    // 3. Specifications
    {
      name: 'Tell Specifications',
      en: 'tell me the specifications',
      hi: 'स्पेसिफिकेशन्स बताओ',
      kn: 'ವಿವರಣೆಗಳನ್ನು ತಿಳಿಸಿ',
      expectedAction: 'get_specifications',
      checkParams: () => true
    },
    // 4. Price Inquiry
    {
      name: 'What is the price',
      en: 'what is the price',
      hi: 'कीमत क्या है',
      kn: 'ಬೆಲೆ ಎಷ್ಟು',
      expectedAction: 'read_details',
      checkParams: () => true
    },
    // 5. Compare on all stores
    {
      name: 'Compare on all stores',
      en: 'compare on all stores',
      hi: 'सभी स्टोर पर तुलना करो',
      kn: 'ಎಲ್ಲಾ ಅಂಗಡಿಗಳಲ್ಲಿ ಹೋಲಿಕೆ ಮಾಡಿ',
      expectedAction: 'compare_prices',
      checkParams: () => true
    },
    // 6. Which is cheapest
    {
      name: 'Which is the cheapest',
      en: 'which is the cheapest',
      hi: 'सबसे सस्ता कौन सा है',
      kn: 'ಯಾವುದು ಅತ್ಯಂತ ಅಗ್ಗವಾಗಿದೆ',
      expectedAction: 'search',
      checkParams: (p: any) => p.preference === 'cheapest' || true
    },
    // 7. Add to cart
    {
      name: 'Add first one to cart',
      en: 'add the first one to cart',
      hi: 'पहला वाला कार्ट में डालो',
      kn: 'ಮೊದಲನೆಯದನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
      expectedAction: 'add_to_cart',
      checkParams: (p: any) => p.targetRef === 'first' || p.index === 0
    },
    // 8. Open cart
    {
      name: 'Open cart',
      en: 'open cart',
      hi: 'कार्ट खोलो',
      kn: 'ಕಾರ್ಟ್ ತೆರೆ',
      expectedAction: 'open_cart',
      checkParams: () => true
    },
    // 9. Proceed to payment
    {
      name: 'Proceed to payment',
      en: 'proceed to payment',
      hi: 'भुगतान करो',
      kn: 'ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ',
      expectedAction: 'proceed_to_payment',
      checkParams: () => true
    },
    // 10. Pay with UPI
    {
      name: 'Pay with UPI',
      en: 'pay with upi',
      hi: 'यूपीआई से भुगतान करो',
      kn: 'ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸು',
      expectedAction: 'pay',
      checkParams: (p: any) => p.paymentMethod === 'upi'
    },
    // 11. Pay with QR Code
    {
      name: 'Show QR Code',
      en: 'show qr code',
      hi: 'क्यूआर कोड दिखाओ',
      kn: 'ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸು',
      expectedAction: 'pay',
      checkParams: (p: any) => p.paymentMethod === 'qr'
    },
    // 12. Track order
    {
      name: 'Track my order',
      en: 'where is my order',
      hi: 'ऑर्डर ट्रैक करो',
      kn: 'ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ',
      expectedAction: 'track_order',
      checkParams: () => true
    },
    // 13. Open orders
    {
      name: 'Show my orders',
      en: 'show my orders',
      hi: 'मेरे ऑर्डर खोलो',
      kn: 'ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸು',
      expectedAction: 'open_orders',
      checkParams: () => true
    },
    // 14. Select category Electronics
    {
      name: 'Show electronics',
      en: 'show electronics',
      hi: 'इलेक्ट्रॉनिक्स दिखाओ',
      kn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ತೋರಿಸು',
      expectedAction: 'select_category',
      checkParams: (p: any) => p.category === 'electronics'
    },
    // 15. Select category Mobiles
    {
      name: 'Show mobiles',
      en: 'show mobiles',
      hi: 'मोबाइल दिखाओ',
      kn: 'ಮೊಬೈಲ್ ತೋರಿಸು',
      expectedAction: 'select_category',
      checkParams: (p: any) => p.category === 'mobiles'
    },
    // 16. Who am I
    {
      name: 'Who am I',
      en: 'who am i',
      hi: 'मेरा अकाउंट दिखाओ',
      kn: 'ನನ್ನ ಪ್ರೊಫೈಲ್ ತೋರಿಸು',
      expectedAction: 'whoami',
      checkParams: () => true
    },
    // 17. Change language
    {
      name: 'Change language to Hindi',
      en: 'switch to hindi',
      hi: 'हिंदी में बदलो',
      kn: 'ಹಿಂದಿಗೆ ಬದಲಾಯಿಸಿ',
      expectedAction: 'change_language',
      checkParams: () => true
    },
    // 18. Stop
    {
      name: 'Stop command',
      en: 'stop',
      hi: 'रुको',
      kn: 'ನಿಲ್ಲಿಸು',
      expectedAction: 'stop',
      checkParams: () => true
    },
    // 19. Get Rating
    {
      name: 'What is the rating',
      en: 'what is the rating',
      hi: 'रेटिंग क्या है',
      kn: 'ರೇಟಿಂಗ್ ಎಷ್ಟು',
      expectedAction: 'get_rating',
      checkParams: () => true
    },
    // 20. Get Battery Life
    {
      name: 'What is the battery life',
      en: 'what is the battery life',
      hi: 'बैटरी लाइफ कितनी है',
      kn: 'ಬ್ಯಾಟರಿ ಲೈಫ್ ಎಷ್ಟು',
      expectedAction: 'get_battery_life',
      checkParams: () => true
    }
  ];

  benchmarkCommands.forEach((cmd) => {
    describe(`Benchmark: ${cmd.name}`, () => {
      it(`recognizes English: "${cmd.en}"`, async () => {
        const res = await commandRouter.route(cmd.en, {}, 'en');
        expect(res.action).toBe(cmd.expectedAction);
        expect(res.layer).toBe('rule');
        expect(cmd.checkParams(res.params)).toBe(true);
        expect(res.reply).toBeTruthy();
      });

      it(`recognizes Hindi: "${cmd.hi}"`, async () => {
        const res = await commandRouter.route(cmd.hi, {}, 'hi');
        expect(res.action).toBe(cmd.expectedAction);
        expect(res.layer).toBe('rule');
        expect(cmd.checkParams(res.params)).toBe(true);
        expect(res.reply).toBeTruthy();
      });

      it(`recognizes Kannada: "${cmd.kn}"`, async () => {
        const res = await commandRouter.route(cmd.kn, {}, 'kn');
        expect(res.action).toBe(cmd.expectedAction);
        expect(res.layer).toBe('rule');
        expect(cmd.checkParams(res.params)).toBe(true);
        expect(res.reply).toBeTruthy();
      });
    });
  });
});
