import { dbClient } from '../db/dbClient';
import { Product, StoreName } from '../types/product';
import { CrossStoreMatcher } from './crossStoreMatcher';
import { QualityGate } from './qualityGate';

export interface CatalogSearchParams {
  query?: string;
  category?: string;
  subCategory?: string;
  store?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'discount' | 'newest';
  page?: number;
  limit?: number;
}

export interface CatalogBrowseResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CatalogDb {
  /**
   * Idempotently upserts a product and its associated tables. Never overwrites valid data with nulls.
   */
  public async upsertProduct(product: Partial<Product> & { category?: string; subCategory?: string }): Promise<Product | null> {
    const validation = QualityGate.validate(product);
    if (!validation.isValid || !validation.normalizedProduct) {
      return null;
    }

    const p = validation.normalizedProduct;
    const now = new Date().toISOString();
    const id = `${p.store}_${p.productId}`;
    const matchGroupId = p.matchGroupId || CrossStoreMatcher.computeMatchGroupId(p);
    p.matchGroupId = matchGroupId;

    const rawPayload = JSON.stringify({
      highlights: p.highlights,
      offers: p.offers,
      returnPolicy: p.returnPolicy,
      warranty: p.warranty,
      delivery: p.delivery,
      sellerInfo: p.sellerInfo
    });

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const sql = `
        INSERT INTO products (
          id, store, product_id, canonical_url, title, brand, model, category, sub_category,
          price, mrp, discount_pct, rating, rating_count, review_count, stock_status,
          seller, delivery, deep_link, first_seen_at, last_seen_at, price_updated_at,
          source, match_group_id, raw_payload
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
        ON CONFLICT (store, product_id) DO UPDATE SET
          canonical_url = EXCLUDED.canonical_url,
          title = EXCLUDED.title,
          brand = COALESCE(EXCLUDED.brand, products.brand),
          model = COALESCE(EXCLUDED.model, products.model),
          category = CASE 
            WHEN EXCLUDED.category IS NOT NULL AND EXCLUDED.category != 'general' AND EXCLUDED.category != 'all' THEN EXCLUDED.category 
            ELSE COALESCE(products.category, EXCLUDED.category) 
          END,
          sub_category = CASE 
            WHEN EXCLUDED.sub_category IS NOT NULL AND EXCLUDED.sub_category != 'general' AND EXCLUDED.sub_category != 'all' THEN EXCLUDED.sub_category 
            ELSE COALESCE(products.sub_category, EXCLUDED.sub_category) 
          END,
          price = EXCLUDED.price,
          mrp = COALESCE(EXCLUDED.mrp, products.mrp),
          discount_pct = EXCLUDED.discount_pct,
          rating = COALESCE(EXCLUDED.rating, products.rating),
          rating_count = GREATEST(EXCLUDED.rating_count, products.rating_count),
          review_count = GREATEST(EXCLUDED.review_count, products.review_count),
          stock_status = EXCLUDED.stock_status,
          seller = COALESCE(EXCLUDED.seller, products.seller),
          delivery = COALESCE(EXCLUDED.delivery, products.delivery),
          deep_link = EXCLUDED.deep_link,
          last_seen_at = EXCLUDED.last_seen_at,
          price_updated_at = EXCLUDED.price_updated_at,
          source = EXCLUDED.source,
          match_group_id = COALESCE(EXCLUDED.match_group_id, products.match_group_id),
          raw_payload = EXCLUDED.raw_payload;
      `;
      await dbClient.pgPool.query(sql, [
        id, p.store, p.productId, p.productUrl, p.title, p.brand || null, p.model || null,
        p.category || 'general', p.subCategory || null, p.price, p.mrp || p.price,
        p.discountPct || 0, p.rating || 4.0, p.ratingCount || 0, p.reviewCount || 0,
        p.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK', p.seller || null, p.delivery?.date || null,
        p.affiliateUrl || p.productUrl, now, now, now, p.source || 'catalog',
        matchGroupId, rawPayload
      ]);

      // Record price history
      await dbClient.pgPool.query(
        `INSERT INTO price_history (product_id, store, price, seen_at) VALUES ($1, $2, $3, $4)`,
        [p.productId, p.store, p.price, now]
      );

      // Upsert Images
      const images = p.images && p.images.length > 0 ? p.images : [p.imageUrl];
      try {
        await dbClient.pgPool.query('DELETE FROM product_images WHERE store = $1 AND product_id = $2', [p.store, p.productId]);
      } catch {}
      for (let i = 0; i < images.length; i++) {
        await dbClient.pgPool.query(
          `INSERT INTO product_images (product_id, store, url, is_primary, order_index)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (store, product_id, url) DO NOTHING`,
          [p.productId, p.store, images[i], i === 0, i]
        );
      }

      // Upsert Specs
      if (p.specifications) {
        for (const [groupName, specs] of Object.entries(p.specifications)) {
          for (const [key, value] of Object.entries(specs)) {
            await dbClient.pgPool.query(
              `INSERT INTO product_specs (product_id, store, group_name, spec_key, spec_value)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (store, product_id, group_name, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
              [p.productId, p.store, groupName, key, String(value)]
            );
          }
        }
      }

      // Upsert Offers
      if (p.offers && p.offers.length > 0) {
        try {
          await dbClient.pgPool.query('DELETE FROM product_offers WHERE store = $1 AND product_id = $2', [p.store, p.productId]);
        } catch {}
        for (const offer of p.offers) {
          await dbClient.pgPool.query(
            `INSERT INTO product_offers (product_id, store, title) VALUES ($1, $2, $3)`,
            [p.productId, p.store, offer]
          );
        }
      }
    } else if (dbClient.sqliteDb) {
      const sql = `
        INSERT INTO products (
          id, store, product_id, canonical_url, title, brand, model, category, sub_category,
          price, mrp, discount_pct, rating, rating_count, review_count, stock_status,
          seller, delivery, deep_link, first_seen_at, last_seen_at, price_updated_at,
          source, match_group_id, raw_payload
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(store, product_id) DO UPDATE SET
          canonical_url = excluded.canonical_url,
          title = excluded.title,
          brand = COALESCE(excluded.brand, products.brand),
          model = COALESCE(excluded.model, products.model),
          category = CASE 
            WHEN excluded.category IS NOT NULL AND excluded.category != 'general' AND excluded.category != 'all' THEN excluded.category 
            ELSE COALESCE(products.category, excluded.category) 
          END,
          sub_category = CASE 
            WHEN excluded.sub_category IS NOT NULL AND excluded.sub_category != 'general' AND excluded.sub_category != 'all' THEN excluded.sub_category 
            ELSE COALESCE(products.sub_category, excluded.sub_category) 
          END,
          price = excluded.price,
          mrp = COALESCE(excluded.mrp, products.mrp),
          discount_pct = excluded.discount_pct,
          rating = COALESCE(excluded.rating, products.rating),
          rating_count = MAX(excluded.rating_count, products.rating_count),
          review_count = MAX(excluded.review_count, products.review_count),
          stock_status = excluded.stock_status,
          seller = COALESCE(excluded.seller, products.seller),
          delivery = COALESCE(excluded.delivery, products.delivery),
          deep_link = excluded.deep_link,
          last_seen_at = excluded.last_seen_at,
          price_updated_at = excluded.price_updated_at,
          source = excluded.source,
          match_group_id = COALESCE(excluded.match_group_id, products.match_group_id),
          raw_payload = excluded.raw_payload;
      `;

      dbClient.sqliteDb.prepare(sql).run(
        id, p.store, p.productId, p.productUrl, p.title, p.brand || null, p.model || null,
        p.category || 'general', p.subCategory || null, p.price, p.mrp || p.price,
        p.discountPct || 0, p.rating || 4.0, p.ratingCount || 0, p.reviewCount || 0,
        p.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK', p.seller || null, p.delivery?.date || null,
        p.affiliateUrl || p.productUrl, now, now, now, p.source || 'catalog',
        matchGroupId, rawPayload
      );

      // Record price history
      try {
        dbClient.sqliteDb.prepare(
          `INSERT INTO price_history (product_id, store, price, seen_at) VALUES (?, ?, ?, ?)`
        ).run(p.productId, p.store, p.price, now);
      } catch {}

      // Upsert Images
      const images = p.images && p.images.length > 0 ? p.images : [p.imageUrl];
      try {
        dbClient.sqliteDb.prepare('DELETE FROM product_images WHERE store = ? AND product_id = ?').run(p.store, p.productId);
      } catch {}
      const insertImgStmt = dbClient.sqliteDb.prepare(
        `INSERT OR IGNORE INTO product_images (product_id, store, url, is_primary, order_index)
         VALUES (?, ?, ?, ?, ?)`
      );
      for (let i = 0; i < images.length; i++) {
        try {
          insertImgStmt.run(p.productId, p.store, images[i], i === 0 ? 1 : 0, i);
        } catch {}
      }

      // Upsert Specs
      if (p.specifications) {
        const insertSpecStmt = dbClient.sqliteDb.prepare(
          `INSERT INTO product_specs (product_id, store, group_name, spec_key, spec_value)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(store, product_id, group_name, spec_key) DO UPDATE SET spec_value = excluded.spec_value`
        );
        for (const [groupName, specs] of Object.entries(p.specifications)) {
          for (const [key, value] of Object.entries(specs)) {
            try {
              insertSpecStmt.run(p.productId, p.store, groupName, key, String(value));
            } catch {}
          }
        }
      }

      // Upsert Offers
      if (p.offers && p.offers.length > 0) {
        try {
          dbClient.sqliteDb.prepare('DELETE FROM product_offers WHERE store = ? AND product_id = ?').run(p.store, p.productId);
        } catch {}
        const insertOfferStmt = dbClient.sqliteDb.prepare(
          `INSERT INTO product_offers (product_id, store, title) VALUES (?, ?, ?)`
        );
        for (const offer of p.offers) {
          try {
            insertOfferStmt.run(p.productId, p.store, offer);
          } catch {}
        }
      }
    }

    return p;
  }

  /**
   * Fetches full product details including images, specs, offers, variants, and price history.
   */
  public async getProduct(store: string, productId: string): Promise<Product | null> {
    let row: any = null;
    let images: any[] = [];
    let specs: any[] = [];
    let offers: any[] = [];
    let variants: any[] = [];
    let priceHistory: any[] = [];

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const res = await dbClient.pgPool.query(
        'SELECT * FROM products WHERE store = $1 AND product_id = $2',
        [store, productId]
      );
      if (res.rows.length === 0) return null;
      row = res.rows[0];

      const imgRes = await dbClient.pgPool.query(
        'SELECT * FROM product_images WHERE store = $1 AND product_id = $2 ORDER BY order_index ASC',
        [store, productId]
      );
      images = imgRes.rows;

      const specRes = await dbClient.pgPool.query(
        'SELECT * FROM product_specs WHERE store = $1 AND product_id = $2',
        [store, productId]
      );
      specs = specRes.rows;

      const offerRes = await dbClient.pgPool.query(
        'SELECT * FROM product_offers WHERE store = $1 AND product_id = $2',
        [store, productId]
      );
      offers = offerRes.rows;

      const varRes = await dbClient.pgPool.query(
        'SELECT * FROM product_variants WHERE store = $1 AND product_id = $2',
        [store, productId]
      );
      variants = varRes.rows;

      const phRes = await dbClient.pgPool.query(
        'SELECT price, seen_at FROM price_history WHERE store = $1 AND product_id = $2 ORDER BY seen_at DESC LIMIT 15',
        [store, productId]
      );
      priceHistory = phRes.rows;
    } else if (dbClient.sqliteDb) {
      row = dbClient.sqliteDb.prepare(
        'SELECT * FROM products WHERE store = ? AND product_id = ?'
      ).get(store, productId);
      if (!row) return null;

      images = dbClient.sqliteDb.prepare(
        'SELECT * FROM product_images WHERE store = ? AND product_id = ? ORDER BY order_index ASC'
      ).all(store, productId);

      specs = dbClient.sqliteDb.prepare(
        'SELECT * FROM product_specs WHERE store = ? AND product_id = ?'
      ).all(store, productId);

      offers = dbClient.sqliteDb.prepare(
        'SELECT * FROM product_offers WHERE store = ? AND product_id = ?'
      ).all(store, productId);

      variants = dbClient.sqliteDb.prepare(
        'SELECT * FROM product_variants WHERE store = ? AND product_id = ?'
      ).all(store, productId);

      priceHistory = dbClient.sqliteDb.prepare(
        'SELECT price, seen_at FROM price_history WHERE store = ? AND product_id = ? ORDER BY seen_at DESC LIMIT 15'
      ).all(store, productId);
    }

    if (!row) return null;

    let rawPayload: any = {};
    try {
      rawPayload = typeof row.raw_payload === 'string' ? JSON.parse(row.raw_payload) : (row.raw_payload || {});
    } catch {}

    const structuredSpecs: Record<string, Record<string, string>> = {};
    for (const s of specs) {
      const g = s.group_name || 'General';
      if (!structuredSpecs[g]) structuredSpecs[g] = {};
      structuredSpecs[g][s.spec_key] = s.spec_value;
    }

    const imageList = images.map(img => img.url);
    const primaryImg = images.find(img => img.is_primary)?.url || imageList[0] || '';

    return {
      store: row.store as StoreName,
      productId: row.product_id,
      title: row.title,
      brand: row.brand || undefined,
      model: row.model || undefined,
      category: row.category,
      subCategory: row.sub_category,
      price: Number(row.price),
      mrp: Number(row.mrp) || Number(row.price),
      discountPct: Number(row.discount_pct) || 0,
      rating: Number(row.rating) || 4.0,
      ratingCount: Number(row.rating_count) || 0,
      reviewCount: Number(row.review_count) || 0,
      imageUrl: primaryImg,
      images: imageList.length > 0 ? imageList : [primaryImg],
      deliveryDays: 3,
      shippingFee: 0,
      delivery: {
        date: row.delivery || 'Standard Delivery',
        charge: 0,
        isFree: true
      },
      seller: row.seller || row.store,
      sellerInfo: rawPayload.sellerInfo,
      inStock: row.stock_status !== 'OUT_OF_STOCK',
      productUrl: row.canonical_url || '',
      affiliateUrl: row.deep_link || row.canonical_url || '',
      matchGroupId: row.match_group_id || undefined,
      source: row.source || 'catalog',
      fetchedAt: row.last_seen_at,
      priceUpdatedAt: row.price_updated_at,
      highlights: rawPayload.highlights || [],
      offers: offers.map(o => o.title),
      specifications: structuredSpecs,
      returnPolicy: rawPayload.returnPolicy,
      warranty: rawPayload.warranty
    };
  }

  /**
   * Fetches all store offers for a match group (Amazon, Flipkart, Meesho) for cross-store comparison.
   */
  public async getProductByMatchGroup(matchGroupId: string): Promise<Product[]> {
    if (!matchGroupId) return [];

    let rows: any[] = [];
    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const res = await dbClient.pgPool.query(
        'SELECT store, product_id FROM products WHERE match_group_id = $1',
        [matchGroupId]
      );
      rows = res.rows;
    } else if (dbClient.sqliteDb) {
      rows = dbClient.sqliteDb.prepare(
        'SELECT store, product_id FROM products WHERE match_group_id = ?'
      ).all(matchGroupId);
    }

    const products: Product[] = [];
    for (const r of rows) {
      const p = await this.getProduct(r.store, r.product_id);
      if (p) products.push(p);
    }
    return products;
  }

  /**
   * Query local catalog by query or category/subCategory with faceted filters, sorting and pagination.
   */
  public async queryCatalog(params: CatalogSearchParams): Promise<CatalogBrowseResult> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 24));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const args: any[] = [];
    let paramIndex = 1;

    const addCondition = (pgClause: string, sqliteClause: string, value: any) => {
      if (dbClient.dbType === 'postgresql') {
        conditions.push(pgClause.replace('$?', `$${paramIndex++}`));
        args.push(value);
      } else {
        conditions.push(sqliteClause);
        args.push(value);
      }
    };

    if (params.query && params.query.trim()) {
      const qTokens = params.query.trim().toLowerCase().split(/\s+/).filter(t => t.length > 1);
      if (qTokens.length > 0) {
        const subConds: string[] = [];
        for (const token of qTokens) {
          const pattern = `%${token}%`;
          if (dbClient.dbType === 'postgresql') {
            subConds.push(`(LOWER(title) LIKE $${paramIndex} OR LOWER(brand) LIKE $${paramIndex} OR LOWER(model) LIKE $${paramIndex} OR LOWER(category) LIKE $${paramIndex})`);
            paramIndex++;
            args.push(pattern);
          } else {
            subConds.push(`(LOWER(title) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(model) LIKE ? OR LOWER(category) LIKE ?)`);
            args.push(pattern, pattern, pattern, pattern);
          }
        }
        conditions.push(`(${subConds.join(' AND ')})`);
      }
    }

    if (params.category && params.category !== 'all') {
      addCondition('category = $?', 'category = ?', params.category.toLowerCase());
    }

    if (params.subCategory && params.subCategory !== 'all') {
      addCondition('sub_category = $?', 'sub_category = ?', params.subCategory.toLowerCase());
    }

    if (params.store && params.store !== 'all') {
      addCondition('store = $?', 'store = ?', params.store.toLowerCase());
    }

    if (params.brand && params.brand !== 'all') {
      addCondition('LOWER(brand) = $?', 'LOWER(brand) = ?', params.brand.toLowerCase());
    }

    if (params.minPrice !== undefined && params.minPrice > 0) {
      addCondition('price >= $?', 'price >= ?', params.minPrice);
    }

    if (params.maxPrice !== undefined && params.maxPrice > 0) {
      addCondition('price <= $?', 'price <= ?', params.maxPrice);
    }

    if (params.minRating !== undefined && params.minRating > 0) {
      addCondition('rating >= $?', 'rating >= ?', params.minRating);
    }

    if (params.minDiscount !== undefined && params.minDiscount > 0) {
      addCondition('discount_pct >= $?', 'discount_pct >= ?', params.minDiscount);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY rating DESC, review_count DESC';
    switch (params.sort) {
      case 'price_asc':
        orderBy = 'ORDER BY price ASC';
        break;
      case 'price_desc':
        orderBy = 'ORDER BY price DESC';
        break;
      case 'rating':
        orderBy = 'ORDER BY rating DESC, rating_count DESC';
        break;
      case 'discount':
        orderBy = 'ORDER BY discount_pct DESC, rating DESC';
        break;
      case 'newest':
        orderBy = 'ORDER BY last_seen_at DESC';
        break;
      case 'relevance':
      default:
        orderBy = 'ORDER BY rating DESC, discount_pct DESC';
        break;
    }

    let total = 0;
    let rows: any[] = [];

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const countSql = `SELECT COUNT(*) as cnt FROM products ${whereClause}`;
      const countRes = await dbClient.pgPool.query(countSql, args);
      total = Number(countRes.rows[0]?.cnt || 0);

      const querySql = `
        SELECT p.*,
               (SELECT url FROM product_images WHERE store = p.store AND product_id = p.product_id ORDER BY is_primary DESC, order_index ASC LIMIT 1) as primary_image
        FROM products p
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      const queryRes = await dbClient.pgPool.query(querySql, [...args, limit, offset]);
      rows = queryRes.rows;
    } else if (dbClient.sqliteDb) {
      const countSql = `SELECT COUNT(*) as cnt FROM products ${whereClause}`;
      const countRow: any = dbClient.sqliteDb.prepare(countSql).get(...args);
      total = Number(countRow?.cnt || 0);

      const querySql = `
        SELECT p.*,
               (SELECT url FROM product_images WHERE store = p.store AND product_id = p.product_id ORDER BY is_primary DESC, order_index ASC LIMIT 1) as primary_image
        FROM products p
        ${whereClause}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;
      rows = dbClient.sqliteDb.prepare(querySql).all(...args, limit, offset);
    }

    const products: Product[] = rows.map(r => ({
      store: r.store as StoreName,
      productId: r.product_id,
      title: r.title,
      brand: r.brand || undefined,
      model: r.model || undefined,
      category: r.category,
      subCategory: r.sub_category,
      price: Number(r.price),
      mrp: Number(r.mrp) || Number(r.price),
      discountPct: Number(r.discount_pct) || 0,
      rating: Number(r.rating) || 4.0,
      ratingCount: Number(r.rating_count) || 0,
      reviewCount: Number(r.review_count) || 0,
      imageUrl: r.primary_image || '',
      images: [r.primary_image || ''],
      deliveryDays: 3,
      shippingFee: 0,
      delivery: {
        date: r.delivery || 'Standard Delivery',
        charge: 0,
        isFree: true
      },
      seller: r.seller || r.store,
      inStock: r.stock_status !== 'OUT_OF_STOCK',
      productUrl: r.canonical_url || '',
      affiliateUrl: r.deep_link || r.canonical_url || '',
      matchGroupId: r.match_group_id || undefined,
      source: r.source || 'catalog',
      fetchedAt: r.last_seen_at,
      priceUpdatedAt: r.price_updated_at
    }));

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Top deals computed from real data with verified discounts >= 20% and ratings >= 3.8.
   */
  public async getTopDeals(category?: string, limit = 12): Promise<Product[]> {
    return (await this.queryCatalog({
      category: category && category !== 'all' ? category : undefined,
      minDiscount: 20,
      minRating: 3.8,
      sort: 'discount',
      limit
    })).products;
  }

  /**
   * Distinct brands with count for category.
   */
  public async getBrands(category?: string): Promise<{ brand: string; count: number }[]> {
    let rows: any[] = [];
    const catClause = category && category !== 'all' ? 'WHERE category = ? AND brand IS NOT NULL AND TRIM(brand) != \'\'' : 'WHERE brand IS NOT NULL AND TRIM(brand) != \'\'';

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const pgClause = category && category !== 'all' ? 'WHERE category = $1 AND brand IS NOT NULL AND TRIM(brand) != \'\'' : 'WHERE brand IS NOT NULL AND TRIM(brand) != \'\'';
      const sql = `SELECT brand, COUNT(*) as count FROM products ${pgClause} GROUP BY brand ORDER BY count DESC LIMIT 20`;
      const res = await dbClient.pgPool.query(sql, category && category !== 'all' ? [category.toLowerCase()] : []);
      rows = res.rows;
    } else if (dbClient.sqliteDb) {
      const sql = `SELECT brand, COUNT(*) as count FROM products ${catClause} GROUP BY brand ORDER BY count DESC LIMIT 20`;
      rows = dbClient.sqliteDb.prepare(sql).all(category && category !== 'all' ? [category.toLowerCase()] : []);
    }

    return rows.map(r => ({ brand: r.brand, count: Number(r.count) }));
  }

  /**
   * Faceted filters for frontend browsing (dynamic counts for store, brand, price bands, ratings).
   */
  public async getFacetedFilters(category?: string, subCategory?: string) {
    const brands = await this.getBrands(category);

    const priceBands = [
      { id: 'under_1000', label: 'Under ₹1,000', min: 0, max: 1000 },
      { id: '1000_5000', label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
      { id: '5000_15000', label: '₹5,000 - ₹15,000', min: 5000, max: 15000 },
      { id: '15000_30000', label: '₹15,000 - ₹30,000', min: 15000, max: 30000 },
      { id: 'above_30000', label: 'Above ₹30,000', min: 30000, max: 1000000 }
    ];

    const priceCounts: Record<string, number> = {};
    for (const b of priceBands) {
      const res = await this.queryCatalog({
        category,
        subCategory,
        minPrice: b.min,
        maxPrice: b.max,
        limit: 1
      });
      priceCounts[b.id] = res.total;
    }

    // Stores counts
    const stores = ['amazon', 'flipkart', 'meesho'];
    const storeCounts: Record<string, number> = {};
    for (const s of stores) {
      const res = await this.queryCatalog({
        category,
        subCategory,
        store: s,
        limit: 1
      });
      storeCounts[s] = res.total;
    }

    return {
      brands,
      stores: stores.map(s => ({ store: s, count: storeCounts[s] || 0 })),
      priceRanges: priceBands.map(b => ({ ...b, count: priceCounts[b.id] || 0 })),
      ratings: [
        { min: 4.5, label: '4.5★ and above' },
        { min: 4.0, label: '4.0★ and above' },
        { min: 3.5, label: '3.5★ and above' }
      ],
      discounts: [
        { min: 50, label: '50% or more' },
        { min: 30, label: '30% or more' },
        { min: 20, label: '20% or more' },
        { min: 10, label: '10% or more' }
      ]
    };
  }

  /**
   * Returns catalog summary stats for monitoring and debug panel.
   */
  public async getCatalogStatus(): Promise<any> {
    let total = 0;
    let storeCounts: any[] = [];
    let categoryCounts: any[] = [];
    let withImages = 0;
    let withSpecs = 0;
    let withRating = 0;

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const tRes = await dbClient.pgPool.query('SELECT COUNT(*) as cnt FROM products');
      total = Number(tRes.rows[0]?.cnt || 0);

      const sRes = await dbClient.pgPool.query('SELECT store, COUNT(*) as cnt FROM products GROUP BY store');
      storeCounts = sRes.rows;

      const cRes = await dbClient.pgPool.query('SELECT category, COUNT(*) as cnt FROM products GROUP BY category ORDER BY cnt DESC');
      categoryCounts = cRes.rows;

      const imgRes = await dbClient.pgPool.query('SELECT COUNT(DISTINCT product_id) as cnt FROM product_images');
      withImages = Number(imgRes.rows[0]?.cnt || 0);

      const specRes = await dbClient.pgPool.query('SELECT COUNT(DISTINCT product_id) as cnt FROM product_specs');
      withSpecs = Number(specRes.rows[0]?.cnt || 0);

      const rRes = await dbClient.pgPool.query('SELECT COUNT(*) as cnt FROM products WHERE rating > 0');
      withRating = Number(rRes.rows[0]?.cnt || 0);
    } else if (dbClient.sqliteDb) {
      const tRow: any = dbClient.sqliteDb.prepare('SELECT COUNT(*) as cnt FROM products').get();
      total = Number(tRow?.cnt || 0);

      storeCounts = dbClient.sqliteDb.prepare('SELECT store, COUNT(*) as cnt FROM products GROUP BY store').all();
      categoryCounts = dbClient.sqliteDb.prepare('SELECT category, COUNT(*) as cnt FROM products GROUP BY category ORDER BY cnt DESC').all();

      const imgRow: any = dbClient.sqliteDb.prepare('SELECT COUNT(DISTINCT product_id) as cnt FROM product_images').get();
      withImages = Number(imgRow?.cnt || 0);

      const specRow: any = dbClient.sqliteDb.prepare('SELECT COUNT(DISTINCT product_id) as cnt FROM product_specs').get();
      withSpecs = Number(specRow?.cnt || 0);

      const rRow: any = dbClient.sqliteDb.prepare('SELECT COUNT(*) as cnt FROM products WHERE rating > 0').get();
      withRating = Number(rRow?.cnt || 0);
    }

    return {
      totalProducts: total,
      productsWithImages: withImages,
      productsWithSpecs: withSpecs,
      productsWithRating: withRating,
      storeBreakdown: storeCounts.reduce((acc, r) => ({ ...acc, [r.store]: Number(r.cnt) }), {}),
      categoryBreakdown: categoryCounts.reduce((acc, r) => ({ ...acc, [r.category]: Number(r.cnt) }), {})
    };
  }

  // ==========================================
  // JOB TRACKING FOR INGESTION
  // ==========================================

  public async recordJobStart(jobName: string, category?: string): Promise<number> {
    const now = new Date().toISOString();
    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const res = await dbClient.pgPool.query(
        'INSERT INTO catalog_jobs (job_name, category, status, started_at) VALUES ($1, $2, $3, $4) RETURNING id',
        [jobName, category || null, 'running', now]
      );
      return Number(res.rows[0]?.id || 0);
    } else if (dbClient.sqliteDb) {
      const res = dbClient.sqliteDb.prepare(
        'INSERT INTO catalog_jobs (job_name, category, status, started_at) VALUES (?, ?, ?, ?)'
      ).run(jobName, category || null, 'running', now);
      return Number(res.lastInsertRowid);
    }
    return 0;
  }

  public async updateJobProgress(jobId: number, status: string, counts: any, errors: any): Promise<void> {
    const countsJson = JSON.stringify(counts);
    const errorsJson = JSON.stringify(errors);
    const now = new Date().toISOString();

    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      await dbClient.pgPool.query(
        'UPDATE catalog_jobs SET status = $1, counts_json = $2, errors_json = $3, completed_at = $4 WHERE id = $5',
        [status, countsJson, errorsJson, status === 'completed' || status === 'failed' ? now : null, jobId]
      );
    } else if (dbClient.sqliteDb) {
      dbClient.sqliteDb.prepare(
        'UPDATE catalog_jobs SET status = ?, counts_json = ?, errors_json = ?, completed_at = ? WHERE id = ?'
      ).run(status, countsJson, errorsJson, status === 'completed' || status === 'failed' ? now : null, jobId);
    }
  }

  public async getLastCompletedJob(jobName: string): Promise<any> {
    if (dbClient.dbType === 'postgresql' && dbClient.pgPool) {
      const res = await dbClient.pgPool.query(
        'SELECT * FROM catalog_jobs WHERE job_name = $1 AND status = $2 ORDER BY started_at DESC LIMIT 1',
        [jobName, 'completed']
      );
      return res.rows[0] || null;
    } else if (dbClient.sqliteDb) {
      return dbClient.sqliteDb.prepare(
        'SELECT * FROM catalog_jobs WHERE job_name = ? AND status = ? ORDER BY started_at DESC LIMIT 1'
      ).get(jobName, 'completed') || null;
    }
    return null;
  }
}

export const catalogDb = new CatalogDb();
