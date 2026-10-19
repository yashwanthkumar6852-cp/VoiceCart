export interface ParsedProductQuery {
  rawQuery: string;
  cleanQuery: string;
  brand?: string;
  product?: string;
  model?: string;
  modelNumber?: string;
  variant?: string;
  storage?: string;
  ram?: string;
  size?: string;
  color?: string;
  generation?: string;
  quantity?: number;
  displayName: string;
}

const KNOWN_BRANDS = [
  'apple', 'samsung', 'nike', 'adidas', 'puma', 'hp', 'dell', 'lenovo', 'asus', 'acer',
  'sony', 'boat', 'noise', 'oneplus', 'xiaomi', 'redmi', 'realme', 'google', 'bose',
  'jbl', 'boult', 'zebronics', 'lg', 'motorola', 'oppo', 'vivo', 'nothing'
];

const FILLER_PHRASES = [
  /\b(?:show me|show|i want|want|find me|find|give me|give|get me|get|look for|search for|search|compare|buy me|buy|add to cart|add|please|can you show|can you get|for me)\b/gi,
  /\b(?:mujhe chahiye|chahiye|dikhao|batao|dhundo|khojo|lao|de do|kharidna hai|tulanatmak|tula)\b/gi,
  /\b(?:torisu|nodisu|beku|kodi|thoo|huduku|kharidisi|nodbeku|heli|serisu)\b/gi,
  /\b(?:under|below|less than|ke andar|ke niche|olage|kadime)\s*(?:₹|rs|rupees)?\s*\d+\b/gi
];

export class QueryExtractor {
  public extract(rawText: string): ParsedProductQuery {
    if (!rawText || !rawText.trim()) {
      return {
        rawQuery: '',
        cleanQuery: '',
        displayName: 'All Products'
      };
    }

    const rawQuery = rawText.trim();
    let cleaned = rawQuery.toLowerCase();

    for (const pattern of FILLER_PHRASES) {
      cleaned = cleaned.replace(pattern, ' ');
    }
    cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡!"']/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    let brand: string | undefined = undefined;
    let product: string | undefined = undefined;
    let model: string | undefined = undefined;
    let modelNumber: string | undefined = undefined;
    let variant: string | undefined = undefined;
    let storage: string | undefined = undefined;
    let ram: string | undefined = undefined;
    let generation: string | undefined = undefined;
    let color: string | undefined = undefined;
    let size: string | undefined = undefined;
    let quantity: number | undefined = undefined;

    // Quantity
    const qtyMatch = cleaned.match(/\b(\d+)\s*(?:units?|pieces?|items?|qty|quantit(?:y|ies))\b/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1], 10);
      cleaned = cleaned.replace(qtyMatch[0], ' ').trim();
    }

    // Storage
    const storageMatch = cleaned.match(/\b(64|128|256|512)\s*(?:gb|gigabytes?)\b|\b(1|2)\s*(?:tb|terabytes?)\b/i);
    if (storageMatch) {
      if (storageMatch[1]) {
        storage = `${storageMatch[1]}GB`.toUpperCase();
      } else if (storageMatch[2]) {
        storage = `${storageMatch[2]}TB`.toUpperCase();
      }
      cleaned = cleaned.replace(storageMatch[0], ' ').trim();
    }

    // RAM
    const ramMatch = cleaned.match(/\b(4|6|8|12|16|32|64)\s*(?:gb|gigabytes?)?\s*ram\b/i);
    if (ramMatch) {
      ram = `${ramMatch[1]}GB RAM`.toUpperCase();
      cleaned = cleaned.replace(ramMatch[0], ' ').trim();
    }

    // Generation / Version
    const genMatch = cleaned.match(/\b(?:pro\s*2|2nd\s*gen(?:eration)?|gen\s*2|generation\s*2|3rd\s*gen(?:eration)?|gen\s*3)\b/i);
    if (genMatch) {
      const g = genMatch[0].toLowerCase();
      if (g.includes('pro 2') || g.includes('2')) {
        generation = '2nd Gen / Pro 2';
      } else if (g.includes('3')) {
        generation = '3rd Gen';
      }
      if (g.includes('pro 2')) {
        variant = 'Pro';
      }
      cleaned = cleaned.replace(genMatch[0], ' ').trim();
    }

    // Variant
    if (/\bpro\s*max\b/i.test(cleaned)) {
      variant = 'Pro Max';
      cleaned = cleaned.replace(/\bpro\s*max\b/gi, ' ').trim();
    } else if (/\bpro\b/i.test(cleaned)) {
      variant = 'Pro';
      cleaned = cleaned.replace(/\bpro\b/gi, ' ').trim();
    } else if (/\bplus\b/i.test(cleaned)) {
      variant = 'Plus';
      cleaned = cleaned.replace(/\bplus\b/gi, ' ').trim();
    } else if (/\bultra\b/i.test(cleaned)) {
      variant = 'Ultra';
      cleaned = cleaned.replace(/\bultra\b/gi, ' ').trim();
    } else if (/\bfe\b/i.test(cleaned)) {
      variant = 'FE';
      cleaned = cleaned.replace(/\bfe\b/gi, ' ').trim();
    } else if (/\bmini\b/i.test(cleaned)) {
      variant = 'Mini';
      cleaned = cleaned.replace(/\bmini\b/gi, ' ').trim();
    } else if (/\bmax\b/i.test(cleaned) && !cleaned.includes('air max')) {
      variant = 'Max';
      cleaned = cleaned.replace(/\bmax\b/gi, ' ').trim();
    }

    // Color
    const colorMatch = cleaned.match(/\b(black|white|blue|green|pink|yellow|silver|gold|midnight|starlight|space grey|natural titanium|titanium)\b/i);
    if (colorMatch) {
      color = colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1).toLowerCase();
      cleaned = cleaned.replace(colorMatch[0], ' ').trim();
    }

    // Size
    const sizeMatch = cleaned.match(/\b(?:uk|us|size)\s*(\d+(?:\.\d+)?)\b|\b(\d+(?:\.\d+)?)\s*(?:inch|inches)\b/i);
    if (sizeMatch) {
      size = sizeMatch[0];
      cleaned = cleaned.replace(sizeMatch[0], ' ').trim();
    }

    // Specific Brand and Models
    const iphoneMatch = cleaned.match(/\b(?:apple\s+)?iphone\s*(16|15|14|13|12|11|se|x|xs|xr)\b/i);
    if (iphoneMatch) {
      brand = 'Apple';
      product = 'iPhone';
      model = iphoneMatch[1].toUpperCase();
      cleaned = cleaned.replace(iphoneMatch[0], ' ').trim();
    } else if (/\b(?:apple\s+)?airpods\b/i.test(cleaned)) {
      brand = 'Apple';
      product = 'AirPods';
      if (generation?.includes('Pro 2') || variant === 'Pro') {
        model = 'Pro 2';
      } else if (cleaned.includes('3')) {
        model = '3';
      }
      cleaned = cleaned.replace(/\b(?:apple\s+)?airpods\b/gi, ' ').trim();
    }

    const samsungMatch = cleaned.match(/\b(?:samsung\s+)?(?:galaxy\s+)?(s24|s23|s22|s21|z\s*fold\s*6|z\s*flip\s*6|m34|m14|a55|a35)\b/i);
    if (samsungMatch) {
      brand = 'Samsung';
      product = 'Galaxy';
      model = samsungMatch[1].toUpperCase().replace(/\s+/g, ' ');
      cleaned = cleaned.replace(samsungMatch[0], ' ').trim();
    }

    const nikeAirMaxMatch = cleaned.match(/\b(?:nike\s+)?air\s*max\s*(270|90|97|plus|sc|excee)?\b/i);
    if (nikeAirMaxMatch) {
      brand = 'Nike';
      product = 'Air Max';
      if (nikeAirMaxMatch[1]) {
        model = nikeAirMaxMatch[1].toUpperCase();
      }
      cleaned = cleaned.replace(nikeAirMaxMatch[0], ' ').trim();
    }

    const hpMatch = cleaned.match(/\b(?:hp\s+)?pavilion\s*(15|14|16|x360|plus)?\b/i);
    if (hpMatch) {
      brand = 'HP';
      product = 'Pavilion';
      if (hpMatch[1]) {
        model = hpMatch[1].toUpperCase();
      }
      cleaned = cleaned.replace(hpMatch[0], ' ').trim();
    }

    if (!brand) {
      for (const kb of KNOWN_BRANDS) {
        const regex = new RegExp(`\\b${kb}\\b`, 'i');
        if (regex.test(cleaned)) {
          brand = kb.charAt(0).toUpperCase() + kb.slice(1);
          cleaned = cleaned.replace(regex, ' ').trim();
          break;
        }
      }
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (!product && cleaned.length > 0) {
      product = cleaned;
    } else if (product && !model && cleaned.length > 0) {
      model = cleaned;
    }

    const parts: string[] = [];
    if (brand) parts.push(brand);
    if (product) parts.push(product);
    if (model && !product?.toLowerCase().includes(model.toLowerCase())) parts.push(model);
    if (variant && !product?.toLowerCase().includes(variant.toLowerCase())) parts.push(variant);
    if (generation && !parts.some(p => p.includes(generation!))) parts.push(generation);
    if (storage) parts.push(storage);
    if (ram) parts.push(ram);
    if (color) parts.push(color);
    if (size) parts.push(size);

    const displayName = parts.length > 0 ? parts.join(' ') : rawQuery;

    return {
      rawQuery,
      cleanQuery: cleaned,
      brand,
      product,
      model,
      modelNumber,
      variant,
      storage,
      ram,
      size,
      color,
      generation,
      quantity,
      displayName
    };
  }
}

export const queryExtractor = new QueryExtractor();
