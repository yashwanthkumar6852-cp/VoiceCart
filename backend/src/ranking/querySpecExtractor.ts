import axios from 'axios';
import { ProductSpec, RankingPreference } from '../types/product';
import { config } from '../config';
import { voiceNormalizer } from '../voice/normalize';

const DEFAULT_ACCESSORY_EXCLUDES = [
  'case',
  'cover',
  'strap',
  'skin',
  'protector',
  'tempered glass',
  'charger',
  'cable',
  'stand',
  'refill',
  'replacement',
  'toy',
  'sticker',
  'compatible with',
  'pouch',
  'sleeve',
  'holder',
  'back cover',
  'screen guard',
  'ear tips'
];

const KNOWN_BRANDS: Record<string, string> = {
  boat: 'boAt',
  apple: 'Apple',
  samsung: 'Samsung',
  livesmart: 'Livesmart',
  nike: 'Nike',
  adidas: 'Adidas',
  puma: 'Puma',
  hp: 'HP',
  dell: 'Dell',
  lenovo: 'Lenovo',
  asus: 'Asus',
  acer: 'Acer',
  sony: 'Sony',
  noise: 'Noise',
  oneplus: 'OnePlus',
  xiaomi: 'Xiaomi',
  redmi: 'Redmi',
  mi: 'Mi',
  realme: 'Realme',
  google: 'Google',
  bose: 'Bose',
  jbl: 'JBL',
  boult: 'Boult',
  zebronics: 'Zebronics',
  lg: 'LG',
  motorola: 'Motorola',
  oppo: 'Oppo',
  vivo: 'Vivo',
  nothing: 'Nothing',
  fireboltt: 'Fire-Boltt',
  fastrack: 'Fastrack',
  ptron: 'pTron'
};

const FILLER_PATTERNS = [
  /\b(?:i want to buy|i want|want to buy|want|i need|need|show me|show|find me|find|get me|get|give me|give|look for|search for|search|compare|buy me|buy|add to cart|add|please|can you show|can you get|for me|the best|best|cheapest|good|top rated|recommended)\b/gi,
  /\b(?:the|a|an|this|that|these|those)\b/gi,
  /\b(?:mujhe chahiye|chahiye|dikhao|batao|dhundo|khojo|lao|de do|kharidna hai|tulanatmak|achha|sabse sasta|saste)\b/gi,
  /\b(?:torisu|nodisu|beku|kodi|thoo|huduku|kharidisi|nodbeku|heli|serisu|atyuttama|kadime bele)\b/gi,
  /\b(?:under|below|less than|ke andar|ke niche|olage|kadime)\s*(?:₹|rs|rupees|inr)?\s*\d+\b/gi
];

export class QuerySpecExtractor {
  /**
   * Extracts a structured ProductSpec from raw voice/text query in English, Hindi, or Kannada.
   */
  public async extractSpec(rawQuery: string, currentLang: 'en' | 'hi' | 'kn' = 'en'): Promise<ProductSpec> {
    if (!rawQuery || !rawQuery.trim()) {
      return this.buildDefaultSpec('');
    }

    const trimmed = rawQuery.trim();
    const normalized = voiceNormalizer.normalize(trimmed, currentLang);
    const englishQuery = normalized.englishText || trimmed;

    // 1. First extract fast deterministic rule-based spec
    const ruleSpec = this.extractRuleSpec(trimmed, englishQuery);

    // Fast path: if ruleSpec already determined the specific product type, brand, model, or budget,
    // immediately return ruleSpec without waiting for remote LLM calls (< 1ms)
    const hasSufficientInfo =
      ruleSpec.isSpecific ||
      Boolean(ruleSpec.brand && ruleSpec.brand.trim().length > 0) ||
      Boolean(ruleSpec.model && ruleSpec.model.trim().length > 0) ||
      Boolean(ruleSpec.productType && ruleSpec.productType !== 'product') ||
      Boolean(ruleSpec.budgetMax || ruleSpec.budgetMin);

    if (hasSufficientInfo) {
      this.applyDefaultExcludes(ruleSpec);
      this.buildCleanQueries(ruleSpec);
      return ruleSpec;
    }

    // 2. If Gemini API key is configured and query is still generic, race with Gemini (max 500ms)
    if (config.geminiApiKey) {
      try {
        const llmSpec = await Promise.race([
          this.extractWithGemini(trimmed, englishQuery, ruleSpec),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 500))
        ]);

        if (llmSpec) {
          // Strictly evaluate isSpecific based on whether brand or model was provided
          llmSpec.isSpecific = Boolean(
            (llmSpec.brand && llmSpec.brand.trim().length > 0) ||
            (llmSpec.model && llmSpec.model.trim().length > 0)
          );
          // Merge ruleSpec mustInclude and model tokens
          const modelTokens = (llmSpec.model || '').split(/\s+/).filter(t => t.length > 0 && !['and', 'the', 'for'].includes(t.toLowerCase()));
          llmSpec.mustInclude = Array.from(new Set([...(llmSpec.mustInclude || []), ...(ruleSpec.mustInclude || []), ...modelTokens]));
          // Ensure default accessory excludes are preserved unless requested
          this.applyDefaultExcludes(llmSpec);
          this.buildCleanQueries(llmSpec);
          return llmSpec;
        }
      } catch (err: any) {
        // Fallback gracefully to ruleSpec
      }
    }

    this.applyDefaultExcludes(ruleSpec);
    this.buildCleanQueries(ruleSpec);
    return ruleSpec;
  }

  /**
   * Synchronous rule-based spec extractor for instant offline and test usage.
   */
  public extractRuleSpec(rawQuery: string, englishQuery: string): ProductSpec {
    let cleanText = englishQuery.toLowerCase();

    // Extract Budget Min & Max from both raw transcript and normalized English
    let budgetMin: number | undefined = undefined;
    let budgetMax: number | undefined = undefined;

    const fullBudgetSearch = `${rawQuery} ${englishQuery} ${cleanText}`;
    const underMatch =
      fullBudgetSearch.match(/(?:under|below|less than|within|ke andar|ke niche|olage|ಒಳಗೆ|के अंदर|kadime)\s*(?:₹|rs|rupees|inr)?\s*(\d+)/i) ||
      fullBudgetSearch.match(/(\d+)\s*(?:₹|rs|rupees|inr|roopayi|rupya|रुपये|ರೂಪಾಯಿ)?\s*(?:ke andar|ke niche|olage|ಒಳಗೆ|के अंदर|under|below|less than|kadime)/i);
    if (underMatch) {
      budgetMax = parseInt(underMatch[1], 10);
    }

    const aboveMatch = fullBudgetSearch.match(/(?:above|more than|over|greater than|se zyada|ginta hecchu)\s*(?:₹|rs|rupees|inr)?\s*(\d+)/i);
    if (aboveMatch) {
      budgetMin = parseInt(aboveMatch[1], 10);
    }

    const betweenMatch = fullBudgetSearch.match(/(?:between|from)?\s*(?:₹|rs)?\s*(\d+)\s*(?:to|and|-)\s*(?:₹|rs)?\s*(\d+)/i);
    if (betweenMatch) {
      budgetMin = parseInt(betweenMatch[1], 10);
      budgetMax = parseInt(betweenMatch[2], 10);
    }

    // Extract Preference
    let preference: RankingPreference = 'balanced';
    if (/\b(?:cheapest|lowest price|cheap|sasta|kadime bele)\b/i.test(cleanText)) {
      preference = 'cheapest';
    } else if (/\b(?:best rated|top rated|highest rating|best review|uttam|atyuttama)\b/i.test(cleanText)) {
      preference = 'best_rated';
    } else if (/\b(?:fastest|quick delivery|same day|express|fast delivery|tvarita)\b/i.test(cleanText)) {
      preference = 'fastest';
    }

    // Remove filler words
    for (const pattern of FILLER_PATTERNS) {
      cleanText = cleanText.replace(pattern, ' ');
    }
    cleanText = cleanText.replace(/[.,/#!$%^&*;:{}=\-_`~()?¿¡!"']/g, ' ').replace(/\s+/g, ' ').trim();

    // Strip prepositions before store or brand names (e.g. "on amazon", "from flipkart", "on mi", "by boat")
    cleanText = cleanText.replace(/\b(?:on|in|from|at)\s+(?:amazon|flipkart|meesho)\b/gi, ' ');
    cleanText = cleanText.replace(/\b(?:amazon|flipkart|meesho)\b/gi, ' ');
    cleanText = cleanText.replace(/\b(?:on|in|from|by|at|of)\s+(?=(?:mi|xiaomi|redmi|boat|apple|samsung|sony|lg|oneplus|realme|oppo|vivo|noise|boult|lenovo|dell|hp|asus|acer)\b)/gi, ' ');

    // Extract Brand
    let brand: string | undefined = undefined;
    for (const [key, canonical] of Object.entries(KNOWN_BRANDS)) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(cleanText)) {
        brand = canonical;
        cleanText = cleanText.replace(regex, ' ').replace(/\s+/g, ' ').trim();
        break;
      }
    }

    const variant: Record<string, any> = {};
    const mustInclude: string[] = [];

    // Extract Storage (e.g. 128GB, 256GB, 512GB, 1TB)
    const storageMatch = cleanText.match(/\b(64|128|256|512)\s*(?:gb|gigabytes?)\b|\b(1|2)\s*(?:tb|terabytes?)\b/i);
    if (storageMatch) {
      const s = storageMatch[1] ? `${storageMatch[1]}GB` : `${storageMatch[2]}TB`;
      variant.storage = s.toUpperCase();
      mustInclude.push(variant.storage);
      cleanText = cleanText.replace(storageMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract RAM (e.g. 8GB RAM, 16GB RAM)
    const ramMatch = cleanText.match(/\b(4|6|8|12|16|32|64)\s*(?:gb)?\s*ram\b/i);
    if (ramMatch) {
      variant.ram = `${ramMatch[1]}GB RAM`.toUpperCase();
      mustInclude.push(variant.ram);
      cleanText = cleanText.replace(ramMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract Color (e.g. Black, Blue, White, Natural Titanium)
    const colorMatch = cleanText.match(/\b(natural titanium|space grey|midnight|starlight|black|white|blue|green|pink|yellow|silver|gold|red|purple|grey|gray)\b/i);
    if (colorMatch) {
      variant.color = colorMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      mustInclude.push(variant.color);
      cleanText = cleanText.replace(colorMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract Screen Size or Inches (e.g. "43 inch", "55 inch", "15.6 inch")
    const sizeMatch = cleanText.match(/\b(\d+(?:\.\d+)?)\s*(?:inch|inches|\"|cm)\b/i);
    if (sizeMatch) {
      variant.size = `${sizeMatch[1]} inch`;
      mustInclude.push(variant.size);
      cleanText = cleanText.replace(sizeMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract Umbrella Fold / Type (e.g. "4 fold", "3 fold", "5 fold", "2 fold")
    const foldMatch = cleanText.match(/\b(\d)\s*(?:fold|folds)\b/i);
    if (foldMatch) {
      variant.fold = `${foldMatch[1]} fold`;
      mustInclude.push(variant.fold);
      cleanText = cleanText.replace(foldMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract Pack Size (e.g. "pack of 2", "set of 3", "2 pack")
    const packMatch = cleanText.match(/\b(?:pack of|set of)\s*(\d+)\b|\b(\d+)\s*(?:pack|set)\b/i);
    if (packMatch) {
      const count = packMatch[1] || packMatch[2];
      variant.pack = `Pack of ${count}`;
      mustInclude.push(variant.pack);
      cleanText = cleanText.replace(packMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }

    // Extract Specific Model Number / Name
    let model: string | undefined = undefined;
    let productType = 'product';

    // 1. Earbuds / Airdopes / AirPods: "airdopes 141", "airpods pro 2", "buds t200x"
    const airdopesMatch = cleanText.match(/\b(?:airdopes|air dopes)\s*([a-z0-9]+)\b/i);
    if (airdopesMatch) {
      productType = 'earbuds';
      model = `Airdopes ${airdopesMatch[1]}`.toUpperCase();
      mustInclude.push('Airdopes', airdopesMatch[1]);
      cleanText = cleanText.replace(airdopesMatch[0], ' ').replace(/\s+/g, ' ').trim();
    } else if (/\b(?:airdopes|air dopes)\b/i.test(cleanText)) {
      productType = 'earbuds';
      model = 'Airdopes';
      cleanText = cleanText.replace(/\b(?:airdopes|air dopes)\b/gi, ' ').trim();
    } else if (/\b(?:airpods pro 2|airpods pro 2nd gen)\b/i.test(cleanText)) {
      productType = 'earbuds';
      brand = brand || 'Apple';
      model = 'AirPods Pro 2';
      variant.generation = '2nd Gen';
      mustInclude.push('AirPods', 'Pro', '2');
      cleanText = cleanText.replace(/\b(?:airpods pro 2|airpods pro 2nd gen)\b/gi, ' ').trim();
    } else if (/\b(?:earbuds|earphones|headphones|tws|buds|neckband|earphone)\b/i.test(cleanText)) {
      productType = 'earbuds';
      cleanText = cleanText.replace(/\b(?:earbuds|earphones|headphones|tws|neckband|earphone)\b/gi, ' ').trim();
    }

    const formatModifier = (mod: string): string => {
      if (!mod) return '';
      const lower = mod.toLowerCase().trim();
      if (lower === 'pro max') return 'Pro Max';
      if (lower === 'pro') return 'Pro';
      if (lower === 'plus') return 'Plus';
      if (lower === 'mini') return 'Mini';
      if (lower === 'ultra') return 'Ultra';
      if (lower === 'se') return 'SE';
      if (lower === 'fe') return 'FE';
      if (lower === '5g') return '5G';
      if (lower === '4g') return '4G';
      return mod.charAt(0).toUpperCase() + mod.slice(1);
    };

    // 2. iPhone / Smartphones: "iphone 15", "s24", "galaxy s24"
    const iphoneMatch = cleanText.match(/\b(?:iphone)\s*(16|15|14|13|12|11|se|x|xs|xr)?(?:\s*(pro max|pro|plus|mini))?\b/i);
    const galaxyMatch = cleanText.match(/\b(?:galaxy)\s*(s24|s23|s22|s21|z fold|z flip|a55|a35|m34|m14|m35)?(?:\s*(ultra|plus|fe|5g))?\b/i);
    if (iphoneMatch) {
      productType = 'smartphone';
      brand = 'Apple';
      const num = iphoneMatch[1] || '';
      const varnt = formatModifier(iphoneMatch[2] || '');
      model = `iPhone ${num} ${varnt}`.trim();
      if (num) mustInclude.push(num);
      if (varnt) mustInclude.push(varnt);
      cleanText = cleanText.replace(iphoneMatch[0], ' ').replace(/\s+/g, ' ').trim();
    } else if (galaxyMatch) {
      productType = 'smartphone';
      brand = brand || 'Samsung';
      const num = galaxyMatch[1] ? galaxyMatch[1].toUpperCase() : '';
      const varnt = formatModifier(galaxyMatch[2] || '');
      model = `Galaxy ${num} ${varnt}`.trim();
      if (num) mustInclude.push(num);
      if (varnt) mustInclude.push(varnt);
      cleanText = cleanText.replace(galaxyMatch[0], ' ').replace(/\s+/g, ' ').trim();
    } else if (/\b(?:smart\s*phone|mobile|phone|smartphone)\b/i.test(cleanText)) {
      productType = 'smartphone';
      cleanText = cleanText.replace(/\b(?:smart\s*phone|mobile|phone|smartphone)\b/gi, ' ').trim();
    }

    // 3. Smart TV / Televisions: "43 inch smart tv", "smart tv", "led tv"
    if (/\b(?:smart\s*tv|tv|television|led tv|qled tv|oled tv)\b/i.test(cleanText)) {
      productType = 'smart tv';
      cleanText = cleanText.replace(/\b(?:smart\s*tv|tv|television|led tv|qled tv|oled tv)\b/gi, ' ').trim();
      if (variant.size) {
        mustInclude.push(variant.size);
      }
    }

    // 4. Umbrella: "4 fold umbrella", "fold umbrella", "umbrella"
    if (/\b(?:umbrella|chhatri|kode)\b/i.test(cleanText)) {
      productType = 'umbrella';
      cleanText = cleanText.replace(/\b(?:umbrella|chhatri|kode)\b/gi, ' ').trim();
      if (variant.fold) {
        mustInclude.push(variant.fold);
      }
    }

    // 5. Shoes: "running shoes", "sneakers", "air max 270"
    if (/\b(?:running shoes|sneakers|shoes|shoe)\b/i.test(cleanText)) {
      productType = 'shoes';
      cleanText = cleanText.replace(/\b(?:running shoes|sneakers|shoes|shoe)\b/gi, ' ').trim();
    }

    // Leftover words become Model if not generic adjectives or prepositions
    cleanText = cleanText.replace(/\b(?:on|in|from|by|at|for|of|with|the|a|an|this|that|these|those|me|item|items|phone|mobile)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    const GENERIC_ADJECTIVES = ['wireless', 'bluetooth', 'wired', 'smart', 'portable', 'fold', 'folding', 'automatic', 'manual', 'running', 'casual', 'gym', 'sports', 'men', 'women', 'kids', 'unisex', 'true', 'truly', 'led'];
    if (cleanText.length > 0) {
      const isGenericOnly = cleanText.toLowerCase().split(/\s+/).every(w => GENERIC_ADJECTIVES.includes(w));
      if (!isGenericOnly) {
        if (!model) {
          model = cleanText;
          mustInclude.push(cleanText);
        } else {
          model = `${model} ${cleanText}`.trim();
        }
      } else {
        mustInclude.push(cleanText);
      }
    }

    if (brand && !mustInclude.includes(brand)) {
      mustInclude.unshift(brand);
    }

    const isSpecific = Boolean(brand || model);

    // Check for ambiguity
    let clarificationNeeded = false;
    let clarificationQuestion: string | undefined = undefined;
    if (rawQuery.toLowerCase().includes('airpods') && !rawQuery.toLowerCase().includes('pro') && !rawQuery.toLowerCase().includes('3') && !rawQuery.toLowerCase().includes('2')) {
      clarificationNeeded = false; // default to general AirPods
    }

    const spec: ProductSpec = {
      rawQuery,
      englishQuery,
      productType,
      brand,
      model,
      variant,
      mustInclude: Array.from(new Set(mustInclude.filter(Boolean))),
      mustExclude: [],
      budgetMin,
      budgetMax,
      preference,
      isSpecific,
      cleanSearchQuery: '',
      alternativeQueries: [],
      clarificationNeeded,
      clarificationQuestion
    };

    return spec;
  }

  /**
   * Parses spec with Gemini in strict JSON mode.
   */
  private async extractWithGemini(rawQuery: string, englishQuery: string, baselineSpec: ProductSpec): Promise<ProductSpec | null> {
    const prompt = `You are VoiceCart's core Query Understanding & Spec Extraction Engine.
Analyze the user's shopping query in English, Hindi, or Kannada and output a strict structured specification JSON.

The user query is: "${rawQuery}" (English translation: "${englishQuery}")

Strict JSON Schema:
{
  "rawQuery": string,
  "englishQuery": string,
  "productType": string (e.g. "earbuds", "smartphone", "smart tv", "umbrella", "shoes", "laptop", "watch"),
  "brand": string or null (e.g. "boAt", "Apple", "Samsung", "Livesmart"),
  "model": string or null (e.g. "Airdopes 141", "15", "Crystal 4K", "4 fold"),
  "variant": {
    "storage": string or null (e.g. "128GB"),
    "ram": string or null,
    "color": string or null (e.g. "Black"),
    "size": string or null (e.g. "43 inch"),
    "pack": string or null,
    "fold": string or null (e.g. "4 fold")
  },
  "mustInclude": string[] (crucial tokens that must be present in relevant products),
  "mustExclude": string[] (terms that disqualify a product, like accessories unless requested),
  "budgetMin": number or null,
  "budgetMax": number or null,
  "preference": "balanced" | "cheapest" | "best_rated" | "fastest",
  "isSpecific": boolean (true if brand or specific model is mentioned),
  "clarificationNeeded": boolean,
  "clarificationQuestion": string or null
}`;

    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (const modelName of modelsToTry) {
      try {
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.geminiApiKey}`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.0
            }
          },
          { timeout: 2500 }
        );

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text) as ProductSpec;
          if (parsed && parsed.productType) {
            let model = parsed.model || baselineSpec.model;
            if (parsed.brand?.toLowerCase() === 'apple' && model && !model.toLowerCase().includes('iphone') && !model.toLowerCase().includes('airpods')) {
              model = `iPhone ${model}`.trim();
            }
            return {
              ...parsed,
              rawQuery,
              model,
              englishQuery: parsed.englishQuery || englishQuery,
              budgetMax: parsed.budgetMax || baselineSpec.budgetMax,
              budgetMin: parsed.budgetMin || baselineSpec.budgetMin,
              cleanSearchQuery: '',
              alternativeQueries: []
            };
          }
        }
      } catch (err: any) {
        // try next model or fallback
      }
    }

    return null;
  }

  /**
   * Applies default accessory excludes unless the user explicitly requested them.
   */
  public applyDefaultExcludes(spec: ProductSpec): void {
    const rawLower = (spec.rawQuery + ' ' + spec.englishQuery).toLowerCase();
    const activeExcludes: string[] = [];

    for (const term of DEFAULT_ACCESSORY_EXCLUDES) {
      // If user specifically asked for "case" or "cover" or "strap" or "charger", DO NOT exclude it!
      if (!rawLower.includes(term)) {
        activeExcludes.push(term);
      }
    }

    // Merge with any custom excludes
    spec.mustExclude = Array.from(new Set([...(spec.mustExclude || []), ...activeExcludes]));
  }

  /**
   * Builds clean, search-engine-optimized queries and alternative phrasings.
   */
  public buildCleanQueries(spec: ProductSpec): void {
    const parts: string[] = [];
    if (spec.brand) parts.push(spec.brand);
    if (spec.model) parts.push(spec.model);
    if (spec.productType && spec.productType !== 'product' && !spec.model?.toLowerCase().includes(spec.productType.toLowerCase())) {
      parts.push(spec.productType);
    }
    if (spec.variant?.storage) parts.push(spec.variant.storage);
    if (spec.variant?.color) parts.push(spec.variant.color);
    if (spec.variant?.size) parts.push(spec.variant.size);
    if (spec.variant?.fold) parts.push(spec.variant.fold);

    const primaryQuery = parts.length > 0 ? parts.join(' ') : spec.englishQuery;
    spec.cleanSearchQuery = primaryQuery;

    // Build 1-2 clean alternative phrasings
    const alternatives: string[] = [];
    if (spec.brand && spec.model) {
      alternatives.push(`${spec.brand} ${spec.model}`);
    }
    if (spec.brand && spec.productType && spec.productType !== 'product') {
      alternatives.push(`${spec.brand} ${spec.productType}`);
      if (['Mi', 'Xiaomi', 'Redmi'].includes(spec.brand) && spec.productType === 'smart tv') {
        alternatives.push('Xiaomi 4K Smart TV');
        alternatives.push('Mi LED TV');
      }
    }
    if (spec.model && spec.variant?.storage) {
      alternatives.push(`${spec.model} ${spec.variant.storage}`);
    }

    spec.alternativeQueries = Array.from(new Set(alternatives.filter((a) => a !== primaryQuery)));
  }

  private buildDefaultSpec(rawQuery: string): ProductSpec {
    return {
      rawQuery,
      englishQuery: rawQuery,
      productType: 'product',
      mustInclude: [],
      mustExclude: [...DEFAULT_ACCESSORY_EXCLUDES],
      preference: 'balanced',
      isSpecific: false,
      cleanSearchQuery: rawQuery,
      alternativeQueries: []
    };
  }
}

export const querySpecExtractor = new QuerySpecExtractor();
