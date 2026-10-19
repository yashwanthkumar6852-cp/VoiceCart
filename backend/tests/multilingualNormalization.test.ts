import { voiceNormalizer } from '../src/voice/normalize';
import { commandRouter } from '../src/voice/commandRouter';

describe('Multilingual Normalization & Voice Command Engine', () => {
  describe('Language & Script Detection', () => {
    it('detects native Kannada script', () => {
      const res = voiceNormalizer.detectLanguageAndScript('ಕಾರ್ಟ್ ತೆರೆ');
      expect(res.language).toBe('kn');
      expect(res.script).toBe('native');
    });

    it('detects native Hindi Devanagari script', () => {
      const res = voiceNormalizer.detectLanguageAndScript('कार्ट खोलो');
      expect(res.language).toBe('hi');
      expect(res.script).toBe('native');
    });

    it('detects Romanized Kannada (Kanglish)', () => {
      const res1 = voiceNormalizer.detectLanguageAndScript('cart ge serisu');
      expect(res1.language).toBe('kn');
      expect(res1.script).toBe('romanized');

      const res2 = voiceNormalizer.detectLanguageAndScript('nanna order ellide');
      expect(res2.language).toBe('kn');
      expect(res2.script).toBe('romanized');

      const res3 = voiceNormalizer.detectLanguageAndScript('kadime bele torisu');
      expect(res3.language).toBe('kn');
      expect(res3.script).toBe('romanized');
    });

    it('detects Romanized Hindi (Hinglish)', () => {
      const res1 = voiceNormalizer.detectLanguageAndScript('mera order kahan hai');
      expect(res1.language).toBe('hi');
      expect(res1.script).toBe('romanized');

      const res2 = voiceNormalizer.detectLanguageAndScript('cart me daalo');
      expect(res2.language).toBe('hi');
      expect(res2.script).toBe('romanized');

      const res3 = voiceNormalizer.detectLanguageAndScript('sasta dikhao');
      expect(res3.language).toBe('hi');
      expect(res3.script).toBe('romanized');
    });
  });

  describe('Number & Unit Normalization', () => {
    it('normalizes Hindi number words and digits', () => {
      expect(voiceNormalizer.normalizeNumbers('दो हज़ार रुपये')).toContain('2000');
      expect(voiceNormalizer.normalizeNumbers('पाँच सौ')).toContain('500');
      expect(voiceNormalizer.normalizeNumbers('do hazaar')).toContain('2000');
      expect(voiceNormalizer.normalizeNumbers('१५०००')).toContain('15000');
    });

    it('normalizes Kannada number words and digits', () => {
      expect(voiceNormalizer.normalizeNumbers('ಎರಡು ಸಾವಿರ ರೂಪಾಯಿ')).toContain('2000');
      expect(voiceNormalizer.normalizeNumbers('ಐದು ನೂರು')).toContain('500');
      expect(voiceNormalizer.normalizeNumbers('eradu saavira')).toContain('2000');
      expect(voiceNormalizer.normalizeNumbers('೨೦೦೦')).toContain('2000');
    });
  });

  describe('Normalization to English Queries', () => {
    it('normalizes Hindi search query to English preserving brand names', () => {
      const res = voiceNormalizer.normalize('दो हज़ार के अंदर boAt ईयरबड्स खोजो');
      expect(res.englishText.toLowerCase()).toContain('boat');
      expect(res.englishText.toLowerCase()).toContain('earbuds');
      expect(res.englishText).toContain('2000');
    });

    it('normalizes Kannada search query to English preserving brand names', () => {
      const res = voiceNormalizer.normalize('ಎರಡು ಸಾವಿರ ಒಳಗೆ boAt ಇಯರ್‌ಬಡ್ಸ್ ಹುಡುಕು');
      expect(res.englishText.toLowerCase()).toContain('boat');
      expect(res.englishText.toLowerCase()).toContain('earbuds');
      expect(res.englishText).toContain('2000');
    });

    it('normalizes Hinglish search query to English', () => {
      const res = voiceNormalizer.normalize('2000 ke andar wireless earbuds dikhao');
      expect(res.englishText.toLowerCase()).toContain('wireless earbuds');
      expect(res.englishText.toLowerCase()).toContain('under 2000');
    });
  });

  describe('Multilingual and Romanized Voice Commands Matching', () => {
    // 1. OPEN CART
    it('matches open cart across native and romanized forms', () => {
      const phrases = ['open cart', 'कार्ट खोलो', 'ಕಾರ್ಟ್ ತೆರೆಯಿರಿ', 'cart kholo', 'cart tegi'];
      phrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('open_cart');
      });
    });

    // 2. ADD TO CART
    it('matches add to cart across native and romanized forms', () => {
      const phrases = [
        'add to cart',
        'कार्ट में डालो',
        'ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು',
        'cart me daalo',
        'cart ge serisu'
      ];
      phrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('add_to_cart');
      });
    });

    // 3. CHEAPEST
    it('matches cheapest across native and romanized forms', () => {
      const phrases = [
        'show the cheapest',
        'सबसे सस्ता दिखाओ',
        'ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆಯದನ್ನು ತೋರಿಸು',
        'sasta dikhao',
        'kadime bele tori'
      ];
      phrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd).not.toBeNull();
        if (cmd?.action === 'add_to_cart') {
          expect(cmd.params.targetRef).toBe('cheapest');
        } else {
          expect(cmd?.action).toBe('search');
        }
      });
    });

    // 4. SEARCH
    it('matches search across native and romanized forms', () => {
      const phrases = ['find boAt earbuds', 'ढूंढो boAt earbuds', 'ಹುಡುಕು boAt earbuds', 'dhundo boAt earbuds', 'huduku boAt earbuds'];
      phrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('search');
        expect(cmd?.params.query).toBeDefined();
      });
    });

    // 5. PAY BY MODES
    it('matches payment methods across native and romanized forms', () => {
      const upiPhrases = ['pay by upi', 'UPI से पेमेंट करो', 'ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸು', 'UPI se pay karo'];
      upiPhrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('pay');
        expect(cmd?.params.paymentMethod).toBe('upi');
      });

      const codPhrases = ['pay cash on delivery', 'cash on delivery chahiye', 'COD ge hakku', 'ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ'];
      codPhrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('pay');
        expect(cmd?.params.paymentMethod).toBe('cod');
      });
    });

    // 6. TRACK ORDER
    it('matches track order across native and romanized forms', () => {
      const phrases = [
        'where is my order',
        'मेरा ऑर्डर कहाँ है',
        'ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ',
        'order track karo',
        'order track madu'
      ];
      phrases.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('track_order');
      });
    });

    // 7. LANGUAGE SWITCH BY VOICE
    it('matches language switching by voice', () => {
      const kannadaVoice = ['switch to Kannada', 'ಕನ್ನಡದಲ್ಲಿ ಮಾತಾಡು', 'kannada please'];
      kannadaVoice.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('change_language');
        expect(cmd?.params.language).toBe('kn');
      });

      const hindiVoice = ['switch to Hindi', 'हिंदी में बोलो', 'hindi please'];
      hindiVoice.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('change_language');
        expect(cmd?.params.language).toBe('hi');
      });

      const englishVoice = ['switch to English', 'speak in english', 'english please'];
      englishVoice.forEach((p) => {
        const cmd = commandRouter.matchRule(p);
        expect(cmd?.action).toBe('change_language');
        expect(cmd?.params.language).toBe('en');
      });
    });
  });
});
