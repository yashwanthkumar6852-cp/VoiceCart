import { QualityGate } from '../src/catalog/qualityGate';

describe('QualityGate - Zero Mock & Data Integrity Validation', () => {
  it('rejects products with missing or too-short titles', () => {
    const res = QualityGate.validate({
      store: 'amazon',
      productId: 'p1',
      title: 'Hi',
      price: 100,
      imageUrl: 'https://images.example.com/p.jpg',
      productUrl: 'https://amazon.in/dp/p1'
    });
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('Title too short');
  });

  it('rejects mock, sample, or placeholder titles', () => {
    const mockTitles = [
      'Sample Title for Test Product',
      'Dummy Product XYZ',
      'Placeholder Mobile Phone'
    ];
    for (const title of mockTitles) {
      const res = QualityGate.validate({
        store: 'amazon',
        productId: 'p_test',
        title,
        price: 5000,
        imageUrl: 'https://m.media-amazon.com/images/I/sample.jpg',
        productUrl: 'https://amazon.in/dp/p_test'
      });
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain('Mock or placeholder product title detected');
    }
  });

  it('rejects invalid or zero prices', () => {
    const res = QualityGate.validate({
      store: 'amazon',
      productId: 'p1',
      title: 'Apple iPhone 15 128GB Black',
      price: 0,
      imageUrl: 'https://m.media-amazon.com/images/I/sample.jpg',
      productUrl: 'https://amazon.in/dp/p1'
    });
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('Invalid price');
  });

  it('rejects placeholder or non-http image URLs', () => {
    const res = QualityGate.validate({
      store: 'amazon',
      productId: 'p1',
      title: 'Apple iPhone 15 128GB Black',
      price: 69999,
      imageUrl: 'https://via.placeholder.com/300',
      productUrl: 'https://amazon.in/dp/p1'
    });
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('Placeholder image URL detected');
  });

  it('validates genuine Meesho listings and rejects unverified Meesho sources', () => {
    const unverified = QualityGate.validate({
      store: 'meesho',
      productId: 'external_unverified_123',
      title: 'Women Cotton Kurti Set',
      price: 499,
      imageUrl: 'https://random-unverified.com/img.jpg',
      productUrl: 'https://random-store.com/item'
    });
    expect(unverified.isValid).toBe(false);
    expect(unverified.rejectionReason).toContain('Unverified Meesho source');

    const genuine = QualityGate.validate({
      store: 'meesho',
      productId: 'meesho_cotton_kurti_set',
      title: 'Women Printed Cotton Kurti Pant Set',
      price: 499,
      imageUrl: 'https://images.meesho.com/images/products/123/p.jpg',
      productUrl: 'https://www.meesho.in/dp/meesho_cotton_kurti_set'
    });
    expect(genuine.isValid).toBe(true);
  });

  it('accurately identifies accessories across categories', () => {
    const phoneCase = QualityGate.validate({
      store: 'amazon',
      productId: 'p_case',
      title: 'Spigen Rugged Armor Case for iPhone 15',
      category: 'mobiles',
      price: 1299,
      imageUrl: 'https://m.media-amazon.com/images/I/case.jpg',
      productUrl: 'https://amazon.in/dp/p_case'
    });
    expect(phoneCase.isValid).toBe(true);
    expect(phoneCase.isAccessory).toBe(true);
    expect(phoneCase.normalizedProduct?.badges).toContain('Accessory');

    const realPhone = QualityGate.validate({
      store: 'amazon',
      productId: 'p_phone',
      title: 'Apple iPhone 15 128GB Black Smartphone',
      category: 'mobiles',
      price: 69999,
      imageUrl: 'https://m.media-amazon.com/images/I/phone.jpg',
      productUrl: 'https://amazon.in/dp/p_phone'
    });
    expect(realPhone.isValid).toBe(true);
    expect(realPhone.isAccessory).toBe(false);
  });

  it('detects suspicious prices for categories', () => {
    const suspiciousPhone = QualityGate.validate({
      store: 'amazon',
      productId: 'p_susp',
      title: 'Brand New Apple iPhone 15 5G Flagship',
      category: 'mobiles',
      price: 499, // Unrealistic price for full phone
      mrp: 79900,
      imageUrl: 'https://m.media-amazon.com/images/I/phone.jpg',
      productUrl: 'https://amazon.in/dp/p_susp'
    });
    expect(suspiciousPhone.isValid).toBe(true);
    expect(suspiciousPhone.suspiciousPrice).toBe(true);
  });

  it('normalizes specifications automatically when missing', () => {
    const res = QualityGate.validate({
      store: 'amazon',
      productId: 'amz_boAt_141',
      title: 'boAt Airdopes 141 Bluetooth Truly Wireless Earbuds',
      brand: 'boAt',
      model: 'Airdopes 141',
      price: 1299,
      mrp: 4490,
      imageUrl: 'https://m.media-amazon.com/images/I/earbuds.jpg',
      productUrl: 'https://amazon.in/dp/amz_boAt_141'
    });
    expect(res.isValid).toBe(true);
    expect(res.normalizedProduct?.specifications).toBeDefined();
    expect(Object.keys(res.normalizedProduct?.specifications || {}).length).toBeGreaterThan(0);
  });
});
