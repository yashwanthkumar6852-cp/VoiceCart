import axios from 'axios';
import { IStoreProvider } from './storeProvider.interface';
import { Product, SearchFilters, StoreName } from '../types/product';
import { config } from '../config';

export class MeeshoProvider implements IStoreProvider {
  public name: StoreName = 'meesho';
  public displayName = 'Meesho';

  public isConfigured(): boolean {
    return Boolean((config.meesho.partnerApiKey && config.meesho.partnerEndpoint) || config.serpApiKey);
  }

  public async checkHealth(): Promise<{ isAvailable: boolean; message?: string }> {
    if (!this.isConfigured()) {
      return {
        isAvailable: false,
        message: 'Meesho has no public API. Set MEESHO_PARTNER_API_KEY or SERPAPI_KEY in .env.'
      };
    }
    return {
      isAvailable: true,
      message: config.meesho.partnerApiKey ? 'Meesho Partner Feed active' : 'Live Meesho listings via SerpApi active'
    };
  }

  public async search(query: string, filters?: SearchFilters): Promise<Product[]> {
    if (!this.isConfigured()) {
      return [];
    }

    if (!config.meesho.partnerApiKey || !config.meesho.partnerEndpoint) {
      const { serpApiProvider } = await import('./serpApiProvider');
      return serpApiProvider.searchStore('meesho', query, filters);
    }

    try {
      const response = await axios.get(config.meesho.partnerEndpoint, {
        params: { q: query, maxPrice: filters?.maxBudget },
        headers: {
          'Authorization': `Bearer ${config.meesho.partnerApiKey}`,
          'Accept': 'application/json'
        },
        timeout: 8000
      });

      const items = response.data?.products || [];
      return items.map((item: any) => this.normalizeItem(item));
    } catch (error: any) {
      console.error('❌ Meesho Partner API Search Error:', error.message);
      return [];
    }
  }

  public async getProduct(productId: string): Promise<Product | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await axios.get(`${config.meesho.partnerEndpoint}/${productId}`, {
        headers: {
          'Authorization': `Bearer ${config.meesho.partnerApiKey}`
        },
        timeout: 8000
      });
      if (response.data) return this.normalizeItem(response.data);
      return null;
    } catch (error: any) {
      console.error('❌ Meesho Partner API GetProduct Error:', error.message);
      return null;
    }
  }

  private normalizeItem(item: any): Product {
    const pid = String(item.id || item.productId || 'UNKNOWN_MEESHO');
    const price = item.price || 0;
    const mrp = item.mrp || price;
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    return {
      store: 'meesho',
      productId: pid,
      title: item.title || item.name || 'Meesho Product',
      imageUrl: item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : '') || '',
      images: Array.isArray(item.images) ? item.images : (item.image || item.imageUrl ? [item.image || item.imageUrl] : []),
      price,
      mrp,
      discountPct,
      rating: item.rating || 4.0,
      ratingCount: item.reviewsCount || 80,
      deliveryDays: 4,
      shippingFee: 0, // Meesho typically free delivery
      seller: item.supplierName || 'Meesho Reseller / Supplier',
      inStock: item.inStock !== false,
      quantity: '1 Item',
      productUrl: item.url || `https://www.meesho.com/p/${pid}`,
      affiliateUrl: item.affiliateUrl || item.url || `https://www.meesho.com/p/${pid}`,
      returnPolicy: '7 Days Easy Returns',
      fulfilledByStore: false,
      highlights: ['Direct from Manufacturer', 'Lowest Reseller Price']
    };
  }
}

export const meeshoProvider = new MeeshoProvider();
