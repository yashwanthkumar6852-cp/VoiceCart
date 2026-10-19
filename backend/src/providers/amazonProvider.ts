import crypto from 'crypto';
import axios from 'axios';
import { IStoreProvider } from './storeProvider.interface';
import { Product, SearchFilters, StoreName } from '../types/product';
import { config } from '../config';

export class AmazonProvider implements IStoreProvider {
  public name: StoreName = 'amazon';
  public displayName = 'Amazon India';

  public isConfigured(): boolean {
    return Boolean((config.amazon.accessKey && config.amazon.secretKey && config.amazon.partnerTag) || config.serpApiKey);
  }

  public async checkHealth(): Promise<{ isAvailable: boolean; message?: string }> {
    if (!this.isConfigured()) {
      return {
        isAvailable: false,
        message: 'Amazon credentials missing in .env (AMAZON_ACCESS_KEY or SERPAPI_KEY)'
      };
    }
    return {
      isAvailable: true,
      message: config.amazon.accessKey ? 'Amazon PA-API 5.0 active' : 'Live Amazon India via SerpApi active'
    };
  }

  public async search(query: string, filters?: SearchFilters): Promise<Product[]> {
    if (!this.isConfigured()) {
      console.warn('⚠️ Amazon credentials not configured.');
      return [];
    }

    if (!config.amazon.accessKey || !config.amazon.secretKey || config.amazon.accessKey.startsWith('your_') || config.amazon.accessKey.length < 10) {
      const { serpApiProvider } = await import('./serpApiProvider');
      return serpApiProvider.searchStore('amazon', query, filters);
    }

    const payload: any = {
      Keywords: query,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'Images.Primary.Large',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'Offers.Listings.MerchantInfo',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count'
      ],
      ItemCount: 10,
      PartnerTag: config.amazon.partnerTag,
      PartnerType: 'Associates',
      Marketplace: config.amazon.marketplace
    };

    if (filters?.minBudget) {
      payload.MinPrice = Math.floor(filters.minBudget * 100); // in paise
    }
    if (filters?.maxBudget) {
      payload.MaxPrice = Math.ceil(filters.maxBudget * 100); // in paise
    }
    if (filters?.brand) {
      payload.Brand = filters.brand;
    }

    try {
      const response = await this.sendPaApiRequest('com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems', payload);
      const searchResult = response?.SearchResult;
      if (!searchResult || !searchResult.Items || !Array.isArray(searchResult.Items)) {
        const { serpApiProvider } = await import('./serpApiProvider');
        return serpApiProvider.searchStore('amazon', query, filters);
      }

      return searchResult.Items.map((item: any) => this.normalizeItem(item)).filter((p: Product) => p.price > 0);
    } catch (error: any) {
      const { serpApiProvider } = await import('./serpApiProvider');
      return serpApiProvider.searchStore('amazon', query, filters);
    }
  }

  public async getProduct(productId: string): Promise<Product | null> {
    if (
      !this.isConfigured() ||
      !config.amazon.accessKey ||
      !config.amazon.secretKey ||
      config.amazon.accessKey.startsWith('your_') ||
      config.amazon.accessKey.length < 10
    ) {
      return null;
    }

    const payload = {
      ItemIds: [productId],
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.ByLineInfo',
        'ItemInfo.Features',
        'Images.Primary.Large',
        'Offers.Listings.Price',
        'Offers.Listings.SavingBasis',
        'Offers.Listings.DeliveryInfo.IsPrimeEligible',
        'Offers.Listings.MerchantInfo',
        'CustomerReviews.StarRating',
        'CustomerReviews.Count'
      ],
      PartnerTag: config.amazon.partnerTag,
      PartnerType: 'Associates',
      Marketplace: config.amazon.marketplace
    };

    try {
      const response = await this.sendPaApiRequest('com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems', payload);
      const items = response?.ItemsResult?.Items;
      if (!items || items.length === 0) return null;
      return this.normalizeItem(items[0]);
    } catch (error: any) {
      console.error('❌ Amazon PA-API GetItem Error:', error.response?.data || error.message);
      return null;
    }
  }

  private normalizeItem(item: any): Product {
    const asin = item.ASIN || 'UNKNOWN';
    const title = item.ItemInfo?.Title?.DisplayValue || 'Amazon Product';
    const imageUrl = item.Images?.Primary?.Large?.URL || item.Images?.Primary?.Medium?.URL || '';
    const images = [
      item.Images?.Primary?.Large?.URL,
      item.Images?.Primary?.Medium?.URL
    ].filter((u): u is string => Boolean(u && typeof u === 'string'));
    
    const listing = item.Offers?.Listings?.[0];
    const priceAmount = listing?.Price?.Amount || 0;
    const savingBasis = listing?.SavingBasis?.Amount || priceAmount;
    
    const price = priceAmount > 0 ? priceAmount : 0;
    const mrp = savingBasis > price ? savingBasis : price;
    const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

    const rating = item.CustomerReviews?.StarRating?.Value || 4.2;
    const ratingCount = item.CustomerReviews?.Count || 120;
    const isPrime = listing?.DeliveryInfo?.IsPrimeEligible || true;
    const seller = listing?.MerchantInfo?.Name || 'Appario Retail / Amazon Seller';

    const affiliateUrl = item.DetailPageURL 
      ? item.DetailPageURL 
      : `https://www.amazon.in/dp/${asin}?tag=${config.amazon.partnerTag}`;

    return {
      store: 'amazon',
      productId: asin,
      title,
      imageUrl,
      images,
      price,
      mrp,
      discountPct,
      rating,
      ratingCount,
      deliveryDays: isPrime ? 1 : 3,
      shippingFee: isPrime ? 0 : 40,
      seller,
      inStock: Boolean(listing?.Availability?.Type !== 'OutOfStock'),
      quantity: '1 Unit',
      productUrl: `https://www.amazon.in/dp/${asin}`,
      affiliateUrl,
      returnPolicy: '7 Days Replacement / Return',
      fulfilledByStore: isPrime,
      highlights: item.ItemInfo?.Features?.DisplayValues?.slice(0, 3) || []
    };
  }

  /**
   * AWS Signature Version 4 Request Signing for Amazon PA-API 5.0
   */
  private async sendPaApiRequest(target: string, payload: any): Promise<any> {
    const host = config.amazon.host;
    const region = config.amazon.region;
    const service = 'ProductAdvertisingAPI';
    const endpoint = `https://${host}/paapi5/searchitems`; // Or generic path
    const pathUri = target.includes('GetItems') ? '/paapi5/getitems' : '/paapi5/searchitems';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const bodyString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(bodyString, 'utf8').digest('hex');

    const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
    const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

    const canonicalRequest = `POST\n${pathUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex')}`;

    const signingKey = this.getSignatureKey(config.amazon.secretKey, dateStamp, region, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    const authorizationHeader = `${algorithm} Credential=${config.amazon.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await axios.post(`https://${host}${pathUri}`, bodyString, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-encoding': 'amz-1.0',
        'x-amz-date': amzDate,
        'x-amz-target': target,
        'Authorization': authorizationHeader,
        'Host': host
      },
      timeout: 8000
    });

    return response.data;
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp, 'utf8').digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName, 'utf8').digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName, 'utf8').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
    return kSigning;
  }
}

export const amazonProvider = new AmazonProvider();
