import { Product, ProductSpec, RejectionRecord, StoreName } from '../types/product';

export interface EvaluatedProduct {
  product: Product;
  relevanceScore: number;       // 0 to 100
  isExactMatch: boolean;        // true if score >= 80 and passes all hard rules
  isPartialMatch: boolean;      // true if score >= 55 and < 80
  isSimilar: boolean;           // true if score >= 35 and < 55
  isAccessory: boolean;
  passedRelevanceFilter: boolean;
  rejectionReason?: string;
  matchReasons: string[];
}

export interface FilterOutcome {
  exactMatches: Product[];
  partialMatches: Product[];
  similarProducts: Product[];
  allFilteredProducts: Product[];
  rejections: RejectionRecord[];
  evaluatedList: EvaluatedProduct[];
}

export class RelevanceFilter {
  /**
   * Filters and scores a raw list of products against the user's structured ProductSpec.
   */
  public evaluateProducts(products: Product[], spec: ProductSpec, maxBudget?: number, minBudget?: number): FilterOutcome {
    const evaluatedList: EvaluatedProduct[] = [];
    const rejections: RejectionRecord[] = [];

    const effectiveMaxBudget = maxBudget || spec.budgetMax;
    const effectiveMinBudget = minBudget || spec.budgetMin;

    for (const p of products) {
      const evalResult = this.evaluateSingleProduct(p, spec, effectiveMaxBudget, effectiveMinBudget);
      evaluatedList.push(evalResult);

      if (!evalResult.passedRelevanceFilter) {
        rejections.push({
          title: p.title,
          store: p.store,
          price: p.price,
          rejectionReason: evalResult.rejectionReason || 'Failed relevance criteria',
          relevanceScore: evalResult.relevanceScore
        });
      }
    }

    // Median price sanity check: If an item is < 35% of the median price of matched items in high-value categories (smartphones, laptops, TVs), reject it
    const candidatePrices = evaluatedList
      .filter((e) => e.passedRelevanceFilter && e.product.price > 1000)
      .map((e) => e.product.price)
      .sort((a, b) => a - b);

    if (candidatePrices.length >= 2 && ['smartphone', 'laptop', 'smart tv', 'tv'].includes(spec.productType)) {
      const mid = Math.floor(candidatePrices.length / 2);
      const medianPrice = candidatePrices.length % 2 === 0 ? (candidatePrices[mid - 1] + candidatePrices[mid]) / 2 : candidatePrices[mid];
      const minSanityThreshold = medianPrice * 0.35;

      for (const item of evaluatedList) {
        if (item.passedRelevanceFilter && item.product.price < minSanityThreshold) {
          item.passedRelevanceFilter = false;
          item.isExactMatch = false;
          item.isPartialMatch = false;
          item.isSimilar = false;
          item.isAccessory = true;
          item.rejectionReason = `Suspicious price ₹${item.product.price} is under 35% of median (₹${Math.round(medianPrice)}), flagged as accessory`;
          rejections.push({
            title: item.product.title,
            store: item.product.store,
            price: item.product.price,
            rejectionReason: item.rejectionReason,
            relevanceScore: item.relevanceScore
          });
        }
      }
    }

    const exactMatches: Product[] = [];
    const partialMatches: Product[] = [];
    const similarProducts: Product[] = [];

    for (const item of evaluatedList) {
      if (!item.passedRelevanceFilter) continue;

      const enrichedProduct: Product = {
        ...item.product,
        relevanceScore: item.relevanceScore,
        matchType: item.isExactMatch ? 'EXACT' : item.isPartialMatch ? 'PARTIAL' : 'SIMILAR',
        reason: item.matchReasons.join(', ')
      };

      if (item.isExactMatch) {
        exactMatches.push(enrichedProduct);
      } else if (item.isPartialMatch) {
        partialMatches.push(enrichedProduct);
      } else if (item.isSimilar) {
        similarProducts.push(enrichedProduct);
      }
    }

    // Sort by relevance score descending
    exactMatches.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    partialMatches.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    similarProducts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    const allFilteredProducts = [...exactMatches, ...partialMatches, ...similarProducts];

    return {
      exactMatches,
      partialMatches,
      similarProducts,
      allFilteredProducts,
      rejections,
      evaluatedList
    };
  }

  public evaluateSingleProduct(
    product: Product,
    spec: ProductSpec,
    maxBudget?: number,
    minBudget?: number
  ): EvaluatedProduct {
    const title = (product.title || '').toLowerCase();
    const highlights = (product.highlights || []).join(' ').toLowerCase();
    const seller = (product.seller || '').toLowerCase();
    const fullText = `${title} ${highlights} ${seller}`;

    const matchReasons: string[] = [];
    let score = 0;
    let isAccessory = false;
    let rejectionReason: string | undefined = undefined;

    // 1. HARD RULE: Out of Stock
    if (!product.inStock) {
      return {
        product,
        relevanceScore: 0,
        isExactMatch: false,
        isPartialMatch: false,
        isSimilar: false,
        isAccessory: false,
        passedRelevanceFilter: false,
        rejectionReason: 'Out of stock',
        matchReasons: []
      };
    }

    // 2. HARD RULE: Must Exclude words (Accessories & Spare Parts)
    // Examples: "case", "cover", "strap", "skin", "protector", "tempered glass", "charger", "cable", "adapter", "stand", "holder", "dummy", "replica", "toy"
    const ACCESSORY_TERMS = [
      'case', 'cover', 'back cover', 'skin', 'screen protector', 'screen guard',
      'tempered glass', 'charger', 'cable', 'adapter', 'stand', 'strap', 'holder',
      'dummy', 'replica', 'compatible with', 'for iphone', 'for galaxy', 'spare', 'toy',
      'protective case', 'silicone case', 'flip cover', 'pouch', 'sleeve', 'ear tips'
    ];

    const activeExcludes = Array.from(new Set([...(spec.mustExclude || []), ...ACCESSORY_TERMS]));
    const rawLower = (spec.rawQuery || '').toLowerCase();

    for (const term of activeExcludes) {
      // If user explicitly asked for case / cover / charger / cable, do not disqualify
      if (rawLower.includes(term)) continue;

      if (term === 'case') {
        if (/\b(?:with|including|\+)\s+(?:magsafe\s+)?(?:charging\s+)?case\b|\b(?:charging|magsafe)\s+case\b/i.test(title)) {
          // Legitimate bundled charging case on earbuds/earphones, not a standalone case accessory
          continue;
        }
      }
      const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (termRegex.test(title) || (term === 'cover only' && title.includes('cover only'))) {
        isAccessory = true;
        rejectionReason = `Accessory/Disqualified: contains excluded word "${term}"`;
        return {
          product,
          relevanceScore: 0,
          isExactMatch: false,
          isPartialMatch: false,
          isSimilar: false,
          isAccessory: true,
          passedRelevanceFilter: false,
          rejectionReason,
          matchReasons: []
        };
      }
    }

    // Explicit Accessory checks when user is looking for electronics/apparel
    if (
      ['earbuds', 'smartphone', 'smart tv', 'laptop', 'watch', 'umbrella'].includes(spec.productType) &&
      !rawLower.includes('case') &&
      !rawLower.includes('cover') &&
      !rawLower.includes('charger')
    ) {
      if (
        /\b(?:silicone case|case cover|protective case|skin wrap|back cover|tempered glass|screen protector|charging case only|pouch only|mobile cover|back skin)\b/i.test(title)
      ) {
        return {
          product,
          relevanceScore: 0,
          isExactMatch: false,
          isPartialMatch: false,
          isSimilar: false,
          isAccessory: true,
          passedRelevanceFilter: false,
          rejectionReason: 'Accessory item detected (case/cover/skin/protector)',
          matchReasons: []
        };
      }
    }

    // 3. CATEGORY PRICE SANITY CHECKS (Fixes ₹599 iPhone accessories / false phone matches)
    const categoryMinPrices: Record<string, number> = {
      smartphone: 4500,
      laptop: 15000,
      'smart tv': 6500,
      tv: 6500,
      watch: 700
    };

    const minCategoryPrice = categoryMinPrices[spec.productType];
    if (minCategoryPrice && product.price < minCategoryPrice && !rawLower.includes('case') && !rawLower.includes('cover') && !rawLower.includes('strap') && !rawLower.includes('cable')) {
      return {
        product,
        relevanceScore: 0,
        isExactMatch: false,
        isPartialMatch: false,
        isSimilar: false,
        isAccessory: true,
        passedRelevanceFilter: false,
        rejectionReason: `Suspiciously low price ₹${product.price} for a ${spec.productType} (minimum expected ₹${minCategoryPrice}), flagged as accessory`,
        matchReasons: []
      };
    }

    // 4. HARD RULE: Budget constraints (with 10% soft tolerance margin for maxBudget)
    if (maxBudget && maxBudget > 0) {
      const price = product.price + (product.shippingFee || 0);
      if (price > maxBudget * 1.15) {
        return {
          product,
          relevanceScore: 0,
          isExactMatch: false,
          isPartialMatch: false,
          isSimilar: false,
          isAccessory: false,
          passedRelevanceFilter: false,
          rejectionReason: `Price ₹${price} exceeds max budget ₹${maxBudget}`,
          matchReasons: []
        };
      }
    }

    if (minBudget && minBudget > 0) {
      const price = product.price;
      if (price < minBudget * 0.75) {
        return {
          product,
          relevanceScore: 0,
          isExactMatch: false,
          isPartialMatch: false,
          isSimilar: false,
          isAccessory: false,
          passedRelevanceFilter: false,
          rejectionReason: `Price ₹${price} is below min budget ₹${minBudget}`,
          matchReasons: []
        };
      }
    }

    // 5. BRAND EVALUATION
    let brandMatched = false;
    if (spec.brand) {
      const brandLower = spec.brand.toLowerCase();
      const isXiaomiFamily = ['mi', 'xiaomi', 'redmi'].includes(brandLower);
      const brandPattern = isXiaomiFamily
        ? '\\b(mi|xiaomi|redmi)\\b'
        : `\\b${brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
      const brandRegex = new RegExp(brandPattern, 'i');

      if (brandRegex.test(title) || brandRegex.test(seller)) {
        score += 25;
        brandMatched = true;
        matchReasons.push(`Brand: ${spec.brand}`);
      } else {
        // If query isSpecific (brand was requested) and the product explicitly belongs to a rival brand -> Hard Drop
        const rivalBrands = ['apple', 'samsung', 'boat', 'oneplus', 'sony', 'noise', 'realme', 'boult', 'ptron', 'xiaomi', 'mi', 'redmi', 'lg', 'livesmart', 'nike', 'adidas']
          .filter(b => {
            if (isXiaomiFamily && ['xiaomi', 'mi', 'redmi'].includes(b)) return false;
            return b !== brandLower;
          });

        const foundRival = rivalBrands.find(b => new RegExp(`\\b${b}\\b`, 'i').test(title));
        if (spec.isSpecific && foundRival) {
          return {
            product,
            relevanceScore: 5,
            isExactMatch: false,
            isPartialMatch: false,
            isSimilar: false,
            isAccessory: false,
            passedRelevanceFilter: false,
            rejectionReason: `Brand mismatch: requested ${spec.brand}, but product is ${foundRival}`,
            matchReasons: []
          };
        }
      }
    } else {
      score += 20; // No brand restriction requested
    }

    // 6. PRODUCT TYPE EVALUATION
    let typeMatched = false;
    if (spec.productType && spec.productType !== 'product') {
      const typeLower = spec.productType.toLowerCase();

      const isEarbudsType = /earbud|earphone|tws|headset|airdopes|airpod|audio/i.test(typeLower);
      const isPhoneType = /phone|smartphone|mobile|iphone/i.test(typeLower);
      const isTvType = /tv|television|smart\s*tv/i.test(typeLower);
      const isUmbrellaType = /umbrella|chhatri/i.test(typeLower);

      if (isEarbudsType && /\b(earbuds|airdopes|airpods|earphones|tws|headset|headphone|in-ear|in ear|buds)\b/i.test(title)) {
        typeMatched = true;
      } else if (isPhoneType && /\b(iphone|smartphone|phone|mobile|galaxy|handset)\b/i.test(title)) {
        typeMatched = true;
      } else if (isTvType && /\b(tv|television|smart tv|led|qled|crystal uhd|oled)\b/i.test(title)) {
        typeMatched = true;
      } else if (isUmbrellaType && /\b(umbrella|chhatri)\b/i.test(title)) {
        typeMatched = true;
      } else {
        // Token match on any product type word
        const words = typeLower.split(/\s+/).filter(w => w.length > 2);
        if (words.some(w => title.includes(w) || highlights.includes(w))) {
          typeMatched = true;
        }
      }

      if (typeMatched) {
        score += 25;
        matchReasons.push(`Type: ${spec.productType}`);
      } else {
        score -= 15;
      }
    } else {
      score += 20;
    }

    // 7. STRICT MODEL & SUFFIX EVALUATION
    let modelMatched = false;
    let isStrictModifierMatch = true;
    let modifierReason: string | undefined = undefined;

    if (spec.model) {
      const modelClean = spec.model.toLowerCase().trim();
      const modelTokens = modelClean.split(/\s+/).filter(t => t.length >= 2 && !['and', 'the', 'for'].includes(t));

      let matchedTokens = 0;
      for (const token of modelTokens) {
        let pattern = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (/^\d+$/.test(token)) {
          pattern = `${token}(?:st|nd|rd|th)?`;
        }
        const tokenRegex = new RegExp(`(?:^|\\b|\\s)${pattern}(?:$|\\b|\\s)`, 'i');
        if (tokenRegex.test(title) || tokenRegex.test(highlights)) {
          matchedTokens++;
        }
      }

      // Modifier Discrimination (Plus, Pro, Pro Max, Max, Mini, Ultra, SE, FE, Lite, 3rd Gen, 2nd Gen)
      const modifiers = ['pro max', 'ultra', 'pro', 'plus', 'max', 'mini', 'fe', 'se', 'lite', '3rd gen', '2nd gen', '1st gen'];
      const queryMod = modifiers.find(m => new RegExp(`\\b${m}\\b`, 'i').test(spec.model || ''));
      const titleMod = modifiers.find(m => new RegExp(`\\b${m}\\b`, 'i').test(title));

      if (queryMod && !titleMod) {
        // Query wanted "Plus" (e.g. iPhone 14 Plus) but title is base model (iPhone 14)
        isStrictModifierMatch = false;
        modelMatched = false;
        score += 10; // Partial score for being same generation
        modifierReason = `Different model: ${spec.model?.split(/\s+/)[0] || 'Base model'} instead of ${spec.model}`;
        matchReasons.push(modifierReason);
      } else if (!queryMod && titleMod) {
        // Query wanted base model (e.g. iPhone 14) but title has modifier (iPhone 14 Plus / Pro)
        isStrictModifierMatch = false;
        modelMatched = false;
        score += 10;
        modifierReason = `Different model: ${titleMod.toUpperCase()} instead of standard ${spec.model}`;
        matchReasons.push(modifierReason);
      } else if (queryMod && titleMod && queryMod !== titleMod) {
        // Query wanted "Plus" but title is "Pro" or "Pro Max"
        isStrictModifierMatch = false;
        modelMatched = false;
        score -= 20;
        modifierReason = `Different tier: ${titleMod.toUpperCase()} instead of ${queryMod.toUpperCase()}`;
        matchReasons.push(modifierReason);
      } else if (modelTokens.length > 0 && matchedTokens === modelTokens.length) {
        score += 30;
        modelMatched = true;
        matchReasons.push(`Model: ${spec.model}`);
      } else if (matchedTokens > 0) {
        // Partial model token match
        const missingKeyToken = modelTokens.find(
          (tok) => /\d+/.test(tok) && !new RegExp(`(?:^|\\b|\\s)${tok}(?:$|\\b|\\s)`, 'i').test(title)
        );

        if (missingKeyToken && spec.isSpecific) {
          // Different generation number (e.g. 13 or 15 when 14 asked) -> Similar alternative, NOT exact
          score += 10;
          isStrictModifierMatch = false;
          modelMatched = false;
          modifierReason = `Different generation: missing ${missingKeyToken}`;
          matchReasons.push(modifierReason);
        } else {
          score += Math.round(20 * (matchedTokens / modelTokens.length));
          matchReasons.push(`Partial model match (${matchedTokens}/${modelTokens.length})`);
        }
      } else {
        if (spec.isSpecific) {
          return {
            product,
            relevanceScore: 10,
            isExactMatch: false,
            isPartialMatch: false,
            isSimilar: false,
            isAccessory: false,
            passedRelevanceFilter: false,
            rejectionReason: `Model mismatch: requested ${spec.model}`,
            matchReasons: []
          };
        }
        score -= 25;
      }
    } else {
      score += 20;
    }

    // 8. VARIANT & ATTRIBUTE DISCRIMINATION (Storage, Color, Screen Size, Fold, Pack)
    if (spec.variant) {
      // Storage (e.g. 128GB)
      if (spec.variant.storage) {
        const s = spec.variant.storage.toLowerCase();
        const sRegex = new RegExp(`\\b${s}\\b`, 'i');
        if (sRegex.test(title) || sRegex.test(fullText)) {
          score += 15;
          matchReasons.push(`Storage: ${spec.variant.storage}`);
        } else {
          // If different storage is specified in title (e.g. 256GB when 128GB asked)
          if (/\b(64gb|256gb|512gb|1tb)\b/i.test(title)) {
            score -= 15;
          }
        }
      }

      // RAM (e.g. 16GB RAM)
      if (spec.variant.ram) {
        const rNum = spec.variant.ram.match(/\d+/)?.[0];
        if (rNum) {
          const rRegex = new RegExp(`\\b${rNum}\\s*(?:gb)?(?:\\s+[a-z0-9]+)?\\s*ram\\b|\\b${rNum}\\s*gb\\b`, 'i');
          if (rRegex.test(title) || rRegex.test(fullText)) {
            score += 15;
            matchReasons.push(`RAM: ${spec.variant.ram}`);
          } else if (/\b(4|6|8|12|32|64)\s*(?:gb)?(?:\\s+[a-z0-9]+)?\\s*ram\\b/i.test(title) || /\b(4|6|8|12|32|64)\s*gb\\b/i.test(title)) {
            score -= 20;
          }
        }
      }

      // Color (e.g. Black)
      if (spec.variant.color) {
        const c = spec.variant.color.toLowerCase();
        const cRegex = new RegExp(`\\b${c}\\b`, 'i');
        if (cRegex.test(title) || cRegex.test(fullText)) {
          score += 10;
          matchReasons.push(`Color: ${spec.variant.color}`);
        } else {
          score -= 5;
        }
      }

      // Screen Size (e.g. "43 inch")
      if (spec.variant.size) {
        const sizeNum = spec.variant.size.match(/\d+/)?.[0];
        if (sizeNum) {
          const sizeRegex = new RegExp(`\\b${sizeNum}\\s*(?:inch|inches|\"|cm)\\b`, 'i');
          if (sizeRegex.test(title) || sizeRegex.test(highlights)) {
            score += 20;
            matchReasons.push(`Screen: ${spec.variant.size}`);
          } else if (/\b(32|50|55|65|75)\s*inch\b/i.test(title)) {
            // Distinct size mismatch penalty (e.g. 55 inch TV when 43 inch requested)
            score -= 40;
          }
        }
      }

      // Umbrella Fold (e.g. "4 fold")
      if (spec.variant.fold) {
        const foldNum = spec.variant.fold.match(/\d+/)?.[0];
        if (foldNum) {
          const foldRegex = new RegExp(`\\b${foldNum}\\s*fold\\b`, 'i');
          if (foldRegex.test(title) || foldRegex.test(highlights)) {
            score += 20;
            matchReasons.push(`Fold: ${spec.variant.fold}`);
          } else if (/\b(2|3|5)\s*fold\b/i.test(title)) {
            // Fold mismatch penalty (e.g. 5 fold when 4 fold asked)
            score -= 30;
          }
        }
      }
    }

    // 8. MUST INCLUDE WORDS
    if (spec.mustInclude && spec.mustInclude.length > 0) {
      let mustCount = 0;
      for (const token of spec.mustInclude) {
        if (title.includes(token.toLowerCase()) || fullText.includes(token.toLowerCase())) {
          mustCount++;
        }
      }
      if (mustCount === spec.mustInclude.length) {
        score += 10;
      } else {
        score += Math.round(10 * (mustCount / spec.mustInclude.length));
      }
    }

    // Clamp score to 0 - 100
    const finalRelevanceScore = Math.max(0, Math.min(100, Math.round(score)));

    // Categorization
    const isBrandCompliant = spec.brand && spec.isSpecific ? brandMatched : true;
    const isExact = isBrandCompliant && finalRelevanceScore >= 80 && (spec.brand ? brandMatched : true) && (spec.model ? (modelMatched && isStrictModifierMatch) : true);
    const isPartial = isBrandCompliant && !isExact && finalRelevanceScore >= 55;
    const isSimilar = isBrandCompliant && !isExact && !isPartial && finalRelevanceScore >= 35;

    // Minimum passing threshold: at least 35 relevance score and brand compliance
    const passed = isBrandCompliant && finalRelevanceScore >= 35;
    if (!passed && !rejectionReason) {
      if (!isBrandCompliant) {
        rejectionReason = `Brand mismatch: requested ${spec.brand}`;
      } else {
        rejectionReason = `Low relevance score (${finalRelevanceScore}/100)`;
      }
    }

    return {
      product: {
        ...product,
        relevanceScore: finalRelevanceScore,
        matchType: isExact ? 'EXACT' : isPartial ? 'PARTIAL' : isSimilar ? 'SIMILAR' : 'NONE'
      },
      relevanceScore: finalRelevanceScore,
      isExactMatch: isExact,
      isPartialMatch: isPartial,
      isSimilar,
      isAccessory: false,
      passedRelevanceFilter: passed,
      rejectionReason,
      matchReasons
    };
  }
}

export const relevanceFilter = new RelevanceFilter();
