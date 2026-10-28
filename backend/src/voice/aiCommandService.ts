import axios from 'axios';
import { z } from 'zod';
import { config } from '../config';

export const AiCommandSchema = z.object({
  action: z.enum([
    'search',
    'compare',
    'open_cart',
    'open_orders',
    'open_home',
    'open_settings',
    'add_to_cart',
    'remove_from_cart',
    'clear_cart',
    'buy',
    'pay',
    'track_order',
    'read_details',
    'change_language',
    'go_back',
    'stop',
    'help',
    'confirm_yes',
    'confirm_no',
    'greeting',
    'chat'
  ]),
  params: z.record(z.string(), z.any()).default({}),
  confidence: z.number().min(0).max(1).default(0.8),
  language: z.enum(['en', 'hi', 'kn']).default('en'),
  reply: z.string().default('Sure.')
});

export type AiCommandResult = z.infer<typeof AiCommandSchema>;

export class AiCommandService {
  private circuitOpenUntil: number = 0;

  public async parseWithGemini(
    transcript: string,
    context?: any,
    targetLanguage: 'en' | 'hi' | 'kn' = 'en'
  ): Promise<AiCommandResult | null> {
    const apiKey = config.geminiApiKey || config.googleSpeechApiKey;
    if (!apiKey || Date.now() < this.circuitOpenUntil) return null;

    const systemPrompt = `You are the VoiceCart Voice Command Parsing AI.
VoiceCart is a voice-controlled shopping assistant across Amazon India, Flipkart, and Meesho.
Analyze the user's transcript in English, Hindi, or Kannada and map it to an exact action and parameters.

Return ONLY valid JSON matching this exact schema. Never answer in prose.
Schema:
{
  "action": "search" | "compare" | "open_cart" | "open_orders" | "open_home" | "open_settings" | "add_to_cart" | "remove_from_cart" | "clear_cart" | "buy" | "pay" | "track_order" | "read_details" | "change_language" | "go_back" | "stop" | "help" | "confirm_yes" | "confirm_no" | "chat",
  "params": {
    "query": "string (for search/compare)",
    "maxBudget": "number (if mentioned, e.g. 2000)",
    "store": "amazon | flipkart | meesho",
    "targetRef": "this | best | cheapest | first | second | third",
    "paymentMethod": "cod | upi | qr | wallet | card | netbanking",
    "language": "en | hi | kn"
  },
  "confidence": number between 0.0 and 1.0,
  "language": "en" | "hi" | "kn",
  "reply": "one short, natural confirmation in the user's language (e.g. 'Opening your cart', 'Added the Flipkart earbuds to your cart', 'UPI ಪಾವತಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ')"
}

Active UI Context:
${JSON.stringify(context || {}, null, 2)}
`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await axios.post(
          url,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Spoken Transcript: "${transcript}"\nPreferred Language: ${targetLanguage}` }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          },
          { timeout: 1200 }
        );

        const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const rawJson = JSON.parse(candidate);
          const parsed = AiCommandSchema.safeParse(rawJson);
          if (parsed.success) {
            return parsed.data;
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 429 || err?.response?.status === 403 || err?.code === 'ECONNABORTED') {
          this.circuitOpenUntil = Date.now() + 5 * 60 * 1000;
          break;
        }
      }
    }

    return null;
  }
}

export const aiCommandService = new AiCommandService();
