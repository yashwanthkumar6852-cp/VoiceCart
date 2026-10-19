import {
  parsePrice,
  parseRating,
  parseCount,
  calculateQualityScore,
  normalizeSpecifications,
  normalizeQuantityInfo,
  generateRatingBreakdown
} from '../src/utils/productNormalizer';
import { productDetailService } from '../src/services/productDetailService';
import { serpApiProvider } from '../src/providers/serpApiProvider';

describe('Product Normalizer & Quality Scoring Unit Tests', () => {
  describe('1. Price Parsing', () => {
    it('should strip ₹, commas, and whitespace correctly', () => {
      expect(parsePrice('₹1,299')).toBe(1299);
      expect(parsePrice('₹ 69,999.00')).toBe(69999);
      expect(parsePrice('Rs. 499')).toBe(499);
      expect(parsePrice('28,990')).toBe(28990);
      expect(parsePrice(1499)).toBe(1499);
    });

    it('should return 0 for invalid or empty prices', () => {
      expect(parsePrice('')).toBe(0);
      expect(parsePrice(null)).toBe(0);
      expect(parsePrice(undefined)).toBe(0);
      expect(parsePrice('N/A')).toBe(0);
    });
  });

  describe('2. Rating & Count Parsing', () => {
    it('should parse ratings and clamp between 0 and 5', () => {
      expect(parseRating(4.3)).toBe(4.3);
      expect(parseRating('4.6 ★')).toBe(4.6);
      expect(parseRating('5.8')).toBe(5);
      expect(parseRating('-1.5')).toBe(0);
      expect(parseRating('No rating')).toBe(0);
    });

    it('should parse rating counts with K/M abbreviations safely', () => {
      expect(parseCount('1.2K')).toBe(1200);
      expect(parseCount('189,420')).toBe(189420);
      expect(parseCount('2.5M')).toBe(2500000);
      expect(parseCount(34120)).toBe(34120);
      expect(parseCount(undefined)).toBe(0);
    });
  });

  describe('3. Quality Score Calculation (0-10) with Real Signals Only', () => {
    it('should compute an authentic quality score from rating, seller, warranty, and return policy', () => {
      const quality = calculateQualityScore({
        rating: 4.1,
        ratingCount: 189420,
        sellerRating: 4.6,
        sellerName: 'Appario Retail',
        returnPolicy: '7 Days Replacement Policy',
        warranty: '1 Year Brand Warranty',
        fulfilledByStore: true,
        reviewCount: 15420
      });

      expect(quality.hasEnoughData).toBe(true);
      expect(quality.score).toBeGreaterThanOrEqual(7.0);
      expect(quality.score).toBeLessThanOrEqual(10.0);
      expect(quality.signals).toContain('7 Days Replacement Policy');
      expect(quality.signals).toContain('1 Year Brand Warranty');
      expect(quality.signals).toContain('Seller rating 4.6');
      expect(quality.basis).toBe('Based on ratings, seller and policies');
    });

    it('should handle missing data by reporting hasEnoughData: false and not inventing values', () => {
      const emptyQuality = calculateQualityScore({
        rating: 0,
        ratingCount: 0,
        sellerRating: undefined,
        sellerName: undefined,
        returnPolicy: undefined,
        warranty: undefined,
        fulfilledByStore: false
      });

      expect(emptyQuality.hasEnoughData).toBe(false);
      expect(emptyQuality.score).toBe(0);
      expect(emptyQuality.signals.length).toBe(0);
    });
  });

  describe('4. Specifications Category Grouping & Aliases Normalization', () => {
    it('should normalize specification keys into canonical categories', () => {
      const raw = {
        'Battery': '42 Hours Playback',
        'Model Name': 'Airdopes 141',
        'Bluetooth': 'v5.1',
        'Display Size': '43 inch',
        'Processor': 'Crystal 4K',
        'Fabric': '210T Pongee',
        'In the Box': '1 Pair Earbuds, Cable'
      };

      const normalized = normalizeSpecifications(raw);

      expect(normalized['General']['Model Name']).toBe('Airdopes 141');
      expect(normalized['Battery and Power']['Battery Capacity']).toBe('42 Hours Playback');
      expect(normalized['Connectivity']['Bluetooth Version']).toBe('v5.1');
      expect(normalized['Display']['Display Size']).toBe('43 inch');
      expect(normalized['Performance']['Processor']).toBe('Crystal 4K');
      expect(normalized['In the Box']['Sales Package']).toBe('1 Pair Earbuds, Cable');
    });
  });

  describe('5. Quantity & Pack Normalization', () => {
    it('should extract pack size and unit price correctly', () => {
      const single = normalizeQuantityInfo('1 Unit', 'IN_STOCK', 1299);
      expect(single.packSize).toBe('1 Unit');
      expect(single.unitsInPack).toBe(1);
      expect(single.stockStatus).toBe('IN_STOCK');
      expect(single.pricePerUnit).toBeUndefined();

      const multiPack = normalizeQuantityInfo('Pack of 2', 'IN_STOCK', 899);
      expect(multiPack.packSize).toBe('Pack of 2');
      expect(multiPack.unitsInPack).toBe(2);
      expect(multiPack.pricePerUnit).toBe(450);
    });
  });

  describe('6. Real Queries Verification (boAt 141, Samsung 43 TV, 4 Fold Umbrella)', () => {
    it('boAt Airdopes 141 should have all Flipkart-style normalized fields populated', async () => {
      const details = await productDetailService.getProductDetails('amazon', 'amz_boat_airdopes_141_black');
      expect(details.product).not.toBeNull();
      const p = details.product!;

      expect(p.brand).toBe('boAt');
      expect(p.price).toBe(1299);
      expect(p.mrp).toBe(4490);
      expect(p.discountPct).toBe(71);
      expect(p.rating).toBe(4.1);
      expect(p.ratingCount).toBe(189420);
      expect(p.quality?.hasEnoughData).toBe(true);
      expect(p.quality?.score).toBeGreaterThanOrEqual(8.0);
      expect(p.specifications?.['Battery and Power']).toBeDefined();
      expect(p.variants?.length).toBeGreaterThan(0);
      expect(p.reviews?.length).toBeGreaterThan(0);
    });

    it('Samsung 43 inch smart TV should have full display specs and quality score', async () => {
      const details = await productDetailService.getProductDetails('amazon', 'amz_samsung_43_inch_crystal_4k_smart_tv');
      expect(details.product).not.toBeNull();
      const p = details.product!;

      expect(p.brand).toBe('Samsung');
      expect(p.price).toBe(28990);
      expect(p.rating).toBe(4.3);
      expect(p.specifications?.['Display']?.['Display Size']).toContain('43');
      expect(p.specifications?.['Display']?.['Resolution']).toContain('4K');
      expect(p.warranty).toContain('Warranty');
    });

    it('4 fold umbrella should have compact specs and authentic pack sizes', async () => {
      const details = await productDetailService.getProductDetails('amazon', 'amz_livesmart_4_fold_umbrella_pack2');
      expect(details.product).not.toBeNull();
      const p = details.product!;

      expect(p.price).toBe(899);
      expect(p.quantityInfo?.packSize).toBe('Pack of 2');
      expect(p.quantityInfo?.pricePerUnit).toBe(450);
      expect(p.specifications?.['Overview']?.['Folding Mechanism'] || p.specifications?.['General']?.['Folding Mechanism']).toContain('4-Fold');
    });
  });
});
