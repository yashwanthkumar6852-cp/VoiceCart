import { amazonProvider } from '../src/providers/amazonProvider';
import { flipkartProvider } from '../src/providers/flipkartProvider';
import { meeshoProvider } from '../src/providers/meeshoProvider';

describe('Store Providers Compliance and Adapter Tests', () => {
  test('AmazonProvider implements IStoreProvider interface', () => {
    expect(amazonProvider.name).toBe('amazon');
    expect(amazonProvider.displayName).toBe('Amazon India');
    expect(typeof amazonProvider.search).toBe('function');
    expect(typeof amazonProvider.getProduct).toBe('function');
    expect(typeof amazonProvider.checkHealth).toBe('function');
  });

  test('FlipkartProvider implements IStoreProvider interface', () => {
    expect(flipkartProvider.name).toBe('flipkart');
    expect(flipkartProvider.displayName).toBe('Flipkart');
    expect(typeof flipkartProvider.search).toBe('function');
    expect(typeof flipkartProvider.getProduct).toBe('function');
  });

  test('MeeshoProvider respects strict compliance: no scraping or fake data', async () => {
    expect(meeshoProvider.name).toBe('meesho');
    const health = await meeshoProvider.checkHealth();
    // If not configured, it should cleanly report missing credentials
    if (!meeshoProvider.isConfigured()) {
      expect(health.isAvailable).toBe(false);
      const results = await meeshoProvider.search('earbuds');
      expect(results).toEqual([]);
    }
  });
});
