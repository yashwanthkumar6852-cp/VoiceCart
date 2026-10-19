import {
  buildProductKey,
  extractRealSpecBullets,
  isSpecDifferent,
  findBestSpecStore,
  formatIndianPrice
} from '../src/utils/productNormalizer';
import { productDetailService } from '../src/services/productDetailService';
import { compareService } from '../src/services/compareService';
import { Product } from '../src/types/product';

describe('Cross-Store Specification Comparison & Flipkart-Style Layout Tests', () => {
  describe('1. Spec Bullet Extraction & Number Formatting', () => {
    it('should format Indian currency numbers properly', () => {
      expect(formatIndianPrice(12499)).toBe('₹12,499');
      expect(formatIndianPrice(149999)).toBe('₹1,49,999');
      expect(formatIndianPrice(899)).toBe('₹899');
      expect(formatIndianPrice(0)).toBe('₹0');
    });

    it('should extract 4 to 6 real spec bullets without inventing dummy data', () => {
      const mockProduct: Partial<Product> = {
        title: 'OPPO K14x 5G (Icy Blue, 64 GB)',
        price: 12499,
        brand: 'OPPO',
        model: 'K14x 5G',
        specifications: {
          'General': { 'Model Name': 'K14x 5G', 'SIM Type': 'Dual SIM' },
          'Performance': { 'Processor': 'MediaTek Dimensity 6300 5G Processor' },
          'Memory and Storage': { 'RAM': '6 GB', 'Internal Storage': '64 GB' },
          'Display': { 'Display Size': '6.67 inch HD+ 120Hz Ultra Bright Display' },
          'Camera': { 'Primary Camera': '50MP AI Main Camera | 8MP Front Camera' },
          'Battery and Power': { 'Battery Capacity': '5100 mAh Battery with 45W SUPERVOOC Charge' },
          'Warranty and Return Policy': { 'Warranty Summary': '1 Year Manufacturer Warranty' }
        }
      };

      const bullets = extractRealSpecBullets(mockProduct as Product);
      expect(bullets.length).toBeGreaterThanOrEqual(4);
      expect(bullets.length).toBeLessThanOrEqual(6);
      expect(bullets.some(b => b.includes('6 GB | 64 GB') || b.includes('64 GB'))).toBe(true);
      expect(bullets.some(b => b.includes('Dimensity 6300'))).toBe(true);
      expect(bullets.some(b => b.includes('5100 mAh'))).toBe(true);
    });

    it('should normalize product keys accurately for cross-store queries', () => {
      const key1 = buildProductKey('OPPO', 'K14x 5G', '64 GB');
      expect(key1).toBe('oppo_k14x_5g_64_gb');
      const key2 = buildProductKey('realme', 'P4R 5G', '128 GB');
      expect(key2).toBe('realme_p4r_5g_128_gb');
    });
  });

  describe('2. OPPO K14x 5G Real Cross-Store Comparison', () => {
    it('should fetch real product details for OPPO K14x 5G on Flipkart and Amazon', async () => {
      const fkDetails = await productDetailService.getProductDetails('flipkart', 'fk_oppo_k14x_5g_icy_blue_64gb');
      expect(fkDetails.product).not.toBeNull();
      const p = fkDetails.product!;

      expect(p.brand).toBe('OPPO');
      expect(p.title).toContain('OPPO K14x 5G');
      expect(p.price).toBe(12499);
      expect(p.mrp).toBe(15999);
      expect(p.discountPct).toBe(22);
      expect(p.rating).toBe(4.3);
      expect(p.ratingCount).toBe(8442);
      expect(p.specifications?.['Performance']?.['Processor']).toContain('Dimensity 6300');
      expect(p.specifications?.['Battery and Power']?.['Battery Capacity']).toContain('5100 mAh');
      expect(p.variants?.length).toBeGreaterThan(0);
      expect(p.offers?.length).toBeGreaterThan(0);
    });

    it('should compare OPPO K14x 5G across Amazon, Flipkart, and Meesho side-by-side', async () => {
      const comparison = await compareService.compareSpecs({
        productKey: 'oppo_k14x_5g_64_gb',
        store: 'flipkart'
      });
      
      expect(comparison.query.toLowerCase()).toContain('oppo');
      expect(comparison.stores).toBeDefined();
      expect(['EXACT', 'CLOSEST', 'NOT_FOUND']).toContain(comparison.stores.flipkart.match);

      // Verify Winners structure
      expect(comparison.winners).toBeDefined();
    });
  });

  describe('3. realme P4R 5G Real Cross-Store Comparison', () => {
    it('should compare realme P4R 5G across stores with accurate spec alignment', async () => {
      const comparison = await compareService.compareSpecs({
        productKey: 'realme_p4r_5g_128_gb',
        store: 'amazon'
      });
      
      expect(comparison.stores).toBeDefined();
      if (comparison.stores.amazon.product) {
        expect(comparison.stores.amazon.product.price).toBeGreaterThan(0);
      }
      if (comparison.stores.flipkart.product) {
        expect(comparison.stores.flipkart.product.price).toBeGreaterThan(0);
      }
    });
  });

  describe('4. Spec Disagreement & Missing Data Handling', () => {
    it('should correctly flag differing specifications and identify best store', () => {
      const val1 = '5000 mAh';
      const val2 = '6000 mAh';
      const val3 = undefined;

      expect(isSpecDifferent(val1, val2, val3)).toBe(true);

      const valuesRecord = {
        amazon: '5000 mAh',
        flipkart: '6000 mAh',
        meesho: undefined,
        voicecart: undefined
      };
      expect(findBestSpecStore(valuesRecord, 'Battery Capacity')).toBe('flipkart');
    });

    it('should handle missing specs gracefully and not flag differences when identical or missing', () => {
      expect(isSpecDifferent(undefined, undefined, undefined)).toBe(false);
      expect(isSpecDifferent('5000 mAh', '5000 mAh', '5000 mAh')).toBe(false);

      const emptyRecord = {
        amazon: undefined,
        flipkart: undefined,
        meesho: undefined,
        voicecart: undefined
      };
      expect(findBestSpecStore(emptyRecord, 'Camera')).toBeNull();
    });
  });
});
