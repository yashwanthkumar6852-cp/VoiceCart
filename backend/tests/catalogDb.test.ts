import { catalogDb } from '../src/catalog/catalogDb';

describe('CatalogDb - Catalog Persistence, Querying & Faceting', () => {
  const testProduct = {
    store: 'amazon' as const,
    productId: 'test_upsert_gadget_001',
    title: 'Test Sonic Wireless Over-Ear Headphones with ANC',
    brand: 'TestBrand',
    model: 'Sonic ANC 1',
    category: 'audio',
    subCategory: 'earbuds',
    price: 3499,
    mrp: 6999,
    discountPct: 50,
    rating: 4.5,
    ratingCount: 1200,
    reviewCount: 150,
    imageUrl: 'https://m.media-amazon.com/images/I/test.jpg',
    productUrl: 'https://amazon.in/dp/test_upsert_gadget_001',
    highlights: ['Active Noise Cancellation', '35 Hours Battery Life'],
    specifications: {
      General: { 'Model Name': 'Sonic ANC 1', Color: 'Matte Black' }
    }
  };

  it('idempotently upserts products without data loss', async () => {
    const saved = await catalogDb.upsertProduct(testProduct);
    expect(saved).not.toBeNull();
    expect(saved?.productId).toBe('test_upsert_gadget_001');

    // Partial refresh: update price without specifying highlights or specs
    const refreshed = await catalogDb.upsertProduct({
      store: 'amazon',
      productId: 'test_upsert_gadget_001',
      title: 'Test Sonic Wireless Over-Ear Headphones with ANC',
      price: 3299,
      imageUrl: 'https://m.media-amazon.com/images/I/test.jpg',
      productUrl: 'https://amazon.in/dp/test_upsert_gadget_001'
    });
    expect(refreshed).not.toBeNull();

    // Verify stored product retains original brand, model, specs and has updated price
    const retrieved = await catalogDb.getProduct('amazon', 'test_upsert_gadget_001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.price).toBe(3299);
    expect(retrieved?.brand).toBe('TestBrand');
    expect(retrieved?.specifications?.General).toBeDefined();
  });

  it('correctly paginates catalog query results', async () => {
    const res = await catalogDb.queryCatalog({ page: 1, limit: 10 });
    expect(res.products.length).toBeLessThanOrEqual(10);
    expect(res.total).toBeGreaterThan(0);
    expect(res.page).toBe(1);
    expect(res.totalPages).toBe(Math.ceil(res.total / 10));
  });

  it('filters catalog items accurately by store and category', async () => {
    const res = await catalogDb.queryCatalog({
      category: 'tablets',
      store: 'amazon',
      limit: 10
    });
    expect(res.products.length).toBeGreaterThan(0);
    res.products.forEach(p => {
      expect(p.category).toBe('tablets');
      expect(p.store).toBe('amazon');
    });
  });

  it('retrieves faceted filter values including brand counts and store counts', async () => {
    const facets = await catalogDb.getFacetedFilters('tablets');
    expect(facets.stores).toBeDefined();
    expect(facets.brands).toBeDefined();
    expect(facets.priceRanges).toBeDefined();

    const amzStore = facets.stores.find(s => s.store === 'amazon');
    expect(amzStore).toBeDefined();
    expect(amzStore?.count).toBeGreaterThan(0);
  });

  it('retrieves top deals ordered by verified discounts', async () => {
    const deals = await catalogDb.getTopDeals(undefined, 5);
    expect(deals.length).toBeGreaterThan(0);
    for (let i = 1; i < deals.length; i++) {
      expect(deals[i - 1].discountPct).toBeGreaterThanOrEqual(deals[i].discountPct);
    }
  });
});
