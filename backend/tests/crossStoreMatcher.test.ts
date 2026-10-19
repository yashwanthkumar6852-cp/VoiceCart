import { CrossStoreMatcher } from '../src/catalog/crossStoreMatcher';

describe('CrossStoreMatcher - Cross Store Product Identification', () => {
  it('computes identical matchGroupId for matching products across stores', () => {
    const amazonIPhone = {
      store: 'amazon' as const,
      productId: 'amz_iphone15_128_black',
      title: 'Apple iPhone 15 (128 GB) - Black',
      brand: 'Apple',
      model: 'iPhone 15',
      variantText: 'Black, 128 GB',
      price: 69999,
      imageUrl: 'https://m.media-amazon.com/images/I/iphone15.jpg',
      productUrl: 'https://amazon.in/dp/amz_iphone15_128_black'
    };

    const flipkartIPhone = {
      store: 'flipkart' as const,
      productId: 'fk_apple_iphone15_black_128',
      title: 'Apple iPhone 15 128 GB Black',
      brand: 'Apple',
      model: 'iPhone 15',
      variantText: '128 GB ROM, Black',
      price: 68999,
      imageUrl: 'https://rukminim1.flixcart.com/image/iphone15.jpeg',
      productUrl: 'https://flipkart.com/dp/fk_apple_iphone15_black_128'
    };

    const matchGroupAmz = CrossStoreMatcher.computeMatchGroupId(amazonIPhone);
    const matchGroupFk = CrossStoreMatcher.computeMatchGroupId(flipkartIPhone);

    expect(matchGroupAmz).toBeDefined();
    expect(matchGroupFk).toBeDefined();
    expect(matchGroupAmz).toBe(matchGroupFk);
  });

  it('calculates cross-store similarity confidence >= 0.85 for matching items', () => {
    const p1: any = {
      store: 'amazon' as const,
      productId: 'p1',
      title: 'Sony Bravia 139 cm 55 inches 4K Ultra HD Smart LED Google TV KD-55X74L',
      brand: 'Sony',
      model: 'KD-55X74L',
      price: 54990,
      imageUrl: 'https://m.media-amazon.com/images/I/tv.jpg',
      productUrl: 'https://amazon.in/dp/p1'
    };

    const p2: any = {
      store: 'flipkart' as const,
      productId: 'p2',
      title: 'SONY Bravia 138.8 cm 55 inch Ultra HD 4K LED Smart Google TV KD-55X74L',
      brand: 'Sony',
      model: 'KD-55X74L',
      price: 53990,
      imageUrl: 'https://rukminim1.flixcart.com/image/tv.jpeg',
      productUrl: 'https://flipkart.com/dp/p2'
    };

    const confidence = CrossStoreMatcher.calculateConfidence(p1, p2);
    expect(confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('rejects match when brands or key models differ', () => {
    const sonyTV: any = {
      store: 'amazon' as const,
      productId: 'p_sony',
      title: 'Sony Bravia 55 inch 4K Ultra HD Smart Google TV',
      brand: 'Sony',
      model: 'KD-55X74L',
      price: 54990,
      imageUrl: 'https://m.media-amazon.com/images/I/tv.jpg',
      productUrl: 'https://amazon.in/dp/p_sony'
    };

    const lgTV: any = {
      store: 'flipkart' as const,
      productId: 'p_lg',
      title: 'LG 55 inch 4K Ultra HD Smart WebOS LED TV',
      brand: 'LG',
      model: '55UR7500PSC',
      price: 43990,
      imageUrl: 'https://rukminim1.flixcart.com/image/tv_lg.jpeg',
      productUrl: 'https://flipkart.com/dp/p_lg'
    };

    const confidence = CrossStoreMatcher.calculateConfidence(sonyTV, lgTV);
    expect(confidence).toBeLessThan(0.5);
  });
});
