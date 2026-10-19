import axios from 'axios';
import { IStoreProvider } from './storeProvider.interface';
import { Product, SearchFilters, StoreName } from '../types/product';
import { config } from '../config';

export class FlipkartProvider implements IStoreProvider {
  public name: StoreName = 'flipkart';
  public displayName = 'Flipkart';

  public isConfigured(): boolean {
    return Boolean((config.flipkart.affiliateId && config.flipkart.affiliateToken) || config.serpApiKey);
  }

  public async checkHealth(): Promise<{ isAvailable: boolean; message?: string }> {
    if (!this.isConfigured()) {
      return {
        isAvailable: false,
        message: 'Flipkart credentials missing in .env (FLIPKART_AFFILIATE_ID or SERPAPI_KEY)'
      };
    }
    return {
      isAvailable: true,
      message: config.flipkart.affiliateId ? 'Flipkart Affiliate API active' : 'Live Flipkart via SerpApi active'
    };
  }

  public async search(query: string, filters?: SearchFilters): Promise<Product[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Flipkart credentials not configured.');
      return [];
    }

    if (!config.flipkart.affiliateId || !config.flipkart.affiliateToken || config.flipkart.affiliateId.startsWith('your_') || config.flipkart.affiliateId.length < 5) {
      const { serpApiProvider } = await import('./serpApiProvider');
      return serpApiProvider.searchStore('flipkart', query, filters);
    }

    try {
      const url = `${config.flipkart.baseUrl}/search.json`;
      const response = await axios.get(url, {
        params: {
          query,
          resultCount: 10
        },
        headers: {
          'Fk-Affiliate-Id': config.flipkart.affiliateId,
          'Fk-Affiliate-Token': config.flipkart.affiliateToken,
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      const productList = response.data?.products || response.data?.productInfoList || [];
      if (productList.length === 0) {
        const { serpApiProvider } = await import('./serpApiProvider');
        return serpApiProvider.searchStore('flipkart', query, filters);
      }

      return productList
        .map((item: any) => this.normalizeItem(item))
        .filter((p: Product) => p.price > 0 && (filters?.maxBudget ? p.price <= filters.maxBudget : true));
    } catch (error: any) {
      const { serpApiProvider } = await import('./serpApiProvider');
      return serpApiProvider.searchStore('flipkart', query, filters);
    }
  }

  public async getProduct(productId: string): Promise<Product | null> {
    if (
      !this.isConfigured() ||
      !config.flipkart.affiliateId ||
      !config.flipkart.affiliateToken ||
      config.flipkart.affiliateId.startsWith('your_') ||
      config.flipkart.affiliateId.length < 5
    ) {
      return null;
    }

    try {
      const url = `${config.flipkart.baseUrl}/product.json`;
      const response = await axios.get(url, {
        params: { id: productId },
        headers: {
          'Fk-Affiliate-Id': config.flipkart.affiliateId,
          'Fk-Affiliate-Token': config.flipkart.affiliateToken
        },
        timeout: 8000
      });

      if (response.data) {
        return this.normalizeItem(response.data);
      }
      return null;
    } catch (error: any) {
      console.error('❌ Flipkart Affiliate GetProduct Error:', error.response?.data || error.message);
      return null;
    }
  }

  private normalizeItem(item: any): Product {
    const baseInfo = item.productBaseInfoV1 || item.productBaseInfo || item;
    const pid = baseInfo.productId || item.productId || 'UNKNOWN_FK';
    const title = baseInfo.title || 'Flipkart Product';
    
    // Extract primary image and alternatives
    const imageMap = baseInfo.imageUrls || {};
    const imageUrl = imageMap['800x800'] || imageMap['400x400'] || imageMap['200x200'] || imageMap['unknown'] || baseInfo.imageUrl || '';
    const images = Object.values(imageMap).filter((u): u is string => typeof u === 'string' && u.startsWith('http'));

    const price = baseInfo.flipkartSellingPrice?.amount || baseInfo.maximumRetailPrice?.amount || 0;
    const mrp = baseInfo.maximumRetailPrice?.amount || price;
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : (baseInfo.discountPercentage || 0);

    const rating = baseInfo.productRating ? parseFloat(baseInfo.productRating) : 4.1;
    const inStock = baseInfo.inStock !== false && baseInfo.availability !== 'OUT_OF_STOCK';
    const productUrl = baseInfo.productUrl || `https://www.flipkart.com/item/p/${pid}`;
    
    // Add affiliate tracking tag if missing
    let affiliateUrl = productUrl;
    if (config.flipkart.affiliateId && !affiliateUrl.includes('affid=')) {
      const separator = affiliateUrl.includes('?') ? '&' : '?';
      affiliateUrl = `${affiliateUrl}${separator}affid=${config.flipkart.affiliateId}`;
    }

    return {
      store: 'flipkart',
      productId: pid,
      title,
      imageUrl,
      images,
      price,
      mrp,
      discountPct,
      rating,
      ratingCount: 350,
      deliveryDays: 2,
      shippingFee: price > 500 ? 0 : 40,
      seller: 'Flipkart SuperComNet / Assured Seller',
      inStock,
      quantity: '1 Unit',
      productUrl,
      affiliateUrl,
      returnPolicy: '7 Days Replacement Policy',
      fulfilledByStore: true,
      highlights: [
        baseInfo.productBrand ? `Brand: ${baseInfo.productBrand}` : 'Flipkart Assured Quality',
        'Bank Offers Available',
        'Fast Delivery'
      ]
    };
  }
}

export const flipkartProvider = new FlipkartProvider();
