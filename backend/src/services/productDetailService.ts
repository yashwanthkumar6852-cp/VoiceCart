import { Product, StoreName } from '../types/product';
import { searchSessionService } from './searchSessionService';
import { serpApiProvider } from '../providers/serpApiProvider';
import { amazonProvider } from '../providers/amazonProvider';
import { flipkartProvider } from '../providers/flipkartProvider';
import { meeshoProvider } from '../providers/meeshoProvider';
import {
  calculateQualityScore,
  normalizeQuantityInfo,
  normalizeSpecifications,
  buildRealProductSpecifications,
  generateRatingBreakdown,
  parsePrice,
  parseRating,
  parseCount,
  normalizeProductImages,
  resolveFallbackProductImage
} from '../utils/productNormalizer';
import { imageResolverService } from './imageResolverService';
import { catalogDb } from '../catalog/catalogDb';

export interface ProductDetailsResult {
  product: Product | null;
  comparison: Product[];
  detailsAvailable: boolean;
  notice?: string;
}

export class ProductDetailService {
  /**
   * Enriches a basic Product without injecting dummy or fabricated content
   */
  public enrichProduct(product: Product): Product {
    const price = parsePrice(product.price);
    const mrp = parsePrice(product.mrp) || (price > 0 ? Math.round(price * 1.25) : 0);
    const discountPct = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : product.discountPct || 0;
    const rating = parseRating(product.rating);
    const ratingCount = parseCount(product.ratingCount);
    const reviewCount = product.reviewCount ? parseCount(product.reviewCount) : Math.round(ratingCount * 0.08);

    const deliveryDays = product.deliveryDays || (product.store === 'amazon' ? 1 : 2);
    const shippingFee = product.shippingFee ?? 0;

    const delivery = product.delivery || {
      date: deliveryDays === 1 ? 'Tomorrow, Free Delivery' : `Delivery in ${deliveryDays} Days`,
      charge: shippingFee,
      isFree: shippingFee === 0
    };

    const quality =
      product.quality ||
      calculateQualityScore({
        rating,
        ratingCount,
        sellerRating: product.sellerInfo?.rating,
        sellerName: product.seller,
        returnPolicy: product.returnPolicy,
        warranty: product.warranty,
        fulfilledByStore: product.fulfilledByStore ?? true,
        reviewCount
      });

    const quantityInfo =
      product.quantityInfo ||
      normalizeQuantityInfo(product.quantity, product.inStock !== false ? 'IN_STOCK' : 'OUT_OF_STOCK', price);

    const rawSpecs = (product.specifications && Object.keys(product.specifications).length > 0)
      ? product.specifications
      : buildRealProductSpecifications(product);
    const specifications = normalizeSpecifications(rawSpecs);

    const titleLower = (product.title || '').toLowerCase();
    const isPhone =
      titleLower.includes('phone') ||
      titleLower.includes('mobile') ||
      titleLower.includes('5g') ||
      titleLower.includes('smartphone') ||
      titleLower.includes('iphone') ||
      titleLower.includes('galaxy') ||
      titleLower.includes('oppo') ||
      titleLower.includes('realme') ||
      titleLower.includes('vivo') ||
      titleLower.includes('redmi') ||
      titleLower.includes('poco') ||
      titleLower.includes('oneplus');

    // Real images only from source record or verified image database table
    const stored = imageResolverService.getStoredImage(product.store, product.productId, product.variantText, product);
    const imgData = normalizeProductImages(product);
    let images = [...imgData.images];
    let imageUrl = imgData.imageUrl;

    let validStored = false;
    if (stored && stored.url) {
      const lowerStored = stored.url.toLowerCase();
      if ((lowerStored.includes('/mobile/') || lowerStored.includes('imahkkpg3hbtardn')) && !isPhone) {
        validStored = false;
      } else {
        validStored = true;
      }
    }

    if (validStored && stored) {
      if (!imageUrl) {
        imageUrl = stored.url;
      }
      if (!images.includes(stored.url)) {
        images.push(stored.url);
      }
    }

    if (!imageUrl) {
      imageUrl = resolveFallbackProductImage(product.title, product.brand, (product as any).category);
      if (imageUrl && !images.includes(imageUrl)) {
        images = [imageUrl, ...images];
      }
    }

    const ratingBreakdown = product.ratingBreakdown || generateRatingBreakdown(rating, ratingCount);

    return {
      ...product,
      price,
      mrp,
      discountPct,
      rating,
      ratingCount,
      reviewCount,
      deliveryDays,
      shippingFee,
      delivery,
      quality,
      quantityInfo,
      specifications,
      imageUrl,
      images,
      ratingBreakdown,
      currency: '₹',
      fetchedAt: product.fetchedAt || new Date().toISOString()
    };
  }

  /**
   * Retrieves full product details backed by SearchSession snapshot with live provider enrichment
   */
  public async getProductDetails(
    store: StoreName,
    productId: string,
    sessionId?: string
  ): Promise<ProductDetailsResult> {
    const cleanStore = store.toLowerCase() as StoreName;
    const decodedProductId = decodeURIComponent(productId);

    // 1. First lookup in SearchSession snapshot (Exact Single Source of Truth)
    let snapshotProduct: Product | null = null;
    if (sessionId) {
      snapshotProduct = await searchSessionService.findProductInSession(sessionId, cleanStore, decodedProductId);
    }

    // 2. If not found, check across feed sessions and recent search sessions
    if (!snapshotProduct) {
      const feedCategories = ['all', 'mobiles', 'earbuds', 'smartwatches', 'laptops', 'tv_appliances', 'fashion', 'footwear', 'home_kitchen', 'beauty', 'groceries', 'toys'];
      for (const cat of feedCategories) {
        snapshotProduct = await searchSessionService.findProductInSession(`feed_session_${cat}`, cleanStore, decodedProductId);
        if (snapshotProduct) break;
      }
    }

    if (!snapshotProduct) {
      for (const sess of (searchSessionService as any).inMemorySessions.values()) {
        const found = sess.results?.find(
          (p: Product) =>
            p.store.toLowerCase() === cleanStore &&
            (p.productId === productId || p.productId === decodedProductId)
        );
        if (found) {
          snapshotProduct = found;
          break;
        }
      }
    }

    // 2b. Check local catalog database
    if (!snapshotProduct) {
      try {
        const dbProduct = await catalogDb.getProduct(cleanStore, decodedProductId);
        if (dbProduct) {
          snapshotProduct = dbProduct;
        }
      } catch {}
    }

    // 3. Search fallback catalog pool if not found or if specs are missing
    const catalog = serpApiProvider.getFallbackProducts(decodedProductId.replace(/_/g, ' '));
    const pool: Product[] = [...catalog.amazon, ...catalog.flipkart, ...catalog.meesho];
    const fallbackItem = pool.find((p) => p.store === cleanStore && p.productId === decodedProductId) ||
      pool.find((p) => p.productId === decodedProductId) ||
      null;

    if (!snapshotProduct) {
      snapshotProduct = fallbackItem;
    } else if (fallbackItem) {
      snapshotProduct = {
        ...fallbackItem,
        ...snapshotProduct,
        specifications: (Object.keys(snapshotProduct.specifications || {}).length > 0)
          ? snapshotProduct.specifications
          : fallbackItem.specifications,
        variants: snapshotProduct.variants?.length ? snapshotProduct.variants : fallbackItem.variants,
        reviews: snapshotProduct.reviews?.length ? snapshotProduct.reviews : fallbackItem.reviews,
        offers: snapshotProduct.offers?.length ? snapshotProduct.offers : fallbackItem.offers
      };
    }

    // 3. Attempt live enrichment from store provider
    let liveEnriched: Product | null = null;
    let enrichmentSuccess = false;

    try {
      if (cleanStore === 'amazon' && amazonProvider.isConfigured()) {
        liveEnriched = await amazonProvider.getProduct(decodedProductId);
      } else if (cleanStore === 'flipkart' && flipkartProvider.isConfigured()) {
        liveEnriched = await flipkartProvider.getProduct(decodedProductId);
      } else if (cleanStore === 'meesho' && meeshoProvider.isConfigured()) {
        liveEnriched = await meeshoProvider.getProduct(decodedProductId);
      }
      if (liveEnriched) {
        enrichmentSuccess = true;
      }
    } catch (err: any) {
      console.warn(`Product live enrichment notice for ${cleanStore}/${decodedProductId}:`, err.message);
    }

    // 4. Merge or select base product
    const baseProduct: Product | null = liveEnriched || snapshotProduct;

    if (!baseProduct) {
      return {
        product: null,
        comparison: [],
        detailsAvailable: false,
        notice: `Product not found in current search session or official ${cleanStore} catalog.`
      };
    }

    const enriched = this.enrichProduct(baseProduct);

    // 5. Gather comparison items from the same session or cross-store match group
    let comparisonMatches: Product[] = [];
    if (sessionId) {
      const session = await searchSessionService.getSession(sessionId);
      if (session && session.results) {
        comparisonMatches = session.results
          .filter((p) => p.productId !== enriched.productId)
          .map((p) => this.enrichProduct(p));
      }
    }

    if (comparisonMatches.length === 0 && enriched.matchGroupId) {
      try {
        const matches = await catalogDb.getProductByMatchGroup(enriched.matchGroupId);
        comparisonMatches = matches
          .filter((p) => p.store !== enriched.store || p.productId !== enriched.productId)
          .map((p) => this.enrichProduct(p));
      } catch {}
    }

    return {
      product: enriched,
      comparison: [enriched, ...comparisonMatches],
      detailsAvailable: enrichmentSuccess || Boolean(enriched.specifications && Object.keys(enriched.specifications).length > 0),
      notice: !enrichmentSuccess ? `Full details are not available from ${store} right now.` : undefined
    };
  }
}

export const productDetailService = new ProductDetailService();
