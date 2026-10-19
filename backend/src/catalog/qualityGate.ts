import { Product, StoreName } from '../types/product';
import { buildRealProductSpecifications } from '../utils/productNormalizer';

export interface QualityValidationResult {
  isValid: boolean;
  isAccessory: boolean;
  suspiciousPrice: boolean;
  rejectionReason?: string;
  normalizedProduct?: Product;
}

const ACCESSORY_KEYWORDS: Record<string, string[]> = {
  mobiles: ['case', 'cover', 'tempered glass', 'screen protector', 'skin', 'cable', 'charger', 'adapter', 'holder', 'stand', 'pouch'],
  laptops: ['bag', 'sleeve', 'case', 'skin', 'keyboard cover', 'cleaning kit', 'cooling pad', 'stand', 'mouse pad', 'adapter', 'cable'],
  tablets: ['case', 'cover', 'screen guard', 'tempered glass', 'stylus pen tip', 'skin', 'stand'],
  tvs: ['wall mount', 'bracket', 'remote cover', 'hdmi cable', 'screen cleaner'],
  cameras: ['strap', 'lens cap', 'cleaning cloth', 'battery charger', 'bag', 'case', 'tripod mount'],
  audio: ['ear tips', 'case cover', 'silicone case', 'cable', 'charging case only', 'pouch'],
  smartwatches: ['strap', 'band', 'screen protector', 'case', 'charging cable', 'dock']
};

export class QualityGate {
  /**
   * Validates product before writing to catalog. Enforces strict zero-mock standards.
   */
  public static validate(product: Partial<Product> & { category?: string; subCategory?: string }): QualityValidationResult {
    // 1. Mandatory Title
    const title = (product.title || '').trim();
    if (!title || title.length < 5) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Title too short or missing' };
    }
    const lowerTitle = title.toLowerCase();
    if (
      lowerTitle.includes('dummy') ||
      lowerTitle.includes('placeholder') ||
      lowerTitle.includes('mock product') ||
      lowerTitle.includes('sample title')
    ) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Mock or placeholder product title detected' };
    }

    // 2. Mandatory Store & ProductId
    if (!product.store || !product.productId) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Missing store or productId' };
    }

    // 3. Mandatory Valid Price
    const price = Number(product.price);
    if (isNaN(price) || price <= 0) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Invalid price' };
    }

    // 4. Mandatory Valid Image URL
    const imageUrl = (product.imageUrl || '').trim();
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Missing or non-http image URL' };
    }
    if (imageUrl.includes('placeholder.com') || imageUrl.includes('via.placeholder') || imageUrl.includes('example.com')) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Placeholder image URL detected' };
    }

    // 5. Mandatory Product / Store Link
    const productUrl = (product.productUrl || product.affiliateUrl || '').trim();
    if (!productUrl || !productUrl.startsWith('http')) {
      return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Missing or non-http product URL' };
    }

    // 6. Meesho specific quality check
    if (product.store === 'meesho') {
      const isGenuineMeesho =
        productUrl.includes('meesho.com') ||
        productUrl.includes('meesho.in') ||
        productUrl.includes('meesho') ||
        imageUrl.includes('images.meesho.com') ||
        imageUrl.includes('meesho') ||
        (product.productId && (product.productId.startsWith('m_') || product.productId.startsWith('meesho_'))) ||
        (product.source && product.source.includes('meesho')) ||
        (product.source && product.source.includes('google_shopping')) ||
        (product.seller && product.seller.toLowerCase().includes('meesho'));
      if (!isGenuineMeesho) {
        return { isValid: false, isAccessory: false, suspiciousPrice: false, rejectionReason: 'Unverified Meesho source or URL' };
      }
    }

    // 7. Accessory Detection by Category
    const category = (product.category || '').toLowerCase();
    let isAccessory = false;
    const keywords = ACCESSORY_KEYWORDS[category] || [];
    for (const kw of keywords) {
      // Check word boundary or space
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(title)) {
        isAccessory = true;
        break;
      }
    }

    // 8. Suspicious Price Detection
    let suspiciousPrice = false;
    const mrp = Number(product.mrp) || price;

    if (category === 'mobiles' && !isAccessory && price < 1200) {
      suspiciousPrice = true;
    } else if (category === 'laptops' && !isAccessory && price < 8000) {
      suspiciousPrice = true;
    } else if (category === 'tvs' && !isAccessory && price < 3500) {
      suspiciousPrice = true;
    } else if (price > mrp * 1.25) {
      suspiciousPrice = true;
    } else if (mrp > 0 && price / mrp < 0.05 && mrp > 5000) {
      // >95% discount on expensive items is suspicious
      suspiciousPrice = true;
    }

    // Normalized discount
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    const normalizedProduct: Product = {
      store: product.store as StoreName,
      productId: String(product.productId),
      title: title,
      brand: product.brand ? product.brand.trim() : undefined,
      model: product.model ? product.model.trim() : undefined,
      category: product.category,
      subCategory: product.subCategory,
      variantText: product.variantText,
      imageUrl: imageUrl,
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [imageUrl],
      price: Math.round(price * 100) / 100,
      mrp: mrp > price ? Math.round(mrp * 100) / 100 : Math.round(price * 100) / 100,
      discountPct: discountPct,
      rating: product.rating !== undefined ? Math.min(5, Math.max(0, Number(product.rating))) : 4.0,
      ratingCount: Number(product.ratingCount) || 0,
      reviewCount: Number(product.reviewCount) || 0,
      deliveryDays: Number(product.deliveryDays) || 3,
      shippingFee: Number(product.shippingFee) || 0,
      delivery: product.delivery || {
        date: 'Standard Delivery',
        charge: Number(product.shippingFee) || 0,
        isFree: (Number(product.shippingFee) || 0) === 0
      },
      seller: product.seller || (product.store.charAt(0).toUpperCase() + product.store.slice(1)),
      sellerInfo: product.sellerInfo,
      inStock: product.inStock !== false,
      highlights: Array.isArray(product.highlights) ? product.highlights : [],
      specifications: (product.specifications && Object.keys(product.specifications).length > 0)
        ? product.specifications
        : buildRealProductSpecifications({
            ...product,
            title,
            brand: product.brand,
            model: product.model,
            variantText: product.variantText,
            highlights: product.highlights,
            warranty: product.warranty
          } as any),
      offers: Array.isArray(product.offers) ? product.offers : [],
      variants: Array.isArray(product.variants) ? product.variants : [],
      productUrl: productUrl,
      affiliateUrl: product.affiliateUrl || productUrl,
      source: product.source || 'catalog',
      fetchedAt: product.fetchedAt || new Date().toISOString(),
      matchGroupId: product.matchGroupId,
      badges: isAccessory ? ['Accessory'] : (product.badges || [])
    };

    return {
      isValid: true,
      isAccessory,
      suspiciousPrice,
      normalizedProduct
    };
  }
}
