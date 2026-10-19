import { Product, SearchFilters, StoreName } from '../types/product';

export interface IStoreProvider {
  name: StoreName;
  displayName: string;
  isConfigured(): boolean;
  search(query: string, filters?: SearchFilters): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  checkHealth(): Promise<{ isAvailable: boolean; message?: string }>;
}
