import { querySpecExtractor } from '../src/ranking/querySpecExtractor';
import { relevanceFilter } from '../src/ranking/relevanceFilter';
import { rankingEngine } from '../src/ranking/rankingEngine';
import { searchSessionService } from '../src/services/searchSessionService';
import { Product, ProductSpec, StoreName } from '../src/types/product';

describe('1. Query Cleaning & Brand/Model Normalization', () => {
  test('Strips fillers "Show the" and capitalizes "iPhone 14 Plus"', async () => {
    const raw = 'Show the iPhone 14 Plus';
    const spec = await querySpecExtractor.extractSpec(raw, 'en');
    const cleanName = searchSessionService.cleanProductName(raw, spec);

    expect(cleanName).toBe('iPhone 14 Plus');
    expect(cleanName.toLowerCase()).not.toContain('show');
    expect(cleanName.toLowerCase()).not.toContain('the');
    expect(spec.brand).toBe('Apple');
    expect(spec.model).toBe('iPhone 14 Plus');
    expect(spec.mustInclude).toContain('Plus');
    expect(spec.mustInclude).toContain('14');
  });

  test('Strips command words in Hindi: "boAt earbuds 2000 ke andar dikhao"', async () => {
    const raw = 'boAt earbuds 2000 ke andar dikhao';
    const spec = await querySpecExtractor.extractSpec(raw, 'hi');
    const cleanName = searchSessionService.cleanProductName(raw, spec);

    expect(cleanName).toContain('boAt');
    expect(cleanName.toLowerCase()).not.toContain('dikhao');
    expect(cleanName.toLowerCase()).not.toContain('andar');
    expect(spec.budgetMax).toBe(2000);
  });

  test('Strips command words in Kannada: "Samsung Galaxy S24 ತೋರಿಸು"', async () => {
    const raw = 'Samsung Galaxy S24 ತೋರಿಸು';
    const spec = await querySpecExtractor.extractSpec(raw, 'kn');
    const cleanName = searchSessionService.cleanProductName(raw, spec);

    expect(cleanName).toContain('Samsung Galaxy S24');
    expect(cleanName.toLowerCase()).not.toContain('ತೋರಿಸು');
    expect(spec.brand).toBe('Samsung');
  });

  test('Preserves unknown / nonsense query without breaking: "blorptex 9000"', async () => {
    const raw = 'blorptex 9000';
    const spec = await querySpecExtractor.extractSpec(raw, 'en');
    const cleanName = searchSessionService.cleanProductName(raw, spec);

    expect(cleanName).toBe('Blorptex 9000');
  });
});

describe('2. Strict Model Matching & Modifier Suffix Discrimination', () => {
  const iphone14PlusSpec: ProductSpec = {
    rawQuery: 'Show the iPhone 14 Plus',
    englishQuery: 'Show the iPhone 14 Plus',
    productType: 'smartphone',
    brand: 'Apple',
    model: 'iPhone 14 Plus',
    mustInclude: ['Apple', 'iPhone', '14', 'Plus'],
    mustExclude: ['case', 'cover', 'strap', 'skin', 'protector'],
    isSpecific: true,
    cleanSearchQuery: 'Apple iPhone 14 Plus',
    alternativeQueries: []
  };

  test('Strictly rejects base "iPhone 14" as exact match when "iPhone 14 Plus" is requested (marks as Similar Alternative)', () => {
    const baseIPhone14: Product = {
      store: 'amazon',
      productId: 'amz-ip14-base',
      title: 'Apple iPhone 14 (128 GB) - Blue',
      imageUrl: 'https://img.com/ip14.jpg',
      price: 54900,
      mrp: 69900,
      discountPct: 21,
      rating: 4.6,
      ratingCount: 8900,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario',
      inStock: true,
      productUrl: 'https://amazon.in/dp/1',
      affiliateUrl: 'https://amazon.in/dp/1'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(baseIPhone14, iphone14PlusSpec);

    // It passes as a similar alternative but is NEVER an exact match
    expect(evaluation.passedRelevanceFilter).toBe(true);
    expect(evaluation.isExactMatch).toBe(false);
    expect(evaluation.isPartialMatch || evaluation.isSimilar).toBe(true);
    expect(evaluation.matchReasons.some((r) => r.toLowerCase().includes('different model'))).toBe(true);
  });

  test('Strictly rejects "iPhone 14 Pro Max" when "iPhone 14 Plus" is requested', () => {
    const iphone14ProMax: Product = {
      store: 'amazon',
      productId: 'amz-ip14-promax',
      title: 'Apple iPhone 14 Pro Max (128 GB) - Space Black',
      imageUrl: 'https://img.com/promax.jpg',
      price: 119900,
      mrp: 139900,
      discountPct: 14,
      rating: 4.7,
      ratingCount: 4200,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Appario',
      inStock: true,
      productUrl: 'https://amazon.in/dp/2',
      affiliateUrl: 'https://amazon.in/dp/2'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(iphone14ProMax, iphone14PlusSpec);
    expect(evaluation.isExactMatch).toBe(false);
  });

  test('Marks exact "iPhone 14 Plus" as Exact Match', () => {
    const genuinePlus: Product = {
      store: 'amazon',
      productId: 'amz-ip14-plus-exact',
      title: 'Apple iPhone 14 Plus (128 GB) - Midnight',
      imageUrl: 'https://img.com/plus.jpg',
      price: 64900,
      mrp: 79900,
      discountPct: 18,
      rating: 4.6,
      ratingCount: 3100,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario',
      inStock: true,
      productUrl: 'https://amazon.in/dp/3',
      affiliateUrl: 'https://amazon.in/dp/3'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(genuinePlus, iphone14PlusSpec);
    expect(evaluation.passedRelevanceFilter).toBe(true);
    expect(evaluation.isExactMatch).toBe(true);
    expect(evaluation.relevanceScore).toBeGreaterThanOrEqual(80);
  });
});

describe('3. Price Sanity & Accessory Filter (Fixes the ₹599 phone bug)', () => {
  const iphoneSpec: ProductSpec = {
    rawQuery: 'Show the iPhone 14 Plus',
    englishQuery: 'Show the iPhone 14 Plus',
    productType: 'smartphone',
    brand: 'Apple',
    model: 'iPhone 14 Plus',
    mustInclude: ['Apple', 'iPhone', '14'],
    mustExclude: ['case', 'cover', 'strap', 'skin', 'protector'],
    isSpecific: true,
    cleanSearchQuery: 'Apple iPhone 14 Plus',
    alternativeQueries: []
  };

  test('Rejects ₹599 accessory titled with iPhone 14 name', () => {
    const cheapAccessory: Product = {
      store: 'amazon',
      productId: 'case-599',
      title: 'Apple iPhone 14 Liquid Silicone Soft Cover',
      imageUrl: 'https://img.com/case.jpg',
      price: 599,
      mrp: 1499,
      discountPct: 60,
      rating: 4.3,
      ratingCount: 1200,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'CaseStore',
      inStock: true,
      productUrl: 'https://amazon.in/case',
      affiliateUrl: 'https://amazon.in/case'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(cheapAccessory, iphoneSpec);
    expect(evaluation.passedRelevanceFilter).toBe(false);
    expect(evaluation.isAccessory).toBe(true);
    expect(evaluation.rejectionReason?.toLowerCase()).toMatch(/accessory|low price/);
  });

  test('Rejects suspiciously cheap item below 35% median in batch evaluation', () => {
    const items: Product[] = [
      {
        store: 'amazon',
        productId: 'ip14-1',
        title: 'Apple iPhone 14 (128 GB) - Blue',
        imageUrl: 'https://img.com/1.jpg',
        price: 54900,
        mrp: 69900,
        discountPct: 21,
        rating: 4.6,
        ratingCount: 8900,
        deliveryDays: 1,
        shippingFee: 0,
        seller: 'Appario',
        inStock: true,
        productUrl: 'https://amazon.in/1',
        affiliateUrl: 'https://amazon.in/1'
      },
      {
        store: 'flipkart',
        productId: 'ip14-2',
        title: 'Apple iPhone 14 (Midnight, 128 GB)',
        imageUrl: 'https://img.com/2.jpg',
        price: 56999,
        mrp: 69900,
        discountPct: 18,
        rating: 4.6,
        ratingCount: 6800,
        deliveryDays: 2,
        shippingFee: 0,
        seller: 'RetailNet',
        inStock: true,
        productUrl: 'https://flipkart.com/2',
        affiliateUrl: 'https://flipkart.com/2'
      },
      {
        store: 'amazon',
        productId: 'bad-phone-599',
        title: 'Apple iPhone 14 Stand Holder Device',
        imageUrl: 'https://img.com/3.jpg',
        price: 599,
        mrp: 1999,
        discountPct: 70,
        rating: 4.5,
        ratingCount: 200,
        deliveryDays: 1,
        shippingFee: 0,
        seller: 'AccessoryHub',
        inStock: true,
        productUrl: 'https://amazon.in/3',
        affiliateUrl: 'https://amazon.in/3'
      }
    ];

    const outcome = relevanceFilter.evaluateProducts(items, iphoneSpec);
    expect(outcome.allFilteredProducts.some((p) => p.productId === 'bad-phone-599')).toBe(false);
    expect(outcome.rejections.some((r) => r.price === 599)).toBe(true);
  });
});

describe('4. SearchOutcome Pipeline & Honest Replies', () => {
  const iphone14PlusSpec: ProductSpec = {
    rawQuery: 'Show the iPhone 14 Plus',
    englishQuery: 'Show the iPhone 14 Plus',
    productType: 'smartphone',
    brand: 'Apple',
    model: 'iPhone 14 Plus',
    mustInclude: ['Apple', 'iPhone', '14', 'Plus'],
    mustExclude: ['case', 'cover'],
    isSpecific: true,
    cleanSearchQuery: 'Apple iPhone 14 Plus',
    alternativeQueries: []
  };

  const similarProducts: Product[] = [
    {
      store: 'amazon',
      productId: 'amz-ip14-base',
      title: 'Apple iPhone 14 (128 GB) - Blue',
      imageUrl: 'https://img.com/ip14.jpg',
      price: 54900,
      mrp: 69900,
      discountPct: 21,
      rating: 4.6,
      ratingCount: 8900,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario',
      inStock: true,
      productUrl: 'https://amazon.in/dp/1',
      affiliateUrl: 'https://amazon.in/dp/1',
      matchType: 'SIMILAR',
      relevanceScore: 65,
      reason: 'Different model: iPhone 14 instead of iPhone 14 Plus'
    },
    {
      store: 'flipkart',
      productId: 'fk-ip14-base',
      title: 'Apple iPhone 14 (Midnight, 128 GB)',
      imageUrl: 'https://img.com/ip14fk.jpg',
      price: 56999,
      mrp: 69900,
      discountPct: 18,
      rating: 4.6,
      ratingCount: 6800,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'RetailNet',
      inStock: true,
      productUrl: 'https://flipkart.com/dp/2',
      affiliateUrl: 'https://flipkart.com/dp/2',
      matchType: 'SIMILAR',
      relevanceScore: 65,
      reason: 'Different model: iPhone 14 instead of iPhone 14 Plus'
    }
  ];

  test('Generates "similar_only" status when exact match not found, mentioning the real alternative', () => {
    const outcome = searchSessionService.buildOutcome({
      searchId: 'test_search_1',
      rawQuery: 'Show the iPhone 14 Plus',
      language: 'en',
      spec: iphone14PlusSpec,
      products: similarProducts,
      exactMatches: [],
      similarAlternatives: similarProducts,
      topRecommendations: { bestOverall: similarProducts[0] },
      rawCounts: { amazon: 10, flipkart: 7, meesho: 0, voicecart: 0 }
    });

    expect(outcome.status).toBe('similar_only');
    expect(outcome.banner.state).toBe('similar_only');
    expect(outcome.banner.title).toBe('Exact product not found, showing similar');

    // CRITICAL: Must mention the alternative rather than simply saying "couldn't find"
    expect(outcome.writtenReply).toContain('Apple iPhone 14');
    expect(outcome.writtenReply).toContain('₹54,900');
    expect(outcome.writtenReply).toContain('Amazon');
    expect(outcome.writtenReply).toContain('iPhone 14 Plus');
    expect(outcome.writtenReply.toLowerCase()).not.toContain('the iphone 14 plus');

    // Spoken reply must match written reply content
    expect(outcome.spokenReply).toBe(outcome.writtenReply);

    // Flipkart row in matrix must show Closest item, NOT "Not provided by Flipkart"
    const fkRow = outcome.comparisonMatrix.find((r: any) => r.store === 'flipkart');
    expect(fkRow?.topProductTitle).toContain('Closest: Apple iPhone 14');
    expect(fkRow?.available).toBe(true);
    expect(fkRow?.isExactMatch).toBe(false);
  });

  test('Fails if reply says "couldn\'t find" while similar alternatives exist without mentioning them', () => {
    const outcome = searchSessionService.buildOutcome({
      searchId: 'test_search_2',
      rawQuery: 'Show the iPhone 14 Plus',
      language: 'en',
      spec: iphone14PlusSpec,
      products: similarProducts,
      exactMatches: [],
      similarAlternatives: similarProducts,
      topRecommendations: { bestOverall: similarProducts[0] },
      rawCounts: { amazon: 10, flipkart: 7, meesho: 0, voicecart: 0 }
    });

    // If similarAlternatives is populated, the reply MUST offer the alternative
    if (outcome.similarAlternatives.length > 0) {
      expect(outcome.writtenReply).toMatch(/found the|available on|would you like to see/i);
    }
  });

  test('Generates "none" status for nonsense query with no alternatives claimed', () => {
    const nonsenseSpec: ProductSpec = {
      rawQuery: 'blorptex 9000',
      englishQuery: 'blorptex 9000',
      productType: 'product',
      mustInclude: [],
      mustExclude: [],
      isSpecific: false,
      cleanSearchQuery: 'blorptex 9000',
      alternativeQueries: []
    };

    const outcome = searchSessionService.buildOutcome({
      searchId: 'test_search_3',
      rawQuery: 'blorptex 9000',
      language: 'en',
      spec: nonsenseSpec,
      products: [],
      exactMatches: [],
      similarAlternatives: [],
      topRecommendations: {},
      rawCounts: { amazon: 0, flipkart: 0, meesho: 0, voicecart: 0 }
    });

    expect(outcome.status).toBe('none');
    expect(outcome.banner.state).toBe('none');
    expect(outcome.writtenReply).toContain('Blorptex 9000');
    expect(outcome.writtenReply.toLowerCase()).not.toContain('found the');
  });
});
