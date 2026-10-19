import { querySpecExtractor } from '../src/ranking/querySpecExtractor';
import { relevanceFilter } from '../src/ranking/relevanceFilter';
import { rankingEngine } from '../src/ranking/rankingEngine';
import { Product, ProductSpec } from '../src/types/product';

describe('Query Understanding & Spec Extraction Pipeline', () => {
  test('Extracts precise spec for "boAt Airdopes 141"', async () => {
    const spec = await querySpecExtractor.extractSpec('boAt Airdopes 141', 'en');
    expect(spec.brand?.toLowerCase()).toBe('boat');
    expect(spec.model?.toLowerCase()).toContain('airdopes 141');
    expect(spec.isSpecific).toBe(true);
    expect(spec.mustExclude.length).toBeGreaterThan(0);
    expect(spec.mustExclude).toEqual(expect.arrayContaining(['case', 'cover', 'strap', 'protector']));
  });

  test('Extracts precise spec for "iPhone 15 128GB black"', async () => {
    const spec = await querySpecExtractor.extractSpec('iPhone 15 128GB black', 'en');
    expect(spec.brand?.toLowerCase()).toMatch(/apple|iphone/);
    expect(spec.model?.toLowerCase()).toMatch(/15|iphone 15/);
    expect(spec.variant?.storage?.toLowerCase()).toBe('128gb');
    expect(spec.variant?.color?.toLowerCase()).toBe('black');
    expect(spec.isSpecific).toBe(true);
  });

  test('Extracts precise spec for "Livesmart 4 fold umbrella"', async () => {
    const spec = await querySpecExtractor.extractSpec('Livesmart 4 fold umbrella', 'en');
    expect(spec.brand?.toLowerCase()).toBe('livesmart');
    expect(spec.variant?.fold).toMatch(/4[\s-]?fold/);
    expect(spec.productType.toLowerCase()).toContain('umbrella');
    expect(spec.isSpecific).toBe(true);
  });

  test('Extracts budget spec for "wireless earbuds under 2000"', async () => {
    const spec = await querySpecExtractor.extractSpec('wireless earbuds under 2000', 'en');
    expect(spec.productType.toLowerCase()).toContain('earbuds');
    expect(spec.budgetMax).toBe(2000);
    expect(spec.isSpecific).toBe(false);
  });

  test('Extracts size and spec for "Samsung 43 inch smart TV"', async () => {
    const spec = await querySpecExtractor.extractSpec('Samsung 43 inch smart TV', 'en');
    expect(spec.brand?.toLowerCase()).toBe('samsung');
    expect(spec.variant?.size).toBe('43 inch');
    expect(spec.isSpecific).toBe(true);
  });

  test('Extracts Hindi voice command: "boAt earbuds 2000 ke andar dikhao"', async () => {
    const spec = await querySpecExtractor.extractSpec('boAt earbuds 2000 ke andar dikhao', 'hi');
    expect(spec.brand?.toLowerCase()).toBe('boat');
    expect(spec.budgetMax).toBe(2000);
  });

  test('Extracts Kannada voice command: "boAt earbuds 2000 ಒಳಗೆ ತೋರಿಸು"', async () => {
    const spec = await querySpecExtractor.extractSpec('boAt earbuds 2000 ಒಳಗೆ ತೋರಿಸು', 'kn');
    expect(spec.brand?.toLowerCase()).toBe('boat');
    expect(spec.budgetMax).toBe(2000);
  });
});

describe('Relevance Filter & Accessory Hard Drops', () => {
  const boatSpec: ProductSpec = {
    rawQuery: 'boAt Airdopes 141',
    englishQuery: 'boAt Airdopes 141',
    productType: 'wireless earbuds',
    brand: 'boAt',
    model: 'Airdopes 141',
    mustInclude: ['boAt', 'Airdopes', '141'],
    mustExclude: ['case', 'cover', 'strap', 'protector', 'tempered glass', 'cable', 'replacement'],
    isSpecific: true,
    cleanSearchQuery: 'boAt Airdopes 141 wireless earbuds',
    alternativeQueries: []
  };

  test('Drops phone/earbud cases and accessories', () => {
    const caseProduct: Product = {
      store: 'amazon',
      productId: 'case-1',
      title: 'Silicone Case Cover for boAt Airdopes 141 with Keychain',
      imageUrl: 'https://img.com/1.jpg',
      price: 199,
      mrp: 499,
      discountPct: 60,
      rating: 4.2,
      ratingCount: 500,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Amazon',
      inStock: true,
      productUrl: 'https://amazon.in/1',
      affiliateUrl: 'https://amazon.in/1'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(caseProduct, boatSpec);
    expect(evaluation.passedRelevanceFilter).toBe(false);
    expect(evaluation.rejectionReason?.toLowerCase()).toContain('accessory');
  });

  test('Drops wrong brands when specific query is given', () => {
    const wrongBrandProduct: Product = {
      store: 'amazon',
      productId: 'noise-1',
      title: 'Noise Buds VS102 Truly Wireless Earbuds 50H Playtime',
      imageUrl: 'https://img.com/2.jpg',
      price: 1099,
      mrp: 2999,
      discountPct: 63,
      rating: 4.1,
      ratingCount: 15000,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Noise Direct',
      inStock: true,
      productUrl: 'https://amazon.in/2',
      affiliateUrl: 'https://amazon.in/2'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(wrongBrandProduct, boatSpec);
    expect(evaluation.passedRelevanceFilter).toBe(false);
    expect(evaluation.rejectionReason?.toLowerCase()).toContain('brand mismatch');
  });

  test('Passes exact genuine product with high score', () => {
    const exactProduct: Product = {
      store: 'amazon',
      productId: 'boat-141-exact',
      title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds with 42H Playtime, Beast Mode',
      imageUrl: 'https://img.com/3.jpg',
      price: 1299,
      mrp: 4490,
      discountPct: 71,
      rating: 4.0,
      ratingCount: 215430,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      productUrl: 'https://amazon.in/3',
      affiliateUrl: 'https://amazon.in/3'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(exactProduct, boatSpec);
    expect(evaluation.passedRelevanceFilter).toBe(true);
    expect(evaluation.relevanceScore).toBeGreaterThanOrEqual(80);
    expect(evaluation.isExactMatch).toBe(true);
  });

  test('Drops products exceeding strict budget', () => {
    const budgetSpec: ProductSpec = {
      rawQuery: 'wireless earbuds under 2000',
      englishQuery: 'wireless earbuds under 2000',
      productType: 'wireless earbuds',
      mustInclude: ['earbuds'],
      mustExclude: ['case', 'cover'],
      budgetMax: 2000,
      isSpecific: false,
      cleanSearchQuery: 'wireless earbuds',
      alternativeQueries: []
    };

    const expensiveProduct: Product = {
      store: 'flipkart',
      productId: 'sony-1',
      title: 'Sony WF-C500 Truly Wireless Bluetooth Earbuds',
      imageUrl: 'https://img.com/4.jpg',
      price: 4990,
      mrp: 8990,
      discountPct: 44,
      rating: 4.4,
      ratingCount: 12000,
      deliveryDays: 2,
      shippingFee: 0,
      seller: 'Sony India',
      inStock: true,
      productUrl: 'https://flipkart.com/4',
      affiliateUrl: 'https://flipkart.com/4'
    };

    const evaluation = relevanceFilter.evaluateSingleProduct(expensiveProduct, budgetSpec, 2000);
    expect(evaluation.passedRelevanceFilter).toBe(false);
    expect(evaluation.rejectionReason?.toLowerCase()).toContain('budget');
  });
});

describe('Ranking Engine & Recommendation Synchronization', () => {
  test('Top recommendation matches Top 3 and shares identical productId', async () => {
    const spec: ProductSpec = {
      rawQuery: 'boAt Airdopes 141',
      englishQuery: 'boAt Airdopes 141',
      productType: 'wireless earbuds',
      brand: 'boAt',
      model: 'Airdopes 141',
      mustInclude: ['boAt', 'Airdopes', '141'],
      mustExclude: ['case', 'cover', 'strap'],
      isSpecific: true,
      cleanSearchQuery: 'boAt Airdopes 141',
      alternativeQueries: []
    };

    const sampleProducts: Product[] = [
      {
        store: 'amazon',
        productId: 'boat-141-amz',
        title: 'boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds (Bold Black)',
        imageUrl: 'https://img.com/boat1.jpg',
        price: 1299,
        mrp: 4490,
        discountPct: 71,
        rating: 4.0,
        ratingCount: 200000,
        deliveryDays: 1,
        shippingFee: 0,
        seller: 'Appario',
        inStock: true,
        productUrl: 'https://amazon.in/1',
        affiliateUrl: 'https://amazon.in/1'
      },
      {
        store: 'flipkart',
        productId: 'boat-141-fk',
        title: 'boAt Airdopes 141 with 42H Playtime Bluetooth Headset (Active Black)',
        imageUrl: 'https://img.com/boat2.jpg',
        price: 1399,
        mrp: 4490,
        discountPct: 68,
        rating: 4.1,
        ratingCount: 150000,
        deliveryDays: 2,
        shippingFee: 0,
        seller: 'RetailNet',
        inStock: true,
        productUrl: 'https://flipkart.com/2',
        affiliateUrl: 'https://flipkart.com/2'
      },
      {
        store: 'amazon',
        productId: 'boat-case-bad',
        title: 'boAt Airdopes 141 Protective Silicone Case Black',
        imageUrl: 'https://img.com/case.jpg',
        price: 149,
        mrp: 499,
        discountPct: 70,
        rating: 4.5,
        ratingCount: 300,
        deliveryDays: 1,
        shippingFee: 0,
        seller: 'CaseStore',
        inStock: true,
        productUrl: 'https://amazon.in/bad',
        affiliateUrl: 'https://amazon.in/bad'
      }
    ];

    const result = await rankingEngine.rank(sampleProducts, { preference: 'balanced' }, undefined, [], spec);

    expect(result.rankedProducts.length).toBe(2);
    expect(result.rankedProducts.some((p: Product) => p.productId === 'boat-case-bad')).toBe(false);
    expect(result.topRecommendations.bestOverall?.productId).toBe(result.rankedProducts[0].productId);
    expect(result.topRecommendations.bestOverall?.productId).toBe(result.debugTrace.top3[0].productId);
    expect(result.topRecommendations.bestOverall?.relevanceScore).toBeGreaterThanOrEqual(70);
  });
});
