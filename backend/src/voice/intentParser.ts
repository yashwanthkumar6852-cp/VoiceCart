import axios from 'axios';
import { RankingPreference, VoiceIntentResult } from '../types/product';
import { config } from '../config';
import { querySpecExtractor } from '../ranking/querySpecExtractor';

export class IntentParser {
  /**
   * Parses voice transcript to extract structured intent, entities, and conversational reply.
   * Fully supports English, Hindi (hi-IN), and Kannada (kn-IN) with mixed code-switching.
   */
  public async parseIntent(transcript: string, currentContext?: any): Promise<VoiceIntentResult> {
    const cleanText = transcript.trim();
    if (!cleanText) {
      return {
        intent: 'UNKNOWN',
        language: 'en',
        spokenResponse: "I didn't catch that. Could you please repeat?"
      };
    }

    const language = this.detectLanguage(cleanText);

    // Try LLM parsing if OpenAI/Gemini API keys are configured
    if (config.geminiApiKey || config.openaiApiKey) {
      try {
        const llmResult = await this.parseWithLLM(cleanText, language, currentContext);
        if (llmResult) return llmResult;
      } catch (err: any) {
        console.warn('⚠️ LLM intent parsing failed, using rule-based parser:', err.message);
      }
    }

    // Fallback: Robust multilingual rule-based NLP intent parser
    return this.parseWithRules(cleanText, language, currentContext);
  }

  public detectLanguage(text: string): 'en' | 'hi' | 'kn' {
    // Kannada Unicode range: \u0C80-\u0CFF
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    // Hindi / Devanagari Unicode range: \u0900-\u097F
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    
    // Check for transliterated Kannada / Hindi keywords
    const lower = text.toLowerCase();
    if (/\b(ellide|beku|kodi|olage|heglu|torisu|sari|roopayi|savira|kharidisi)\b/.test(lower)) return 'kn';
    if (/\b(kahan|karo|dikhao|daalo|kharido|batao|chahiye|paisa|rupaye)\b/.test(lower)) return 'hi';

    return 'en';
  }

  private async parseWithLLM(text: string, language: 'en' | 'hi' | 'kn', context?: any): Promise<VoiceIntentResult | null> {
    const prompt = `You are VoiceCart's multilingual intent parser. Extract intent and entities from user shopping query.
The input can be in English, Hindi, or Kannada (including code-switching like "ಒಳ್ಳೆಯ boAt earbuds ಹೇಳು 2000 ಒಳಗೆ").
Always extract the clean normalized product query in English keywords for e-commerce search.

Output JSON only with keys:
- intent: ("SEARCH" | "COMPARE" | "ADD_TO_CART" | "REMOVE_FROM_CART" | "VIEW_CART" | "BUY_NOW" | "TRACK_ORDER" | "READ_DETAILS" | "CLARIFY_BUDGET")
- language: ("en" | "hi" | "kn")
- productQuery: string (clean English product name e.g. "boAt earbuds", "running shoes")
- maxBudget: number in INR (or null)
- brand: string (or null)
- preference: ("cheapest" | "best_rated" | "fastest" | "balanced")
- orderId: string (or null)
- spokenResponse: string in the user's spoken language (English, Hindi or Kannada) explaining the action

User Query: "${text}"`;

    if (config.geminiApiKey) {
      const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const m of modelsToTry) {
        try {
          const resp = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${config.geminiApiKey}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            },
            { timeout: 3500 }
          );
          const content = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            return JSON.parse(content) as VoiceIntentResult;
          }
        } catch (e) {
          // try next model
        }
      }
    }

    if (config.openaiApiKey) {
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: { Authorization: `Bearer ${config.openaiApiKey}` },
          timeout: 4000
        }
      );
      const content = resp.data?.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as VoiceIntentResult;
      }
    }

    return null;
  }

  private parseWithRules(text: string, language: 'en' | 'hi' | 'kn', context?: any): VoiceIntentResult {
    const lower = text.toLowerCase();

    // 1. Order Tracking
    if (
      lower.includes('track') ||
      lower.includes('where is my order') ||
      lower.includes('order status') ||
      lower.includes('mera order') ||
      lower.includes('order kahan') ||
      lower.includes('ಆರ್ಡರ್') ||
      lower.includes('ಎಲ್ಲಿದೆ') ||
      lower.includes('ನನ್ನ ಆರ್ಡರ್')
    ) {
      const orderIdMatch = text.match(/\b([A-Z0-9]{8,20}|OD\d{10,}|\d{3}-\d{7}-\d{7})\b/i);
      const orderId = orderIdMatch ? orderIdMatch[0] : undefined;
      
      let spoken = "Here is your latest order status.";
      if (language === 'hi') spoken = "यहाँ आपके हालिया आर्डर की स्थिति है।";
      if (language === 'kn') spoken = "ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಆರ್ಡರ್ ವಿವರಗಳು ಇಲ್ಲಿವೆ.";

      return {
        intent: 'TRACK_ORDER',
        language,
        orderId,
        spokenResponse: spoken
      };
    }

    // 2. Add to cart
    if (
      lower.includes('add to cart') ||
      lower.includes('add this') ||
      lower.includes('kart me daalo') ||
      lower.includes('cart me') ||
      lower.includes('ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸು') ||
      lower.includes('ಕಾರ್ಟ್ಗೆ ಸೇರಿಸು') ||
      lower.includes('ಕಾರ್ಟ್ ನಲ್ಲಿ ಹಾಕು')
    ) {
      let spoken = "Added the top recommendation to your cart.";
      if (language === 'hi') spoken = "मैंने सर्वोत्तम विकल्प आपके कार्ट में जोड़ दिया है।";
      if (language === 'kn') spoken = "ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆಯನ್ನು ನಿಮ್ಮ ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.";

      return {
        intent: 'ADD_TO_CART',
        language,
        spokenResponse: spoken
      };
    }

    // 3. View cart
    if (
      lower.includes('show cart') ||
      lower.includes('view cart') ||
      lower.includes('open cart') ||
      lower.includes('cart dikhao') ||
      lower.includes('ಕಾರ್ಟ್ ತೋರಿಸು') ||
      lower.includes('ಕಾರ್ಟ್ ತೆರೆ')
    ) {
      let spoken = "Opening your VoiceCart shopping basket.";
      if (language === 'hi') spoken = "आपका कार्ट खोला जा रहा है।";
      if (language === 'kn') spoken = "ನಿಮ್ಮ ಶಾಪಿಂಗ್ ಕಾರ್ಟ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.";

      return {
        intent: 'VIEW_CART',
        language,
        spokenResponse: spoken
      };
    }

    // 4. Buy now / Checkout / Voice Payment Commands
    if (
      lower.includes('pay with upi') ||
      lower.includes('pay via upi') ||
      lower.includes('upi se pay') ||
      lower.includes('ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸಿ') ||
      lower.includes('ಯುಪಿಐ ಪಾವತಿ')
    ) {
      return {
        intent: 'PAY_WITH_UPI',
        language,
        spokenResponse: language === 'kn' ? "ಯುಪಿಐ ಪಾವತಿ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : language === 'hi' ? "यूपीआई भुगतान विकल्प खोला जा रहा है।" : "Opening UPI payment option."
      };
    }

    if (
      lower.includes('cash on delivery') ||
      lower.includes('pay with cod') ||
      lower.includes('pay by cod') ||
      lower.includes('cod se pay') ||
      lower.includes('ನಗದು ಪಾವತಿ') ||
      lower.includes('ಡೆಲಿವರಿ ನಂತರ ಪಾವತಿಸಿ')
    ) {
      return {
        intent: 'PAY_WITH_COD',
        language,
        spokenResponse: language === 'kn' ? "ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ ಆಯ್ಕೆ ಸಿದ್ಧವಾಗಿದೆ." : language === 'hi' ? "कैश ऑन डिलीवरी विकल्प चुना गया है।" : "Opening Cash on Delivery checkout."
      };
    }

    if (
      lower.includes('pay by card') ||
      lower.includes('pay with card') ||
      lower.includes('card se pay') ||
      lower.includes('credit card') ||
      lower.includes('debit card') ||
      lower.includes('ಕಾರ್ಡ್ ಮೂಲಕ ಪಾವತಿ')
    ) {
      return {
        intent: 'PAY_WITH_CARD',
        language,
        spokenResponse: language === 'kn' ? "ಕಾರ್ಡ್ ಪಾವತಿ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : language === 'hi' ? "कार्ड भुगतान विकल्प खोला जा रहा है।" : "Opening Card & Netbanking payment."
      };
    }

    if (
      lower.includes('pay with wallet') ||
      lower.includes('pay from wallet') ||
      lower.includes('wallet se pay') ||
      lower.includes('ವ್ಯಾಲೆಟ್ ಮೂಲಕ ಪಾವತಿಸಿ')
    ) {
      return {
        intent: 'PAY_WITH_WALLET',
        language,
        spokenResponse: language === 'kn' ? "ಡಿಜಿಟಲ್ ವ್ಯಾಲೆಟ್ ಪಾವತಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : language === 'hi' ? "डिजिटल वॉलेट भुगतान खोला जा रहा है।" : "Opening Digital Wallets option."
      };
    }

    if (
      lower.includes('show qr') ||
      lower.includes('show qr code') ||
      lower.includes('qr code dikhao') ||
      lower.includes('qr dikhao') ||
      lower.includes('ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸು') ||
      lower.includes('ಸ್ಕ್ಯಾನ್ ಕೋಡ್ ತೋರಿಸು')
    ) {
      return {
        intent: 'PAY_WITH_QR',
        language,
        spokenResponse: language === 'kn' ? "ಯುಪಿಐ ಕ್ಯೂಆರ್ ಕೋಡ್ ತೋರಿಸಲಾಗುತ್ತಿದೆ." : language === 'hi' ? "यूपीआई क्यूआर कोड दिखाया जा रहा है।" : "Displaying UPI QR Code for scan & pay."
      };
    }

    if (
      lower.includes('buy this') ||
      lower.includes('buy now') ||
      lower.includes('checkout') ||
      lower.includes('pay now') ||
      lower.includes('kharido') ||
      lower.includes('order kar do') ||
      lower.includes('ಖರೀದಿಸು') ||
      lower.includes('ಈಗಲೇ ಖರೀದಿಸಿ')
    ) {
      let spoken = "Proceeding to checkout.";
      if (language === 'hi') spoken = "खरीदारी के लिए चेकआउट खोला जा रहा है।";
      if (language === 'kn') spoken = "ಖರೀದಿಸಲು ಚೆಕ್ಔಟ್ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ.";

      return {
        intent: 'BUY_NOW',
        language,
        spokenResponse: spoken
      };
    }

    // 5. Read details
    if (
      lower.includes('read details') ||
      lower.includes('read the details') ||
      lower.includes('tell me more') ||
      lower.includes('details batao') ||
      lower.includes('ವಿವರ ತಿಳಿಸು') ||
      lower.includes('ಮಾಹಿತಿ ಹೇಳು')
    ) {
      let spoken = "Here are the top product specifications, rating, and store comparison.";
      if (language === 'kn') spoken = "ಉತ್ಪನ್ನದ ವಿವರಣೆ, ರೇಟಿಂಗ್ ಮತ್ತು ಬೆಲೆ ಹೋಲಿಕೆ ಇಲ್ಲಿದೆ.";
      return {
        intent: 'READ_DETAILS',
        language,
        spokenResponse: spoken
      };
    }

    // 6. Search / Compare Intent & Slot Extraction using QuerySpecExtractor
    const spec = querySpecExtractor.extractRuleSpec(text, text);
    const maxBudget: number | undefined = spec.budgetMax;
    const preference: RankingPreference = spec.preference || 'balanced';
    const detectedBrand = spec.brand;
    const productQuery = spec.cleanSearchQuery || spec.englishQuery;


    // Formulate Spoken Feedback in user's language
    let spokenResponse = `Searching Amazon, Flipkart and Meesho for ${productQuery}${maxBudget ? ` under ₹${maxBudget}` : ''}.`;
    if (language === 'hi') {
      spokenResponse = `अमेज़न, फ्लिपकार्ट और मीशो पर ${productQuery} की खोज की जा रही है।`;
    } else if (language === 'kn') {
      spokenResponse = `ಅಮೆಜಾನ್, ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ ಮತ್ತು ಮೀಶೋನಲ್ಲಿ ${productQuery} ಹುಡುಕಲಾಗುತ್ತಿದೆ.`;
    }

    return {
      intent: lower.includes('compare') || lower.includes('ಹೋಲಿಸು') ? 'COMPARE' : 'SEARCH',
      language,
      productQuery,
      maxBudget,
      brand: detectedBrand,
      preference,
      spokenResponse
    };
  }
}

export const intentParser = new IntentParser();
