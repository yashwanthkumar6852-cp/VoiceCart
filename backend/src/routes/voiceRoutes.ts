import { Router, Request, Response } from 'express';
import multer from 'multer';
import { intentParser } from '../voice/intentParser';
import { voiceService } from '../services/voiceService';
import { transcriptionService } from '../voice/transcriptionService';
import { aggregatorService } from '../providers/aggregatorService';
import { rankingEngine } from '../ranking/rankingEngine';
import { querySpecExtractor } from '../ranking/querySpecExtractor';
import { cartService } from '../services/cartService';
import { orderTrackerService } from '../services/orderTrackerService';
import { searchSessionService } from '../services/searchSessionService';
import { config } from '../config';
import { commandRouter } from '../voice/commandRouter';

const router = Router();

// POST /api/voice/command
// Body: { transcript: string, context?: any, language?: 'en' | 'hi' | 'kn' }
router.post('/command', async (req: Request, res: Response) => {
  try {
    const { transcript, context, language } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Field "transcript" is required' });
    }

    const requestedLang = (language || 'en') as 'en' | 'hi' | 'kn';
    const result = await commandRouter.route(transcript, context, requestedLang);

    // If search action, also attach spec
    if (result.action === 'search' && result.params.query) {
      const spec = await querySpecExtractor.extractSpec(result.params.query, requestedLang);
      result.params.spec = spec;
      result.params.cleanQuery = spec.cleanSearchQuery;
    }

    return res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Voice command route error:', error);
    return res.status(500).json({ error: 'Voice command routing failed', details: error.message });
  }
});

// Configure multer with memory storage & 10MB size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max audio clip limit
  }
});

// POST /api/voice/transcribe
router.post('/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    let audioBuffer: Buffer | null = null;
    let mimeType = 'audio/webm';
    const requestedLang = (req.body.lang || req.body.language || 'en-IN') as string;

    if (req.file && req.file.buffer) {
      audioBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audioBase64) {
      audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
      mimeType = req.body.mimeType || 'audio/webm';
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({
        error: 'No audio provided. Upload multipart file "audio" or pass "audioBase64" JSON string.'
      });
    }

    const result = await transcriptionService.transcribeAudio(audioBuffer, mimeType, requestedLang);

    return res.json({
      success: true,
      text: result.text,
      transcript: result.text,
      provider: result.provider,
      lang: result.lang,
      durationMs: result.durationMs
    });
  } catch (err: any) {
    console.error('Audio transcription error:', err.message);
    return res.status(500).json({
      error: 'Audio transcription failed',
      details: err.message || 'All speech providers failed'
    });
  }
});

// POST /api/voice/process
// Body: { transcript: string, context?: any }
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { transcript, context } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Field "transcript" is required' });
    }

    const intentResult = await intentParser.parseIntent(transcript, context);
    const voiceConfig = voiceService.getVoiceConfig(intentResult.language);

    let searchData: any = null;
    let cartData: any = null;
    let orderData: any = null;

    // Handle intent executions
    if (intentResult.intent === 'SEARCH' || intentResult.intent === 'COMPARE') {
      const query = intentResult.productQuery || transcript;
      const spec = await querySpecExtractor.extractSpec(query, intentResult.language);

      const filters = {
        maxBudget: intentResult.maxBudget || spec.budgetMax,
        minBudget: spec.budgetMin,
        brand: intentResult.brand || spec.brand,
        preference: intentResult.preference || spec.preference || 'balanced'
      };

      const { products, storeStatuses, rawCounts, queriesSent } = await aggregatorService.searchAllStores(
        query,
        filters,
        spec
      );

      const ranked = await rankingEngine.rank(
        products,
        query,
        filters,
        storeStatuses,
        spec,
        rawCounts,
        queriesSent
      );

      const searchId = `search_${Date.now()}`;
      const session = await searchSessionService.createSession({
        searchId,
        rawQuery: query,
        language: intentResult.language,
        spec,
        products: ranked.rankedProducts,
        exactMatches: ranked.exactMatches,
        similarAlternatives: ranked.similarProducts,
        topRecommendations: ranked.topRecommendations,
        rawCounts,
        storeStatuses,
        debugTrace: ranked.debugTrace
      });

      searchData = {
        searchId: session.searchId,
        sessionId: session.sessionId,
        query,
        spec,
        parsedQuery: ranked.parsedQuery,
        matchType: ranked.matchType,
        isExactMatch: ranked.isExactMatch,
        filters,
        totalResults: ranked.rankedProducts.length,
        products: ranked.rankedProducts,
        exactMatches: ranked.exactMatches,
        alternativeMatches: ranked.alternativeMatches,
        similarProducts: ranked.similarProducts,
        topRecommendations: ranked.topRecommendations,
        comparisonMatrix: ranked.comparisonMatrix,
        storeStatuses,
        debugTrace: ranked.debugTrace
      };

      // Enrich spoken response matching the card on screen exactly
      const topPick = ranked.topRecommendations.bestOverall || ranked.rankedProducts[0];
      if (topPick) {
        const totalCost = topPick.price + topPick.shippingFee;
        const storeName = topPick.store === 'amazon' ? 'Amazon' : topPick.store === 'flipkart' ? 'Flipkart' : 'Meesho';
        const cleanTitle = topPick.title.split(/[,(-]/)[0].trim() || topPick.title.slice(0, 35);

        if (intentResult.language === 'hi') {
          intentResult.spokenResponse = `सबसे अच्छा विकल्प ${storeName} पर ₹${totalCost} में ${cleanTitle} है। क्या मैं इसे कार्ट में जोड़ दूँ?`;
        } else if (intentResult.language === 'kn') {
          intentResult.spokenResponse = `ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆ ${storeName} ನಲ್ಲಿ ₹${totalCost} ಕ್ಕೆ ${cleanTitle} ಲಭ್ಯವಿದೆ. ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲೇ?`;
        } else {
          intentResult.spokenResponse = `Found the best option on ${storeName} for ₹${totalCost}: ${cleanTitle} (${topPick.rating}★ rating). Would you like to add it to your cart?`;
        }
      } else {
        if (intentResult.language === 'hi') {
          intentResult.spokenResponse = `क्षमा करें, "${query}" के लिए कोई सटीक उत्पाद नहीं मिला।`;
        } else if (intentResult.language === 'kn') {
          intentResult.spokenResponse = `ಕ್ಷಮಿಸಿ, "${query}" ಗೆ ಯಾವುದೇ ನಿಖರ ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ.`;
        } else {
          intentResult.spokenResponse = `No exact matching products found for "${query}". Try refining your search.`;
        }
      }
    } else if (intentResult.intent === 'ADD_TO_CART') {
      if (context?.selectedProduct) {
        const item = await cartService.addToCart(context.selectedProduct);
        cartData = { addedItem: item, cart: await cartService.getCart() };
      }
    } else if (intentResult.intent === 'VIEW_CART') {
      cartData = { cart: await cartService.getCart() };
    } else if (intentResult.intent === 'TRACK_ORDER') {
      const latest = intentResult.orderId
        ? await orderTrackerService.getOrderById(intentResult.orderId)
        : await orderTrackerService.getLatestOrder();

      if (latest) {
        orderData = latest;
        if (intentResult.language === 'hi') {
          intentResult.spokenResponse = `आपका ${latest.store.toUpperCase()} आर्डर #${latest.orderId} स्थिति ${latest.status} में है।`;
        } else if (intentResult.language === 'kn') {
          intentResult.spokenResponse = `ನಿಮ್ಮ ${latest.store.toUpperCase()} ಆರ್ಡರ್ #${latest.orderId} ಸ್ಥಿತಿ: ${latest.status}.`;
        } else {
          intentResult.spokenResponse = `Your ${latest.store.toUpperCase()} order #${latest.orderId} is currently ${latest.status.replace(/_/g, ' ')}. Expected delivery in 2 days.`;
        }
      } else {
        intentResult.spokenResponse =
          intentResult.language === 'kn'
            ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
            : 'No active orders found. You can paste an order confirmation message to start tracking.';
      }
    }

    return res.json({
      intentResult,
      voiceConfig,
      searchData,
      cartData,
      orderData
    });
  } catch (error: any) {
    console.error('Voice process route error:', error);
    return res.status(500).json({ error: 'Voice processing failed', details: error.message });
  }
});

export default router;
