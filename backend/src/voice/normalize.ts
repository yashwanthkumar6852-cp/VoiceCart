export type ActiveLanguage = 'en' | 'hi' | 'kn';
export type SupportedLanguageSelection = 'auto' | 'en' | 'hi' | 'kn';
export type ScriptType = 'native' | 'romanized';

export interface NormalizationResult {
  englishText: string;
  originalText: string;
  language: ActiveLanguage;
  script: ScriptType;
}

export class VoiceNormalizer {
  /**
   * Detects the language and script type of the spoken / typed transcript.
   */
  public detectLanguageAndScript(
    text: string,
    preferredLanguage: SupportedLanguageSelection = 'auto'
  ): { language: ActiveLanguage; script: ScriptType } {
    if (!text || !text.trim()) {
      return {
        language: preferredLanguage === 'auto' ? 'en' : preferredLanguage,
        script: 'romanized'
      };
    }

    // 1. Native script detection (Devanagari / Kannada)
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return { language: 'kn', script: 'native' };
    }
    if (/[\u0900-\u097F]/.test(text)) {
      return { language: 'hi', script: 'native' };
    }

    // 2. Romanized Hindi (Hinglish) keyword checks
    const lower = text.toLowerCase();
    const hinglishKeywords = [
      'kholo', 'dikhao', 'batao', 'daalo', 'dalo', 'jodo', 'chahiye', 'paisa',
      'bhugtan', 'sasta', 'saste', 'sabse', 'pehla', 'doosra', 'teesra', 'kharido',
      'hatao', 'dhundo', 'khojo', 'hazaar', 'hazar', 'sau', 'rupya', 'rupaye',
      'ke andar', 'ke niche', 'mera', 'meri', 'kardo', 'mat karo', 'ruko', 'chup',
      'madad', 'kya kar sakte ho', 'bhasha', 'baat karo', 'bolo', 'achha', 'badhiya'
    ];

    const hasHinglish = hinglishKeywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    });

    if (hasHinglish) {
      return { language: 'hi', script: 'romanized' };
    }

    // 3. Romanized Kannada (Kanglish) keyword checks
    const kanglishKeywords = [
      'torisu', 'nodisu', 'nodi', 'nodona', 'beku', 'serisu', 'elli', 'madu', 'pavati', 'nanna',
      'matte', 'kadime', 'tege', 'kharidisu', 'kharidi', 'ondane', 'eradaney',
      'eshtu', 'huduku', 'saavira', 'savira', 'nooru', 'roopayi', 'olage',
      'haaku', 'haku', 'tere', 'tegi', 'tori', 'aayke', 'nodbeku', 'matanadu',
      'heli', 'sahaya', 'enu', 'nillu', 'nillisu', 'atyuttama', 'uttam', 'bele', 'daravannu'
    ];

    const hasKanglish = kanglishKeywords.some((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    });

    if (hasKanglish) {
      return { language: 'kn', script: 'romanized' };
    }

    // 4. Default to explicit user selection or English
    const fallbackLang = preferredLanguage === 'auto' ? 'en' : preferredLanguage;
    return { language: fallbackLang, script: 'romanized' };
  }

  /**
   * Normalizes number words and Indian digits across English, Hindi, and Kannada.
   */
  public normalizeNumbers(text: string): string {
    if (!text) return '';
    let res = text;

    // Convert Hindi Devanagari numerals ०-९ to 0-9
    res = res.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));

    // Convert Kannada numerals ೦-೯ to 0-9
    res = res.replace(/[೦-೯]/g, (d) => String(d.charCodeAt(0) - 0x0ce6));

    // Compound replacements (Direct replacements for non-ASCII Unicode words)
    const directUnicodeCompounds: [RegExp, string][] = [
      [/पंद्रह हज़ार|पंद्रह हजार/g, '15000'],
      [/दस हज़ार|दस हजार/g, '10000'],
      [/पाँच हज़ार|पाँच हजार|पांच हजार/g, '5000'],
      [/चार हज़ार|चार हजार/g, '4000'],
      [/तीन हज़ार|तीन हजार/g, '3000'],
      [/दो हज़ार|दो हजार/g, '2000'],
      [/डेढ़ हज़ार|डेढ़ हजार/g, '1500'],
      [/एक हज़ार|एक हजार/g, '1000'],
      [/नौ सौ/g, '900'],
      [/आठ सौ/g, '800'],
      [/सात सौ/g, '700'],
      [/छह सौ/g, '600'],
      [/पाँच सौ|पांच सौ/g, '500'],
      [/चार सौ/g, '400'],
      [/तीन सौ/g, '300'],
      [/दो सौ/g, '200'],
      [/एक सौ/g, '100'],

      [/ಹದಿನೈದು ಸಾವಿರ/g, '15000'],
      [/ಹತ್ತು ಸಾವಿರ/g, '10000'],
      [/ಐದು ಸಾವಿರ/g, '5000'],
      [/ನಾಲ್ಕು ಸಾವಿರ/g, '4000'],
      [/ಮೂರು ಸಾವಿರ/g, '3000'],
      [/ಎರಡು ಸಾವಿರ/g, '2000'],
      [/ಒಂದು ಸಾವಿರ/g, '1000'],
      [/ಒಂಬತ್ತು ನೂರು/g, '900'],
      [/ಎಂಟು ನೂರು/g, '800'],
      [/ಏಳು ನೂರು/g, '700'],
      [/ಆರು ನೂರು/g, '600'],
      [/ಐದು ನೂರು/g, '500'],
      [/ನಾಲ್ಕು ನೂರು/g, '400'],
      [/ಮೂರು ನೂರು/g, '300'],
      [/ಎರಡು ನೂರು/g, '200'],
      [/ಒಂದು ನೂರು/g, '100'],

      // Digit multipliers (e.g. "2 हज़ार" -> 2000, "2 ಸಾವಿರ" -> 2000)
      [/(\d+)\s*(?:हज़ार|हजार|ಸಾವಿರ)/g, '$1000'],
      [/(\d+)\s*(?:सौ|ನೂರು)/g, '$100']
    ];

    for (const [pattern, rep] of directUnicodeCompounds) {
      res = res.replace(pattern, rep);
    }

    // Romanized compounds
    const romanizedCompounds: [RegExp, string][] = [
      [/\b(pandrah hazaar|pandrah hazar|hadinaidu saavira|hadinaidu savira|fifteen thousand)\b/gi, '15000'],
      [/\b(das hazaar|das hazar|hattu saavira|hattu savira|ten thousand)\b/gi, '10000'],
      [/\b(paanch hazaar|panch hazar|aidu saavira|aidu savira|five thousand)\b/gi, '5000'],
      [/\b(chaar hazaar|char hazar|naalku saavira|nalku savira|four thousand)\b/gi, '4000'],
      [/\b(teen hazaar|tin hazar|mooru saavira|muru savira|three thousand)\b/gi, '3000'],
      [/\b(do hazaar|do hazar|eradu saavira|eradu savira|two thousand)\b/gi, '2000'],
      [/\b(dedh hazaar|dedh hazar)\b/gi, '1500'],
      [/\b(ek hazaar|ek hazar|ondu saavira|ondu savira|one thousand)\b/gi, '1000'],
      [/\b(paanch sau|panch sau|aidu nooru|five hundred)\b/gi, '500'],
      [/\b(chaar sau|naalku nooru|four hundred)\b/gi, '400'],
      [/\b(teen sau|mooru nooru|three hundred)\b/gi, '300'],
      [/\b(do sau|eradu nooru|two hundred)\b/gi, '200'],
      [/\b(ek sau|ondu nooru|one hundred)\b/gi, '100'],
      [/(\d+)\s*(?:hazaar|hazar|saavira|savira)\b/gi, '$1000'],
      [/(\d+)\s*(?:sau|nooru)\b/gi, '$100']
    ];

    for (const [pattern, rep] of romanizedCompounds) {
      res = res.replace(pattern, rep);
    }

    // Single digits & ordinals
    const singleWordMap: [RegExp, string][] = [
      [/\b(पहला|first|1st|ಮೊದಲ)\b/gi, '1st'],
      [/\b(दूसरा|second|2nd|ಎರಡನೇ)\b/gi, '2nd'],
      [/\b(तीसरा|third|3rd|ಮೂರನೇ)\b/gi, '3rd'],
      [/\b(एक|ondu)\b/gi, '1'],
      [/\b(दो|eradu)\b/gi, '2'],
      [/\b(तीन|mooru)\b/gi, '3'],
      [/\b(चार|naalku)\b/gi, '4'],
      [/\b(पाँच|पांच|aidu)\b/gi, '5']
    ];

    for (const [pattern, rep] of singleWordMap) {
      res = res.replace(pattern, rep);
    }

    return res;
  }

  /**
   * Translates non-English and romanized phrases to standardized English text
   * while keeping product and brand names intact.
   */
  public translateToEnglish(text: string, language: ActiveLanguage, script: ScriptType): string {
    let normalized = this.normalizeNumbers(text);
    normalized = normalized.replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡!"']/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // 1. Budget translations: "2000 ke andar", "2000 olage", "2000 के अंदर" -> "under 2000"
    normalized = normalized.replace(/(\d+)\s*(?:₹|rs|rupees|roopaye|roopayi|रुपये|रुपया|ರೂಪಾಯಿ)?\s*(?:ke andar|ke niche|के अंदर|के नीचे|olage|ಒಳಗೆ|under|below|less than)/gi, 'under $1');
    normalized = normalized.replace(/(?:ke andar|ke niche|के अंदर|के नीचे|olage|ಒಳಗೆ|under|below|less than)\s*(\d+)\s*(?:₹|rs|rupees|roopaye|roopayi|रुपये|रुपया|ರೂಪಾಯಿ)?/gi, 'under $1');

    // 2. Intent phrase replacements (Direct matching for Unicode words)
    const phraseDictionary: [RegExp, string][] = [
      // Navigation
      [/open cart|cart kholo|कार्ट खोलो|ಕಾರ್ಟ್ ತೆರೆ|ಕಾರ್ಟ್ ತೆರೆಯಿರಿ|cart tere|cart tegi|mera cart dikhao|ನನ್ನ ಕಾರ್ಟ್ ತೋರಿಸು/gi, 'open cart'],
      [/open orders|orders kholo|ऑर्डर दिखाओ|ಆರ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸು|ನನ್ನ ಆರ್ಡರ್ ತೆರೆ|mere order dikhao/gi, 'open orders'],
      [/go home|home par jao|होम पर जाओ|ಮುಖಪುಟಕ್ಕೆ ಹೋಗು|ಹೋಮ್ ಸ್ಕ್ರೀನ್ ತೆರೆ|main screen/gi, 'go home'],
      [/open settings|settings kholo|सेटिंग्स खोलो|ಸೆಟ್ಟಿಂಗ್ಸ್ ತೆರೆ|ಸೆಟ್ಟಿಂಗ್ಸ್ ತೋರಿಸು/gi, 'open settings'],
      [/go back|piche jao|पीछे जाओ|ಹಿಂದಿನ ಪುಟ|hinde hogu/gi, 'go back'],
      [/stop|ruko|रोक दो|ನಿಲ್ಲಿಸು|nillisu/gi, 'stop'],
      [/help me|help|madad|मदद करो|ಸಹಾಯ ಮಾಡು|sahaya madu/gi, 'help'],

      // Actions
      [/where is my order|mera order kaha hai|mera order kahan hai|मेरा ऑर्डर कहाँ है|ನನ್ನ ಆರ್ಡರ್ ಎಲ್ಲಿದೆ|nanna order ellide|order track karo|order track madu/gi, 'where is my order'],
      [/pay with upi|pay by upi|upi se payment karo|upi se pay karo|यूपीआई से भुगतान|यूपीआई से पेमेंट करो|ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸು|upi moolaka pavatisu/gi, 'pay with upi'],
      [/pay cash on delivery|cash on delivery chahiye|कैश ऑन डिलीवरी|ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ|cod ge hakku/gi, 'pay cash on delivery'],
      [/show qr code|qr code dikhao|क्यूआर कोड दिखाओ|ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸು|qr torisu/gi, 'show qr code'],
      [/pay by card|card se payment|कार्ड से भुगतान|ಕಾರ್ಡ್ ಮೂಲಕ ಪಾವತಿ|card moolaka pavatisu/gi, 'pay by card'],
      [/pay with wallet|wallet se payment|वॉलेट से भुगतान|ವಾಲೆಟ್ ಮೂಲಕ ಪಾವತಿ/gi, 'pay with wallet'],
      [/read details|tell me the price|price batao|कीमत बताओ|ವಿವರಗಳನ್ನು ಓದಿ|ಬೆಲೆ ಎಷ್ಟು|rate eshtu|vivara heli/gi, 'read details'],
      [/clear cart|cart khali karo|कार्ट खाली करो|ಕಾರ್ಟ್ ಖಾಲಿ ಮಾಡು|cart khali madu/gi, 'clear cart'],
      [/buy this|buy now|ise kharido|इसे खरीदो|ಇದನ್ನು ಖರೀದಿಸು|idannu kharidisu|order book karo/gi, 'buy this'],

      // Add to cart modifiers
      [/add the cheapest to cart|sabse sasta cart me jodo|saste wale ko cart me daalo|ಅತ್ಯಂತ ಕಡಿಮೆ ಬೆಲೆಯದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು|kadime beleyaddannu cartge serisu/gi, 'add the cheapest to cart'],
      [/add the best to cart|sabse accha cart me dalo|ಅತ್ಯುತ್ತಮವಾದದ್ದನ್ನು ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು/gi, 'add the best to cart'],
      [/add this to cart|ise cart me dalo|कार्ट में डालो|ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು|ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸು|cart me daalo|cart me dalo|cart ge serisu|cart ge haaku/gi, 'add this to cart'],
      [/remove item|cart se nikalo|कार्ट से निकालो|ಕಾರ್ಟ್‌ನಿಂದ ತೆಗೆ|cart ninda tege|item hatao/gi, 'remove from cart'],

      // Search and store terms
      [/sabse sasta|sasta|सबसे सस्ता|ಸತ್ಯಂತ ಕಡಿಮೆ|ಅತ್ಯಂತ ಕಡಿಮೆ|ಕಡಿಮೆ ಬೆಲೆ|kadime bele|kadime rate|kadime/gi, 'cheapest'],
      [/sabse accha|uttam|सबसे अच्छा|ಅತ್ಯುತ್ತಮ|ಉತ್ತಮ|atyuttama/gi, 'best'],
      [/khojo|dhundo|dikhao|खोजो|ढूंढो|दिखाओ|ಹುಡುಕು|ತೋರಿಸು|ನೋಡಿಸು|huduku|torisu|nodisu|tori/gi, 'find'],
      [/ईयरबड्स|इयरबड्स|ಇಯರ್‌ಬಡ್ಸ್|ಇಯರ್ ಬಡ್ಸ್/gi, 'earbuds'],
      [/स्मार्टवॉच|ಸ್ಮಾರ್ಟ್‌ವಾಚ್/gi, 'smartwatch'],
      [/हेडफोन|हेडफ़ोन|ಹೆಡ್‌ಫೋನ್/gi, 'headphones'],
      [/शूज़|जूते|ಶೂಗಳು/gi, 'shoes'],
      [/फोन|मोबाइल|ಫೋನ್/gi, 'phone']
    ];

    for (const [pat, repl] of phraseDictionary) {
      normalized = normalized.replace(pat, repl);
    }

    // Clean up residual words
    normalized = normalized.replace(/\b(chahiye|beku|nodbeku|karo|madu|heli|batao|daalo|serisu|haaku)\b/gi, '').trim();
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Main entry point: Normalizes input transcript to standardized English while preserving original.
   */
  public normalize(
    text: string,
    preferredLanguage: SupportedLanguageSelection = 'auto'
  ): NormalizationResult {
    const originalText = (text || '').trim();
    const { language, script } = this.detectLanguageAndScript(originalText, preferredLanguage);
    const englishText = this.translateToEnglish(originalText, language, script);

    return {
      englishText: englishText || originalText,
      originalText,
      language,
      script
    };
  }
}

export const voiceNormalizer = new VoiceNormalizer();
