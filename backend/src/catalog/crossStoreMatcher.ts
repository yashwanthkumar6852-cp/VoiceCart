import crypto from 'crypto';
import { Product } from '../types/product';

export class CrossStoreMatcher {
  /**
   * Cleans title and attributes to extract brand, normalized model, and variant.
   */
  public static extractProductSignature(product: {
    title: string;
    brand?: string;
    model?: string;
    variantText?: string;
    category?: string;
  }): { brand: string; modelTokens: string[]; variantTokens: string[]; cleanSignature: string } {
    const title = (product.title || '').toLowerCase();
    let brand = (product.brand || '').toLowerCase().trim();

    // Known common brands
    const KNOWN_BRANDS = [
      'apple', 'samsung', 'oneplus', 'xiaomi', 'redmi', 'realme', 'boat', 'noise', 'fire-boltt',
      'sony', 'lg', 'whirlpool', 'haier', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'canon',
      'nikon', 'philips', 'bajaj', 'prestige', 'pigeon', 'nike', 'adidas', 'puma', 'casio'
    ];

    if (!brand) {
      for (const b of KNOWN_BRANDS) {
        if (title.startsWith(b) || title.includes(` ${b} `) || title.includes(`(${b})`)) {
          brand = b;
          break;
        }
      }
    }

    // Extract storage/memory variants
    const variantTokens: string[] = [];
    const storageMatch = title.match(/(\d+\s*(?:gb|tb|mb))\b/gi);
    if (storageMatch) {
      storageMatch.forEach(m => variantTokens.push(m.toLowerCase().replace(/\s+/g, '')));
    }

    // Extract screen size variants
    const screenMatch = title.match(/(\d+(?:\.\d+)?)\s*(?:inch|inches|cm|\")/gi);
    if (screenMatch) {
      screenMatch.forEach(m => variantTokens.push(m.toLowerCase().replace(/\s+/g, '')));
    }

    // Extract color variants
    const COMMON_COLORS = ['black', 'blue', 'white', 'green', 'gold', 'silver', 'grey', 'gray', 'red', 'purple', 'midnight', 'starlight'];
    for (const c of COMMON_COLORS) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(title)) {
        variantTokens.push(c);
        break;
      }
    }

    // Remove noise words from title to get core model tokens
    const noiseWords = new Set([
      'the', 'with', 'for', 'and', 'new', 'latest', 'pro', 'max', 'plus', 'ultra',
      'edition', 'series', 'official', 'original', 'pack', 'of', 'combo', 'online',
      'best', 'sale', 'india', 'in', 'at', 'on', 'buy', 'free', 'delivery', 'warranty'
    ]);

    // Tokenize
    const rawTokens = title
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !noiseWords.has(t));

    const modelTokens = rawTokens.filter(t => !variantTokens.includes(t) && t !== brand).slice(0, 4);

    const cleanSignature = `${brand}_${modelTokens.sort().join('-')}_${variantTokens.sort().join('-')}`;

    return {
      brand,
      modelTokens,
      variantTokens,
      cleanSignature
    };
  }

  /**
   * Computes a deterministic matchGroupId for cross-store product comparison.
   * If two products have >= 90% confidence match across brand, model and variant,
   * they receive the same matchGroupId.
   */
  public static computeMatchGroupId(product: {
    title: string;
    brand?: string;
    model?: string;
    variantText?: string;
    category?: string;
  }): string {
    const { brand, cleanSignature } = this.extractProductSignature(product);

    if (!brand || cleanSignature.length < 5) {
      // Return a unique hash if matching isn't confident enough
      return `mg_single_${crypto.createHash('md5').update(product.title).digest('hex').slice(0, 12)}`;
    }

    const hash = crypto.createHash('md5').update(cleanSignature).digest('hex').slice(0, 12);
    return `mg_${brand}_${hash}`;
  }

  /**
   * Calculates similarity confidence (0.0 to 1.0) between two products.
   */
  public static calculateConfidence(p1: Product, p2: Product): number {
    const sig1 = this.extractProductSignature(p1);
    const sig2 = this.extractProductSignature(p2);

    if (sig1.brand && sig2.brand && sig1.brand !== sig2.brand) {
      return 0.0;
    }

    let matches = 0;
    const allModelTokens = new Set([...sig1.modelTokens, ...sig2.modelTokens]);
    if (allModelTokens.size === 0) return 0.5;

    for (const t of sig1.modelTokens) {
      if (sig2.modelTokens.includes(t)) matches++;
    }

    const modelConfidence = (matches * 2) / (sig1.modelTokens.length + sig2.modelTokens.length);

    // Check variant match
    let variantScore = 1.0;
    if (sig1.variantTokens.length > 0 && sig2.variantTokens.length > 0) {
      const commonVariants = sig1.variantTokens.filter(v => sig2.variantTokens.includes(v));
      variantScore = commonVariants.length > 0 ? 1.0 : 0.6;
    }

    return modelConfidence * 0.7 + variantScore * 0.3;
  }
}
