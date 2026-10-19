import { queryExtractor } from '../src/ranking/queryExtractor';
import { productScorer } from '../src/ranking/productScorer';
import { rankingEngine } from '../src/ranking/rankingEngine';
import { serpApiProvider } from '../src/providers/serpApiProvider';
import { Product } from '../src/types/product';

describe('Exact Product Recommendation Matching System', () => {
  // Test 1: "Show iPhone 15" -> only iPhone 15, NOT iPhone 14, 15 Pro, 15 Plus, 16
  test('Test 1: "Show iPhone 15" extracts attributes and returns only base iPhone 15 variants', async () => {
    const extracted = queryExtractor.extract('Show iPhone 15');
    expect(extracted.brand).toBe('Apple');
    expect(extracted.product).toBe('smartphone');
    expect(extracted.model?.toLowerCase()).toContain('15');
    expect(extracted.variant).toBeUndefined(); // Base model

    // Catalog items
    const baseIphone15: Product = {
      store: 'amazon',
      productId: 'amz_apple_iphone_15_128gb_black',
      title: 'Apple iPhone 15 (128 GB) - Black',
      imageUrl: 'https://example.com/img.jpg',
      price: 69999,
      mrp: 79900,
      discountPct: 12,
      rating: 4.6,
      ratingCount: 14850,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      productUrl: 'https://amazon.in/dp/1',
      affiliateUrl: 'https://amazon.in/dp/1'
    };

    const iphone15Pro: Product = {
      ...baseIphone15,
      productId: 'amz_apple_iphone_15_pro_128gb_titanium',
      title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
      price: 127990
    };

    const iphone14: Product = {
      ...baseIphone15,
      productId: 'amz_apple_iphone_14_128gb_blue',
      title: 'Apple iPhone 14 (128 GB) - Blue',
      price: 58999
    };

    const iphone16: Product = {
      ...baseIphone15,
      productId: 'amz_apple_iphone_16_128gb_pink',
      title: 'Apple iPhone 16 (128 GB) - Pink',
      price: 79999
    };

    const scoreBase = productScorer.scoreProduct(baseIphone15, extracted);
    const scorePro = productScorer.scoreProduct(iphone15Pro, extracted);
    const score14 = productScorer.scoreProduct(iphone14, extracted);
    const score16 = productScorer.scoreProduct(iphone16, extracted);

    expect(scoreBase.isExactMatch).toBe(true);
    expect(scoreBase.matchScore).toBeGreaterThanOrEqual(85);

    // Mismatched variants/models MUST NOT be exact matches
    expect(scorePro.isExactMatch).toBe(false);
    expect(score14.isExactMatch).toBe(false);
    expect(score16.isExactMatch).toBe(false);

    // Ranking Engine verification
    const rankResult = await rankingEngine.rank([baseIphone15, iphone15Pro, iphone14, iphone16], 'Show iPhone 15');
    expect(rankResult.isExactMatch).toBe(true);
    expect(rankResult.matchType).toBe('EXACT');
    expect(rankResult.exactMatches).toHaveLength(1);
    expect(rankResult.exactMatches[0].productId).toBe('amz_apple_iphone_15_128gb_black');
    expect(rankResult.topRecommendations.bestOverall?.productId).toBe('amz_apple_iphone_15_128gb_black');
  });

  // Test 2: "Show iPhone 15 Pro" -> only iPhone 15 Pro
  test('Test 2: "Show iPhone 15 Pro" matches iPhone 15 Pro, rejecting base iPhone 15 and Pro Max', async () => {
    const extracted = queryExtractor.extract('Show iPhone 15 Pro');
    expect(extracted.brand).toBe('Apple');
    expect(extracted.product).toBe('smartphone');
    expect(extracted.model?.toLowerCase()).toContain('15');

    const iphone15Pro: Product = {
      store: 'amazon',
      productId: 'amz_apple_iphone_15_pro_128gb_titanium',
      title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
      imageUrl: 'https://example.com/img.jpg',
      price: 127990,
      mrp: 134900,
      discountPct: 5,
      rating: 4.6,
      ratingCount: 3120,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      productUrl: 'https://amazon.in/dp/pro',
      affiliateUrl: 'https://amazon.in/dp/pro'
    };

    const iphone15Base: Product = {
      ...iphone15Pro,
      productId: 'amz_apple_iphone_15_128gb_black',
      title: 'Apple iPhone 15 (128 GB) - Black',
      price: 69999
    };

    const iphone15ProMax: Product = {
      ...iphone15Pro,
      productId: 'amz_apple_iphone_15_promax_256gb_titanium',
      title: 'Apple iPhone 15 Pro Max (256 GB) - Natural Titanium',
      price: 151990
    };

    const scorePro = productScorer.scoreProduct(iphone15Pro, extracted);
    const scoreBase = productScorer.scoreProduct(iphone15Base, extracted);
    const scoreProMax = productScorer.scoreProduct(iphone15ProMax, extracted);

    expect(scorePro.isExactMatch).toBe(true);
    expect(scoreBase.isExactMatch).toBe(false);
    expect(scoreProMax.isExactMatch).toBe(false);

    const rankResult = await rankingEngine.rank([iphone15Base, iphone15Pro, iphone15ProMax], 'Show iPhone 15 Pro');
    expect(rankResult.exactMatches[0].productId).toBe('amz_apple_iphone_15_pro_128gb_titanium');
  });

  // Test 3: "Show Samsung S24" -> Samsung S24, not S24 Ultra
  test('Test 3: "Show Samsung S24" matches Samsung Galaxy S24, rejecting S24 Ultra', () => {
    const extracted = queryExtractor.extract('I want Samsung Galaxy S24');
    expect(extracted.brand).toBe('Samsung');
    expect(extracted.model?.toLowerCase()).toContain('s24');

    const s24Base: Product = {
      store: 'amazon',
      productId: 'amz_samsung_galaxy_s24_256gb_onyx_black',
      title: 'Samsung Galaxy S24 5G (Onyx Black, 8GB RAM, 256GB Storage)',
      imageUrl: 'https://example.com/s24.jpg',
      price: 74999,
      mrp: 79999,
      discountPct: 6,
      rating: 4.5,
      ratingCount: 4120,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Samsung Official',
      inStock: true,
      productUrl: 'https://amazon.in/dp/s24',
      affiliateUrl: 'https://amazon.in/dp/s24'
    };

    const s24Ultra: Product = {
      ...s24Base,
      productId: 'amz_samsung_galaxy_s24_ultra_256gb_gray',
      title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 12GB RAM, 256GB Storage)',
      price: 129999
    };

    const scoreBase = productScorer.scoreProduct(s24Base, extracted);
    const scoreUltra = productScorer.scoreProduct(s24Ultra, extracted);

    expect(scoreBase.isExactMatch).toBe(true);
    expect(scoreUltra.isExactMatch).toBe(false);
  });

  // Test 4: "Show AirPods Pro 2" -> AirPods Pro 2, not AirPods 3
  test('Test 4: "Find Apple AirPods Pro 2" matches AirPods Pro 2nd Gen, rejecting AirPods 3', () => {
    const extracted = queryExtractor.extract('Find Apple AirPods Pro 2');
    expect(extracted.brand).toBe('Apple');
    expect(extracted.product).toBe('earbuds');
    expect(extracted.model?.toLowerCase()).toContain('pro 2');

    const airpodsPro2: Product = {
      store: 'amazon',
      productId: 'amz_apple_airpods_pro_2nd_gen_usbc',
      title: 'Apple AirPods Pro (2nd Generation) with MagSafe Case (USB-C)',
      imageUrl: 'https://example.com/pro2.jpg',
      price: 21999,
      mrp: 24900,
      discountPct: 12,
      rating: 4.7,
      ratingCount: 8940,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Appario Retail',
      inStock: true,
      productUrl: 'https://amazon.in/dp/pro2',
      affiliateUrl: 'https://amazon.in/dp/pro2'
    };

    const airpods3: Product = {
      ...airpodsPro2,
      productId: 'amz_apple_airpods_3rd_gen',
      title: 'Apple AirPods (3rd Generation) with Lightning Charging Case',
      price: 16999
    };

    const scorePro2 = productScorer.scoreProduct(airpodsPro2, extracted);
    const scoreGen3 = productScorer.scoreProduct(airpods3, extracted);

    expect(scorePro2.isExactMatch).toBe(true);
    expect(scoreGen3.isExactMatch).toBe(false);
  });

  // Test 5: "Show Nike Air Max 270" -> Nike Air Max 270, not Nike Air Max 90
  test('Test 5: "Show Nike Air Max 270" matches Air Max 270, rejecting Air Max 90', () => {
    const extracted = queryExtractor.extract('Show Nike Air Max 270');
    expect(extracted.brand).toBe('Nike');
    expect(extracted.model?.toLowerCase()).toContain('270');

    const airMax270: Product = {
      store: 'amazon',
      productId: 'amz_nike_air_max_270_black_white',
      title: 'Nike Mens Air Max 270 Running Shoes - Black/White (UK 8)',
      imageUrl: 'https://example.com/270.jpg',
      price: 12795,
      mrp: 13995,
      discountPct: 9,
      rating: 4.5,
      ratingCount: 3120,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'Nike Official Store',
      inStock: true,
      productUrl: 'https://amazon.in/dp/270',
      affiliateUrl: 'https://amazon.in/dp/270'
    };

    const airMax90: Product = {
      ...airMax270,
      productId: 'amz_nike_air_max_90_white',
      title: 'Nike Mens Air Max 90 Casual Sneakers - White/Black (UK 8)',
      price: 10495
    };

    const score270 = productScorer.scoreProduct(airMax270, extracted);
    const score90 = productScorer.scoreProduct(airMax90, extracted);

    expect(score270.isExactMatch).toBe(true);
    expect(score90.isExactMatch).toBe(false);
  });

  // Test 6: "Show HP Pavilion 15 16GB RAM" -> HP Pavilion 15 with 16GB RAM
  test('Test 6: "Show HP Pavilion 15 16GB RAM" matches 16GB RAM Pavilion model with priority', () => {
    const extracted = queryExtractor.extract('Show HP Pavilion 15 16GB RAM');
    expect(extracted.brand).toBe('HP');
    expect(extracted.model?.toLowerCase()).toContain('15');

    const hp16gb: Product = {
      store: 'amazon',
      productId: 'amz_hp_pavilion_15_16gb_ram_512gb_ssd',
      title: 'HP Pavilion 15 (12th Gen Intel Core i5, 16GB DDR4 RAM, 512GB SSD, 15.6" FHD)',
      imageUrl: 'https://example.com/hp16.jpg',
      price: 63990,
      mrp: 76500,
      discountPct: 16,
      rating: 4.4,
      ratingCount: 3840,
      deliveryDays: 1,
      shippingFee: 0,
      seller: 'HP Authorized',
      inStock: true,
      productUrl: 'https://amazon.in/dp/hp16',
      affiliateUrl: 'https://amazon.in/dp/hp16'
    };

    const hp8gb: Product = {
      ...hp16gb,
      productId: 'amz_hp_pavilion_15_8gb_ram_512gb_ssd',
      title: 'HP Pavilion 15 (12th Gen Intel Core i5, 8GB DDR4 RAM, 512GB SSD, 15.6" FHD)',
      price: 54990
    };

    const score16 = productScorer.scoreProduct(hp16gb, extracted);
    const score8 = productScorer.scoreProduct(hp8gb, extracted);

    expect(score16.matchScore).toBeGreaterThan(score8.matchScore);
    expect(score16.isExactMatch).toBe(true);
  });

  // Test 7: Store Cross-Comparison integrity across Amazon, Flipkart, Meesho
  test('Test 7: "Compare iPhone 15 128GB" strictly matches same model and labels unavailable stores without substitution', async () => {
    const allProducts = serpApiProvider.getFallbackProducts('iPhone 15 128GB');
    const combined = [...allProducts.amazon, ...allProducts.flipkart, ...allProducts.meesho];

    const result = await rankingEngine.rank(combined, 'Compare iPhone 15 128GB');
    expect(result.isExactMatch).toBe(true);

    const amazonComp = result.comparisonMatrix.find(c => c.store === 'amazon');
    const flipkartComp = result.comparisonMatrix.find(c => c.store === 'flipkart');
    const meeshoComp = result.comparisonMatrix.find(c => c.store === 'meesho');

    expect(amazonComp?.available).toBe(true);
    expect(amazonComp?.topProductTitle).toContain('iPhone 15');

    expect(flipkartComp?.available).toBe(true);
    expect(flipkartComp?.topProductTitle).toContain('iPhone 15');

    // Meesho does not carry genuine iPhone 15; must show accurate notice
    expect(meeshoComp?.available).toBe(false);
    expect(meeshoComp?.notice).toBe('No exact match on Meesho');
  });

  // Test 8: Unavailable Exact Product labels alternatives clearly
  test('Test 8: If exact requested product is unavailable, returns alternatives labeled matchType: ALTERNATIVES or NONE', async () => {
    const genericEarbuds: Product[] = [
      {
        store: 'amazon',
        productId: 'amz_generic_tws_earbuds',
        title: 'Generic Wireless Earbuds with Bluetooth 5.0',
        imageUrl: 'https://example.com/earbuds.jpg',
        price: 799,
        mrp: 1999,
        discountPct: 60,
        rating: 3.8,
        ratingCount: 120,
        deliveryDays: 3,
        shippingFee: 40,
        seller: 'Generic Retailer',
        inStock: true,
        productUrl: 'https://amazon.in/dp/generic',
        affiliateUrl: 'https://amazon.in/dp/generic'
      }
    ];

    const result = await rankingEngine.rank(genericEarbuds, 'Sony WH-1000XM5 Noise Cancelling Headphones');
    expect(result.isExactMatch).toBe(false);
    expect(result.matchType).toBe('NONE');
    expect(result.exactMatches).toHaveLength(0);
  });

  // Test 9: Stable Product ID Integrity
  test('Test 9: Product IDs are deterministic, stable, and preserved across queries', () => {
    const catalog1 = serpApiProvider.getFallbackProducts('iPhone 15');
    const catalog2 = serpApiProvider.getFallbackProducts('iPhone 15');

    expect(catalog1.amazon[0].productId).toBe('amz_apple_iphone_15_128gb_black');
    expect(catalog2.amazon[0].productId).toBe(catalog1.amazon[0].productId);
    expect(catalog1.flipkart[0].productId).toBe('fk_apple_iphone_15_128gb_black');
    expect(catalog2.flipkart[0].productId).toBe(catalog1.flipkart[0].productId);
  });
});
