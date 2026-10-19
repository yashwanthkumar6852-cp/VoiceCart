import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import Database from 'better-sqlite3';
import { config } from '../config';
import { CartItem, OrderRecord } from '../types/product';
import { UserAccountProfile, UserAddress, SavedPaymentMethod, LoginActivity } from '../types/account';
import { UserRecord, RefreshTokenRecord, PasswordResetRecord, OtpRecord, OtpRequestLog } from '../types/user';

class DatabaseClient {
  public dbType: 'postgresql' | 'sqlite' = 'sqlite';
  public dbLocation: string = '';
  public pgPool: Pool | null = null;
  public sqliteDb: Database.Database | null = null;
  public isReady: boolean = false;

  constructor() {
    this.initDatabase();
  }

  public async runMigrations() {
    if (this.dbType === 'postgresql') {
      await this.runPostgresMigrations();
    } else if (this.sqliteDb) {
      this.runSqliteMigrations();
    }
  }

  private initDatabase() {
    if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
      try {
        const parsedUrl = new URL(config.databaseUrl);
        const host = parsedUrl.hostname;
        const dbName = parsedUrl.pathname.replace(/^\//, '');

        this.pgPool = new Pool({
          connectionString: config.databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.dbType = 'postgresql';
        this.dbLocation = `${host}/${dbName}`;
        this.runPostgresMigrations();
        console.log(`✅ Database: PostgreSQL (Host: ${host}, Database: ${dbName})`);
        this.isReady = true;
        return;
      } catch (err: any) {
        console.warn(`⚠️ Failed to initialize PostgreSQL (${err.message}).`);
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ FATAL ERROR: PostgreSQL connection failed in production mode.');
          process.exit(1);
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL ERROR: In production mode (NODE_ENV=production), VoiceCart requires a valid PostgreSQL DATABASE_URL (Neon, Supabase, Render Postgres, etc.). SQLite/in-memory cannot be used in production.');
      process.exit(1);
    }

    // Default & Fallback: Local persistent SQLite database for development and testing
    try {
      let dataDir = path.resolve(process.cwd(), 'data');
      if (fs.existsSync(path.resolve(process.cwd(), 'backend', 'data', 'voicecart.db'))) {
        dataDir = path.resolve(process.cwd(), 'backend', 'data');
      } else if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'voicecart.db');
      this.sqliteDb = new Database(dbPath);
      this.sqliteDb.pragma('journal_mode = WAL');
      this.dbType = 'sqlite';
      this.dbLocation = dbPath;
      this.runSqliteMigrations();
      console.log(`✅ Database: SQLite (Persistent file: ./data/voicecart.db)`);
      this.isReady = true;
    } catch (err: any) {
      console.error('❌ Critical error initializing SQLite database:', err);
    }
  }

  private runSqliteMigrations() {
    if (!this.sqliteDb) return;

    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        mobile TEXT UNIQUE,
        password_hash TEXT,
        language TEXT DEFAULT 'en',
        avatar_url TEXT,
        preferences TEXT,
        email_verified INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        last_login_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        user_agent TEXT,
        ip_address TEXT,
        is_revoked INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        used_at TEXT
      );

      CREATE TABLE IF NOT EXISTS login_activity (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        timestamp TEXT DEFAULT (datetime('now')),
        ip TEXT,
        browser TEXT,
        device TEXT,
        location TEXT,
        is_current_device INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        payload TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        added_price REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        store TEXT NOT NULL,
        product_title TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS search_sessions (
        session_id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        raw_query TEXT NOT NULL,
        spec_json TEXT NOT NULL,
        results_json TEXT NOT NULL,
        recommendation_json TEXT,
        reply_text TEXT,
        spoken_text TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        identifier TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        magic_token_hash TEXT,
        verified_session TEXT,
        expires_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        ip_address TEXT
      );

      CREATE TABLE IF NOT EXISTS otp_request_logs (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        ip_address TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant TEXT,
        source_url TEXT NOT NULL,
        source_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        width INTEGER,
        height INTEGER,
        byte_size INTEGER NOT NULL,
        sha256 TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        data BLOB,
        status TEXT NOT NULL DEFAULT 'stored',
        created_at TEXT NOT NULL,
        UNIQUE(store, product_id, variant)
      );
      CREATE INDEX IF NOT EXISTS idx_images_sha256 ON images(sha256);
      CREATE INDEX IF NOT EXISTS idx_images_store_pid ON images(store, product_id);

      -- ==========================================
      -- CATALOG TABLES
      -- ==========================================
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        store TEXT NOT NULL,
        product_id TEXT NOT NULL,
        canonical_url TEXT,
        title TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        category TEXT NOT NULL,
        sub_category TEXT,
        price REAL NOT NULL,
        mrp REAL,
        discount_pct REAL,
        rating REAL,
        rating_count INTEGER DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        stock_status TEXT DEFAULT 'IN_STOCK',
        seller TEXT,
        delivery TEXT,
        deep_link TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        price_updated_at TEXT NOT NULL,
        source TEXT NOT NULL,
        match_group_id TEXT,
        raw_payload TEXT,
        UNIQUE(store, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_products_store_pid ON products(store, product_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
      CREATE INDEX IF NOT EXISTS idx_products_match_group ON products(match_group_id);
      CREATE INDEX IF NOT EXISTS idx_products_updated ON products(price_updated_at);

      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        url TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        sha256 TEXT,
        storage_path TEXT,
        order_index INTEGER DEFAULT 0,
        UNIQUE(store, product_id, url)
      );
      CREATE INDEX IF NOT EXISTS idx_product_images_pid ON product_images(store, product_id);

      CREATE TABLE IF NOT EXISTS product_specs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        group_name TEXT NOT NULL,
        spec_key TEXT NOT NULL,
        spec_value TEXT NOT NULL,
        UNIQUE(store, product_id, group_name, spec_key)
      );
      CREATE INDEX IF NOT EXISTS idx_product_specs_pid ON product_specs(store, product_id);
      CREATE INDEX IF NOT EXISTS idx_product_specs_lookup ON product_specs(spec_key, spec_value);

      CREATE TABLE IF NOT EXISTS product_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT,
        discount_amount REAL
      );
      CREATE INDEX IF NOT EXISTS idx_product_offers_pid ON product_offers(store, product_id);

      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        variant_text TEXT NOT NULL,
        variant_type TEXT,
        price REAL,
        mrp REAL,
        in_stock INTEGER DEFAULT 1,
        image_url TEXT,
        UNIQUE(store, product_id, variant_text)
      );
      CREATE INDEX IF NOT EXISTS idx_product_variants_pid ON product_variants(store, product_id);

      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL,
        store TEXT NOT NULL,
        price REAL NOT NULL,
        seen_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_price_history_pid ON price_history(store, product_id, seen_at);

      CREATE TABLE IF NOT EXISTS catalog_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_name TEXT NOT NULL,
        category TEXT,
        status TEXT NOT NULL,
        counts_json TEXT,
        errors_json TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);

    try { this.sqliteDb?.exec('ALTER TABLE otps ADD COLUMN magic_token_hash TEXT;'); } catch {}
    try { this.sqliteDb?.exec('ALTER TABLE otps ADD COLUMN verified_session TEXT;'); } catch {}
  }

  private async runPostgresMigrations() {
    if (!this.pgPool) return;

    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        email VARCHAR(255) UNIQUE,
        mobile VARCHAR(32) UNIQUE,
        password_hash TEXT,
        language VARCHAR(16) DEFAULT 'en',
        avatar_url TEXT,
        preferences JSONB,
        email_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address VARCHAR(64),
        is_revoked BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS password_resets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS login_activity (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip VARCHAR(64),
        browser VARCHAR(128),
        device VARCHAR(128),
        location VARCHAR(255),
        is_current_device BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        product_id VARCHAR(64) NOT NULL,
        store VARCHAR(32) NOT NULL,
        payload JSONB NOT NULL,
        quantity INT DEFAULT 1,
        added_price NUMERIC NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        product_title TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        status VARCHAR(32) NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id VARCHAR(64) PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        payload JSONB NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_payment_methods (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        payload JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS search_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        search_id VARCHAR(64) NOT NULL,
        raw_query TEXT NOT NULL,
        spec_json TEXT NOT NULL,
        results_json TEXT NOT NULL,
        recommendation_json TEXT,
        reply_text TEXT,
        spoken_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cache_entries (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otps (
        id VARCHAR(64) PRIMARY KEY,
        identifier VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(32) NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS otp_request_logs (
        id VARCHAR(64) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        ip_address VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- ==========================================
      -- CATALOG TABLES
      -- ==========================================
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(128) PRIMARY KEY,
        store VARCHAR(32) NOT NULL,
        product_id VARCHAR(128) NOT NULL,
        canonical_url TEXT,
        title TEXT NOT NULL,
        brand VARCHAR(128),
        model VARCHAR(128),
        category VARCHAR(64) NOT NULL,
        sub_category VARCHAR(64),
        price NUMERIC NOT NULL,
        mrp NUMERIC,
        discount_pct NUMERIC,
        rating NUMERIC,
        rating_count INT DEFAULT 0,
        review_count INT DEFAULT 0,
        stock_status VARCHAR(32) DEFAULT 'IN_STOCK',
        seller VARCHAR(128),
        delivery VARCHAR(128),
        deep_link TEXT,
        first_seen_at TIMESTAMP NOT NULL,
        last_seen_at TIMESTAMP NOT NULL,
        price_updated_at TIMESTAMP NOT NULL,
        source VARCHAR(32) NOT NULL,
        match_group_id VARCHAR(128),
        raw_payload JSONB,
        UNIQUE(store, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_pg_products_store_pid ON products(store, product_id);
      CREATE INDEX IF NOT EXISTS idx_pg_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_pg_products_sub_category ON products(sub_category);
      CREATE INDEX IF NOT EXISTS idx_pg_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_pg_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_pg_products_rating ON products(rating);
      CREATE INDEX IF NOT EXISTS idx_pg_products_match_group ON products(match_group_id);
      CREATE INDEX IF NOT EXISTS idx_pg_products_updated ON products(price_updated_at);

      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        width INT,
        height INT,
        sha256 VARCHAR(64),
        storage_path TEXT,
        order_index INT DEFAULT 0,
        UNIQUE(store, product_id, url)
      );
      CREATE INDEX IF NOT EXISTS idx_pg_product_images_pid ON product_images(store, product_id);

      CREATE TABLE IF NOT EXISTS product_specs (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        group_name VARCHAR(128) NOT NULL,
        spec_key VARCHAR(128) NOT NULL,
        spec_value TEXT NOT NULL,
        UNIQUE(store, product_id, group_name, spec_key)
      );
      CREATE INDEX IF NOT EXISTS idx_pg_product_specs_pid ON product_specs(store, product_id);
      CREATE INDEX IF NOT EXISTS idx_pg_product_specs_lookup ON product_specs(spec_key, spec_value);

      CREATE TABLE IF NOT EXISTS product_offers (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        code VARCHAR(64),
        discount_amount NUMERIC
      );
      CREATE INDEX IF NOT EXISTS idx_pg_product_offers_pid ON product_offers(store, product_id);

      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        variant_text TEXT NOT NULL,
        variant_type VARCHAR(64),
        price NUMERIC,
        mrp NUMERIC,
        in_stock BOOLEAN DEFAULT TRUE,
        image_url TEXT,
        UNIQUE(store, product_id, variant_text)
      );
      CREATE INDEX IF NOT EXISTS idx_pg_product_variants_pid ON product_variants(store, product_id);

      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(128) NOT NULL,
        store VARCHAR(32) NOT NULL,
        price NUMERIC NOT NULL,
        seen_at TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pg_price_history_pid ON price_history(store, product_id, seen_at);

      CREATE TABLE IF NOT EXISTS catalog_jobs (
        id SERIAL PRIMARY KEY,
        job_name VARCHAR(128) NOT NULL,
        category VARCHAR(64),
        status VARCHAR(32) NOT NULL,
        counts_json JSONB,
        errors_json JSONB,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP
      );
    `);
  }

  // ==========================================
  // USER OPERATIONS
  // ==========================================

  public async createUser(user: {
    id: string;
    name: string;
    email: string;
    mobile?: string | null;
    passwordHash?: string | null;
    language?: string;
    avatarUrl?: string | null;
    preferences?: Record<string, any>;
    emailVerified?: boolean;
  }): Promise<UserRecord> {
    const normalizedEmail = user.email ? user.email.trim().toLowerCase() : '';
    const normalizedMobile = user.mobile ? user.mobile.replace(/\D/g, '').slice(-10) : null;
    const now = new Date().toISOString();

    const record: UserRecord = {
      id: user.id,
      name: user.name.trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      passwordHash: user.passwordHash || null,
      language: user.language || 'en',
      avatarUrl: user.avatarUrl || null,
      preferences: user.preferences || {},
      emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
      createdAt: now,
      lastLoginAt: now
    };

    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO users (id, name, email, mobile, password_hash, language, avatar_url, preferences, email_verified, created_at, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.id,
          record.name,
          record.email || null,
          record.mobile || null,
          record.passwordHash,
          record.language,
          record.avatarUrl,
          JSON.stringify(record.preferences),
          record.emailVerified,
          record.createdAt,
          record.lastLoginAt
        ]
      );
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(`
        INSERT INTO users (id, name, email, mobile, password_hash, language, avatar_url, preferences, email_verified, created_at, last_login_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        record.id,
        record.name,
        record.email || null,
        record.mobile || null,
        record.passwordHash,
        record.language,
        record.avatarUrl,
        JSON.stringify(record.preferences),
        record.emailVerified ? 1 : 0,
        record.createdAt,
        record.lastLoginAt
      );
    }

    return record;
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();

    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [normalized]);
      if (res.rows.length === 0) return null;
      return this.mapUserRow(res.rows[0]);
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
      const row = stmt.get(normalized);
      if (!row) return null;
      return this.mapUserRow(row);
    }
    return null;
  }

  public async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    if (!mobile) return null;
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users WHERE mobile = $1 LIMIT 1', [cleanMobile]);
      if (res.rows.length === 0) return null;
      return this.mapUserRow(res.rows[0]);
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE mobile = ? LIMIT 1');
      const row = stmt.get(cleanMobile);
      if (!row) return null;
      return this.mapUserRow(row);
    }
    return null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    if (!id) return null;

    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length === 0) return null;
      return this.mapUserRow(res.rows[0]);
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
      const row = stmt.get(id);
      if (!row) return null;
      return this.mapUserRow(row);
    }
    return null;
  }

  public async updateUserLastLogin(id: string): Promise<void> {
    const now = new Date().toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE users SET last_login_at = $1 WHERE id = $2', [now, id]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, id);
    }
  }

  public async updateUserPassword(id: string, newPasswordHash: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, id]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, id);
    }
  }

  public async updateUser(id: string, updates: { name?: string; language?: string; avatarUrl?: string }): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (updates.name !== undefined) {
        setClauses.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.language !== undefined) {
        setClauses.push(`language = $${idx++}`);
        values.push(updates.language);
      }
      if (updates.avatarUrl !== undefined) {
        setClauses.push(`avatar_url = $${idx++}`);
        values.push(updates.avatarUrl);
      }
      if (setClauses.length > 0) {
        values.push(id);
        await this.pgPool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx}`, values);
      }
    } else if (this.sqliteDb) {
      const setClauses: string[] = [];
      const values: any[] = [];
      if (updates.name !== undefined) {
        setClauses.push('name = ?');
        values.push(updates.name);
      }
      if (updates.language !== undefined) {
        setClauses.push('language = ?');
        values.push(updates.language);
      }
      if (updates.avatarUrl !== undefined) {
        setClauses.push('avatar_url = ?');
        values.push(updates.avatarUrl);
      }
      if (setClauses.length > 0) {
        values.push(id);
        this.sqliteDb.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
      }
    }
  }

  public async countUsers(): Promise<number> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT COUNT(*) as count FROM users');
      return parseInt(res.rows[0]?.count || '0', 10);
    } else if (this.sqliteDb) {
      const row: any = this.sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get();
      return row?.count || 0;
    }
    return 0;
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.rows.map(r => this.mapUserRow(r));
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
      return rows.map(r => this.mapUserRow(r));
    }
    return [];
  }

  private mapUserRow(row: any): UserRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      passwordHash: row.password_hash,
      language: row.language || 'en',
      avatarUrl: row.avatar_url,
      preferences: typeof row.preferences === 'string' ? JSON.parse(row.preferences || '{}') : (row.preferences || {}),
      emailVerified: Boolean(row.email_verified),
      createdAt: typeof row.created_at === 'object' && row.created_at ? row.created_at.toISOString() : String(row.created_at || ''),
      lastLoginAt: typeof row.last_login_at === 'object' && row.last_login_at ? row.last_login_at.toISOString() : String(row.last_login_at || '')
    };
  }

  // ==========================================
  // REFRESH TOKENS & SESSIONS
  // ==========================================

  public async saveRefreshToken(token: RefreshTokenRecord): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, user_agent, ip_address, is_revoked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [token.id, token.userId, token.tokenHash, token.expiresAt, token.createdAt, token.userAgent || null, token.ipAddress || null, token.isRevoked]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, user_agent, ip_address, is_revoked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(token.id, token.userId, token.tokenHash, token.expiresAt, token.createdAt, token.userAgent || null, token.ipAddress || null, token.isRevoked ? 1 : 0);
    }
  }

  public async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1', [tokenHash]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        tokenHash: r.token_hash,
        expiresAt: typeof r.expires_at === 'object' ? r.expires_at.toISOString() : String(r.expires_at),
        createdAt: typeof r.created_at === 'object' ? r.created_at.toISOString() : String(r.created_at),
        userAgent: r.user_agent,
        ipAddress: r.ip_address,
        isRevoked: Boolean(r.is_revoked)
      };
    } else if (this.sqliteDb) {
      const r: any = this.sqliteDb.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1').get(tokenHash);
      if (!r) return null;
      return {
        id: r.id,
        userId: r.user_id,
        tokenHash: r.token_hash,
        expiresAt: String(r.expires_at),
        createdAt: String(r.created_at),
        userAgent: r.user_agent,
        ipAddress: r.ip_address,
        isRevoked: Boolean(r.is_revoked)
      };
    }
    return null;
  }

  public async revokeRefreshToken(tokenHash: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [tokenHash]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?').run(tokenHash);
    }
  }

  public async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [userId]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?').run(userId);
    }
  }

  // ==========================================
  // PASSWORD RESETS
  // ==========================================

  public async createPasswordReset(reset: PasswordResetRecord): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [reset.id, reset.userId, reset.tokenHash, reset.expiresAt, reset.createdAt]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(reset.id, reset.userId, reset.tokenHash, reset.expiresAt, reset.createdAt);
    }
  }

  public async findPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM password_resets WHERE token_hash = $1 AND used_at IS NULL LIMIT 1', [tokenHash]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        tokenHash: r.token_hash,
        expiresAt: typeof r.expires_at === 'object' ? r.expires_at.toISOString() : String(r.expires_at),
        createdAt: typeof r.created_at === 'object' ? r.created_at.toISOString() : String(r.created_at),
        usedAt: r.used_at ? (typeof r.used_at === 'object' ? r.used_at.toISOString() : String(r.used_at)) : null
      };
    } else if (this.sqliteDb) {
      const r: any = this.sqliteDb.prepare('SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL LIMIT 1').get(tokenHash);
      if (!r) return null;
      return {
        id: r.id,
        userId: r.user_id,
        tokenHash: r.token_hash,
        expiresAt: String(r.expires_at),
        createdAt: String(r.created_at),
        usedAt: r.used_at ? String(r.used_at) : null
      };
    }
    return null;
  }

  public async markPasswordResetUsed(tokenHash: string): Promise<void> {
    const now = new Date().toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE password_resets SET used_at = $1 WHERE token_hash = $2', [now, tokenHash]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(now, tokenHash);
    }
  }

  // ==========================================
  // LOGIN ACTIVITY
  // ==========================================

  public async recordLoginActivity(activity: LoginActivity): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO login_activity (id, user_id, timestamp, ip, browser, device, location, is_current_device)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [activity.id, activity.userId, activity.timestamp, activity.ip, activity.browser, activity.device, activity.location, activity.isCurrentDevice]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO login_activity (id, user_id, timestamp, ip, browser, device, location, is_current_device)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(activity.id, activity.userId, activity.timestamp, activity.ip, activity.browser, activity.device, activity.location, activity.isCurrentDevice ? 1 : 0);
    }
  }

  public async getLoginActivity(userId: string): Promise<LoginActivity[]> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query(
        'SELECT * FROM login_activity WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20',
        [userId]
      );
      return res.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        timestamp: typeof r.timestamp === 'object' ? r.timestamp.toISOString() : String(r.timestamp),
        ip: r.ip || '127.0.0.1 (Localhost)',
        browser: r.browser || 'Chrome 128 / Edge',
        device: r.device || 'Desktop PC',
        location: r.location || 'Bengaluru, Karnataka, India',
        isCurrentDevice: Boolean(r.is_current_device)
      }));
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT * FROM login_activity WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20').all(userId);
      return rows.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        timestamp: String(r.timestamp),
        ip: r.ip || '127.0.0.1 (Localhost)',
        browser: r.browser || 'Chrome 128 / Edge',
        device: r.device || 'Desktop PC',
        location: r.location || 'Bengaluru, Karnataka, India',
        isCurrentDevice: Boolean(r.is_current_device)
      }));
    }
    return [];
  }

  // ==========================================
  // CART OPERATIONS
  // ==========================================

  public async getCart(userId: string = 'guest_default_session'): Promise<CartItem[]> {
    const uid = userId || 'guest_default_session';
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query(
        'SELECT * FROM cart_items WHERE user_id = $1 ORDER BY updated_at DESC',
        [uid]
      );
      return res.rows.map((r: any) => ({
        id: r.id,
        product: typeof r.payload === 'string' ? JSON.parse(r.payload).product : r.payload.product,
        quantity: r.quantity,
        addedPrice: parseFloat(r.added_price),
        currentPrice: typeof r.payload === 'string' ? JSON.parse(r.payload).currentPrice || parseFloat(r.added_price) : r.payload.currentPrice || parseFloat(r.added_price),
        priceChanged: Boolean(typeof r.payload === 'string' ? JSON.parse(r.payload).priceChanged : r.payload.priceChanged),
        priceDelta: (typeof r.payload === 'string' ? JSON.parse(r.payload).priceDelta : r.payload.priceDelta) || 0,
        addedAt: typeof r.updated_at === 'object' ? r.updated_at.toISOString() : String(r.updated_at)
      }));
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY updated_at DESC').all(uid);
      return rows.map((r: any) => {
        const payload = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
        return {
          id: r.id,
          product: payload.product,
          quantity: r.quantity,
          addedPrice: Number(r.added_price),
          currentPrice: payload.currentPrice || Number(r.added_price),
          priceChanged: Boolean(payload.priceChanged),
          priceDelta: payload.priceDelta || 0,
          addedAt: String(r.updated_at)
        };
      });
    }
    return [];
  }

  public async saveCartItem(item: CartItem, userId: string = 'guest_default_session'): Promise<CartItem> {
    const uid = userId || 'guest_default_session';
    const now = new Date().toISOString();

    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO cart_items (id, user_id, product_id, store, payload, quantity, added_price, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO UPDATE SET
         user_id = $2, payload = $5, quantity = $6, updated_at = NOW()`,
        [item.id, uid, item.product.productId, item.product.store, JSON.stringify(item), item.quantity, item.addedPrice]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO cart_items (id, user_id, product_id, store, payload, quantity, added_price, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        payload = excluded.payload,
        quantity = excluded.quantity,
        updated_at = excluded.updated_at
      `).run(item.id, uid, item.product.productId, item.product.store, JSON.stringify(item), item.quantity, item.addedPrice, now);
    }
    return item;
  }

  public async removeCartItem(id: string, userId: string = 'guest_default_session'): Promise<boolean> {
    const uid = userId || 'guest_default_session';
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, uid]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(id, uid);
    }
    return true;
  }

  public async clearCart(userId: string = 'guest_default_session'): Promise<void> {
    const uid = userId || 'guest_default_session';
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM cart_items WHERE user_id = $1', [uid]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM cart_items WHERE user_id = ?').run(uid);
    }
  }

  public async mergeCart(guestUserId: string, targetUserId: string): Promise<CartItem[]> {
    if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
      return this.getCart(targetUserId);
    }

    const guestItems = await this.getCart(guestUserId);
    for (const item of guestItems) {
      await this.saveCartItem(item, targetUserId);
    }
    await this.clearCart(guestUserId);
    return this.getCart(targetUserId);
  }

  // ==========================================
  // ORDER OPERATIONS
  // ==========================================

  public async getOrders(userId: string = 'guest_default_session'): Promise<OrderRecord[]> {
    const uid = userId || 'guest_default_session';
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query(
        'SELECT payload FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [uid]
      );
      return res.rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT payload FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(uid);
      return rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    }
    return [];
  }

  public async saveOrder(order: OrderRecord, userId: string = 'guest_default_session'): Promise<OrderRecord> {
    const uid = userId || 'guest_default_session';
    const now = new Date().toISOString();

    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO orders (id, user_id, order_id, store, product_title, total_amount, status, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET user_id = $2, status = $7, payload = $8`,
        [order.id, uid, order.orderId, order.store, order.productTitle, order.totalAmount, order.status, JSON.stringify(order)]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO orders (id, user_id, order_id, store, product_title, total_amount, status, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        status = excluded.status,
        payload = excluded.payload
      `).run(order.id, uid, order.orderId, order.store, order.productTitle, order.totalAmount, order.status, JSON.stringify(order), now);
    }
    return order;
  }

  public async getOrderById(orderIdOrId: string, userId?: string): Promise<OrderRecord | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const query = userId
        ? 'SELECT payload FROM orders WHERE (id = $1 OR order_id = $1) AND user_id = $2 LIMIT 1'
        : 'SELECT payload FROM orders WHERE id = $1 OR order_id = $1 LIMIT 1';
      const params = userId ? [orderIdOrId, userId] : [orderIdOrId];
      const res = await this.pgPool.query(query, params);
      if (res.rows.length > 0) {
        return typeof res.rows[0].payload === 'string' ? JSON.parse(res.rows[0].payload) : res.rows[0].payload;
      }
    } else if (this.sqliteDb) {
      const query = userId
        ? 'SELECT payload FROM orders WHERE (id = ? OR order_id = ?) AND user_id = ? LIMIT 1'
        : 'SELECT payload FROM orders WHERE id = ? OR order_id = ? LIMIT 1';
      const params = userId ? [orderIdOrId, orderIdOrId, userId] : [orderIdOrId, orderIdOrId];
      const row: any = this.sqliteDb.prepare(query).get(...params);
      if (row) {
        return typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      }
    }
    return null;
  }

  // ==========================================
  // PROFILE OPERATIONS
  // ==========================================

  public async getProfile(userId: string): Promise<UserAccountProfile | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT payload FROM user_profiles WHERE user_id = $1 LIMIT 1', [userId]);
      if (res.rows.length > 0) {
        return typeof res.rows[0].payload === 'string' ? JSON.parse(res.rows[0].payload) : res.rows[0].payload;
      }
    } else if (this.sqliteDb) {
      const row: any = this.sqliteDb.prepare('SELECT payload FROM user_profiles WHERE user_id = ? LIMIT 1').get(userId);
      if (row) {
        return typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      }
    }
    return null;
  }

  public async saveProfile(profile: UserAccountProfile): Promise<UserAccountProfile> {
    const now = new Date().toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO user_profiles (user_id, payload, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET payload = $2, updated_at = NOW()`,
        [profile.id, JSON.stringify(profile)]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO user_profiles (user_id, payload, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
      `).run(profile.id, JSON.stringify(profile), now);
    }
    return profile;
  }

  // ==========================================
  // ADDRESS OPERATIONS
  // ==========================================

  public async getAddresses(userId: string): Promise<UserAddress[]> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query(
        'SELECT payload FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, updated_at DESC',
        [userId]
      );
      return res.rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT payload FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC').all(userId);
      return rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    }
    return [];
  }

  public async saveAddress(address: UserAddress, userId: string): Promise<UserAddress> {
    const now = new Date().toISOString();
    const existing = await this.getAddresses(userId);

    if (address.isDefault) {
      if (this.dbType === 'postgresql' && this.pgPool) {
        await this.pgPool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
      } else if (this.sqliteDb) {
        this.sqliteDb.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(userId);
      }
    } else if (existing.length === 0) {
      address.isDefault = true;
    }

    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO user_addresses (id, user_id, payload, is_default, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = $3, is_default = $4, updated_at = NOW()`,
        [address.id, userId, JSON.stringify(address), address.isDefault]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO user_addresses (id, user_id, payload, is_default, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        is_default = excluded.is_default,
        updated_at = excluded.updated_at
      `).run(address.id, userId, JSON.stringify(address), address.isDefault ? 1 : 0, now);
    }
    return address;
  }

  public async removeAddress(addressId: string, userId: string): Promise<boolean> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM user_addresses WHERE id = ? AND user_id = ?').run(addressId, userId);
    }
    return true;
  }

  public async setDefaultAddress(addressId: string, userId: string): Promise<UserAddress | null> {
    const addresses = await this.getAddresses(userId);
    const target = addresses.find(a => a.id === addressId);
    if (target) {
      target.isDefault = true;
      await this.saveAddress(target, userId);
      return target;
    }
    return null;
  }

  // ==========================================
  // PAYMENT METHOD OPERATIONS
  // ==========================================

  public async getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT payload FROM user_payment_methods WHERE user_id = $1', [userId]);
      return res.rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    } else if (this.sqliteDb) {
      const rows = this.sqliteDb.prepare('SELECT payload FROM user_payment_methods WHERE user_id = ?').all(userId);
      return rows.map((r: any) => typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload);
    }
    return [];
  }

  public async savePaymentMethod(method: SavedPaymentMethod, userId: string): Promise<SavedPaymentMethod> {
    const now = new Date().toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO user_payment_methods (id, user_id, payload, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = $3, updated_at = NOW()`,
        [method.id, userId, JSON.stringify(method)]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(`
        INSERT INTO user_payment_methods (id, user_id, payload, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
      `).run(method.id, userId, JSON.stringify(method), now);
    }
    return method;
  }

  public async removePaymentMethod(methodId: string, userId: string): Promise<boolean> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM user_payment_methods WHERE id = $1 AND user_id = $2', [methodId, userId]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?').run(methodId, userId);
    }
    return true;
  }

  // ==========================================
  // ACCOUNT DELETION
  // ==========================================

  public async deleteUserAccount(userId: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM user_profiles WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM user_addresses WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM user_payment_methods WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM login_activity WHERE user_id = $1', [userId]);
      await this.pgPool.query('DELETE FROM users WHERE id = $1', [userId]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM user_profiles WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM user_addresses WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM user_payment_methods WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM password_resets WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM login_activity WHERE user_id = ?').run(userId);
      this.sqliteDb.prepare('DELETE FROM users WHERE id = ?').run(userId);
    }
  }

  // ==========================================
  // OTP OPERATIONS (Zero raw OTP storage)
  // ==========================================

  public async saveOtp(record: OtpRecord): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO otps (id, identifier, type, otp_hash, magic_token_hash, verified_session, expires_at, attempts, created_at, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9)
         ON CONFLICT (identifier) DO UPDATE SET
           id = EXCLUDED.id,
           type = EXCLUDED.type,
           otp_hash = EXCLUDED.otp_hash,
           magic_token_hash = EXCLUDED.magic_token_hash,
           verified_session = EXCLUDED.verified_session,
           expires_at = EXCLUDED.expires_at,
           attempts = EXCLUDED.attempts,
           created_at = CURRENT_TIMESTAMP,
           ip_address = EXCLUDED.ip_address`,
        [record.id, record.identifier, record.type, record.otpHash, record.magicTokenHash || null, record.verifiedSession || null, record.expiresAt, record.attempts, record.ipAddress || null]
      );
    } else if (this.sqliteDb) {
      const nowIso = record.createdAt || new Date().toISOString();
      this.sqliteDb.prepare(
        `INSERT INTO otps (id, identifier, type, otp_hash, magic_token_hash, verified_session, expires_at, attempts, created_at, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(identifier) DO UPDATE SET
           id = excluded.id,
           type = excluded.type,
           otp_hash = excluded.otp_hash,
           magic_token_hash = excluded.magic_token_hash,
           verified_session = excluded.verified_session,
           expires_at = excluded.expires_at,
           attempts = excluded.attempts,
           created_at = excluded.created_at,
           ip_address = excluded.ip_address`
      ).run(record.id, record.identifier, record.type, record.otpHash, record.magicTokenHash || null, record.verifiedSession || null, record.expiresAt, record.attempts, nowIso, record.ipAddress || null);
    }
  }

  public async getOtpByIdentifier(identifier: string): Promise<OtpRecord | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM otps WHERE identifier = $1', [identifier]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        identifier: r.identifier,
        type: r.type,
        otpHash: r.otp_hash,
        magicTokenHash: r.magic_token_hash || null,
        verifiedSession: r.verified_session || null,
        expiresAt: new Date(r.expires_at).toISOString(),
        attempts: r.attempts || 0,
        createdAt: new Date(r.created_at).toISOString(),
        ipAddress: r.ip_address
      };
    } else if (this.sqliteDb) {
      const row = this.sqliteDb.prepare('SELECT * FROM otps WHERE identifier = ?').get(identifier) as any;
      if (!row) return null;
      return {
        id: row.id,
        identifier: row.identifier,
        type: row.type,
        otpHash: row.otp_hash,
        magicTokenHash: row.magic_token_hash || null,
        verifiedSession: row.verified_session || null,
        expiresAt: row.expires_at,
        attempts: row.attempts || 0,
        createdAt: row.created_at,
        ipAddress: row.ip_address
      };
    }
    return null;
  }

  public async findOtpByMagicTokenHash(tokenHash: string): Promise<OtpRecord | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query('SELECT * FROM otps WHERE magic_token_hash = $1', [tokenHash]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        identifier: r.identifier,
        type: r.type,
        otpHash: r.otp_hash,
        magicTokenHash: r.magic_token_hash || null,
        verifiedSession: r.verified_session || null,
        expiresAt: new Date(r.expires_at).toISOString(),
        attempts: r.attempts || 0,
        createdAt: new Date(r.created_at).toISOString(),
        ipAddress: r.ip_address
      };
    } else if (this.sqliteDb) {
      const row = this.sqliteDb.prepare('SELECT * FROM otps WHERE magic_token_hash = ?').get(tokenHash) as any;
      if (!row) return null;
      return {
        id: row.id,
        identifier: row.identifier,
        type: row.type,
        otpHash: row.otp_hash,
        magicTokenHash: row.magic_token_hash || null,
        verifiedSession: row.verified_session || null,
        expiresAt: row.expires_at,
        attempts: row.attempts || 0,
        createdAt: row.created_at,
        ipAddress: row.ip_address
      };
    }
    return null;
  }

  public async setOtpVerifiedSession(identifier: string, sessionJson: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('UPDATE otps SET verified_session = $1 WHERE identifier = $2', [sessionJson, identifier]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE otps SET verified_session = ? WHERE identifier = ?').run(sessionJson, identifier);
    }
  }

  public async incrementOtpAttempts(identifier: string): Promise<number> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      const res = await this.pgPool.query(
        'UPDATE otps SET attempts = attempts + 1 WHERE identifier = $1 RETURNING attempts',
        [identifier]
      );
      return res.rows[0]?.attempts || 1;
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('UPDATE otps SET attempts = attempts + 1 WHERE identifier = ?').run(identifier);
      const row = this.sqliteDb.prepare('SELECT attempts FROM otps WHERE identifier = ?').get(identifier) as any;
      return row?.attempts || 1;
    }
    return 1;
  }

  public async deleteOtp(identifier: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query('DELETE FROM otps WHERE identifier = $1', [identifier]);
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare('DELETE FROM otps WHERE identifier = ?').run(identifier);
    }
  }

  public async logOtpRequest(identifier: string, ipAddress?: string): Promise<void> {
    const logId = 'log_' + Math.random().toString(36).substring(2, 12);
    if (this.dbType === 'postgresql' && this.pgPool) {
      await this.pgPool.query(
        'INSERT INTO otp_request_logs (id, identifier, ip_address, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
        [logId, identifier, ipAddress || null]
      );
    } else if (this.sqliteDb) {
      this.sqliteDb.prepare(
        "INSERT INTO otp_request_logs (id, identifier, ip_address, created_at) VALUES (?, ?, ?, datetime('now'))"
      ).run(logId, identifier, ipAddress || null);
    }
  }

  public async getRecentOtpRequestCount(identifier: string, ipAddress?: string, windowMinutes = 60): Promise<{ identifierCount: number; ipCount: number }> {
    let identifierCount = 0;
    let ipCount = 0;

    if (this.dbType === 'postgresql' && this.pgPool) {
      const idRes = await this.pgPool.query(
        "SELECT COUNT(*) as cnt FROM otp_request_logs WHERE identifier = $1 AND created_at > NOW() - ($2 || ' minutes')::INTERVAL",
        [identifier, windowMinutes]
      );
      identifierCount = parseInt(idRes.rows[0]?.cnt || '0', 10);

      if (ipAddress) {
        const ipRes = await this.pgPool.query(
          "SELECT COUNT(*) as cnt FROM otp_request_logs WHERE ip_address = $1 AND created_at > NOW() - ($2 || ' minutes')::INTERVAL",
          [ipAddress, windowMinutes]
        );
        ipCount = parseInt(ipRes.rows[0]?.cnt || '0', 10);
      }
    } else if (this.sqliteDb) {
      const idRow = this.sqliteDb.prepare(
        `SELECT COUNT(*) as cnt FROM otp_request_logs WHERE identifier = ? AND datetime(created_at) > datetime('now', '-${windowMinutes} minutes')`
      ).get(identifier) as any;
      identifierCount = idRow?.cnt || 0;

      if (ipAddress) {
        const ipRow = this.sqliteDb.prepare(
          `SELECT COUNT(*) as cnt FROM otp_request_logs WHERE ip_address = ? AND datetime(created_at) > datetime('now', '-${windowMinutes} minutes')`
        ).get(ipAddress) as any;
        ipCount = ipRow?.cnt || 0;
      }
    }

    return { identifierCount, ipCount };
  }

  // ==========================================
  // CACHE & SESSION OPERATIONS
  // ==========================================

  public async getCacheEntry<T>(key: string): Promise<T | null> {
    const now = new Date().toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        const res = await this.pgPool.query('SELECT value FROM cache_entries WHERE key = $1 AND expires_at > NOW() LIMIT 1', [key]);
        if (res.rows.length > 0) {
          return JSON.parse(res.rows[0].value) as T;
        }
      } catch {}
    } else if (this.sqliteDb) {
      try {
        const row: any = this.sqliteDb.prepare('SELECT value FROM cache_entries WHERE key = ? AND datetime(expires_at) > datetime(?) LIMIT 1').get(key, now);
        if (row) {
          return JSON.parse(row.value) as T;
        }
      } catch {}
    }
    return null;
  }

  public async setCacheEntry(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const stringified = JSON.stringify(value);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO cache_entries (key, value, expires_at, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, expires_at = $3, created_at = NOW()`,
          [key, stringified, expiresAt]
        );
      } catch (err: any) {
        console.warn('DB setCacheEntry error:', err.message);
      }
    } else if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare(
          `INSERT INTO cache_entries (key, value, expires_at, created_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at, created_at = excluded.created_at`
        ).run(key, stringified, expiresAt);
      } catch {}
    }
  }

  public async deleteCacheEntry(key: string): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        await this.pgPool.query('DELETE FROM cache_entries WHERE key = $1', [key]);
      } catch {}
    } else if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare('DELETE FROM cache_entries WHERE key = ?').run(key);
      } catch {}
    }
  }

  public async saveSearchSession(session: any): Promise<void> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO search_sessions (session_id, search_id, raw_query, spec_json, results_json, recommendation_json, reply_text, spoken_text, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (session_id) DO UPDATE SET
             search_id = $2, raw_query = $3, spec_json = $4, results_json = $5,
             recommendation_json = $6, reply_text = $7, spoken_text = $8`,
          [
            session.sessionId,
            session.searchId,
            session.rawQuery,
            JSON.stringify(session.spec || {}),
            JSON.stringify(session.results || []),
            JSON.stringify(session.recommendation || null),
            session.replyText || '',
            session.spokenText || ''
          ]
        );
      } catch (err: any) {
        console.warn('Postgres saveSearchSession error:', err.message);
      }
    } else if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare(
          `INSERT INTO search_sessions (session_id, search_id, raw_query, spec_json, results_json, recommendation_json, reply_text, spoken_text, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(session_id) DO UPDATE SET
             search_id = excluded.search_id, raw_query = excluded.raw_query, spec_json = excluded.spec_json,
             results_json = excluded.results_json, recommendation_json = excluded.recommendation_json,
             reply_text = excluded.reply_text, spoken_text = excluded.spoken_text`
        ).run(
          session.sessionId,
          session.searchId,
          session.rawQuery,
          JSON.stringify(session.spec || {}),
          JSON.stringify(session.results || []),
          JSON.stringify(session.recommendation || null),
          session.replyText || '',
          session.spokenText || ''
        );
      } catch (err: any) {
        console.warn('SQLite saveSearchSession error:', err.message);
      }
    }
  }

  public async getSearchSession(id: string): Promise<any | null> {
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        const res = await this.pgPool.query(
          'SELECT * FROM search_sessions WHERE session_id = $1 OR search_id = $1 LIMIT 1',
          [id]
        );
        if (res.rows.length > 0) {
          const r = res.rows[0];
          return {
            searchId: r.search_id,
            sessionId: r.session_id,
            rawQuery: r.raw_query,
            normalizedQuery: r.raw_query,
            language: 'en',
            spec: typeof r.spec_json === 'string' ? JSON.parse(r.spec_json) : r.spec_json,
            results: typeof r.results_json === 'string' ? JSON.parse(r.results_json) : r.results_json,
            recommendation: typeof r.recommendation_json === 'string' ? JSON.parse(r.recommendation_json) : r.recommendation_json,
            replyText: r.reply_text || '',
            spokenText: r.spoken_text || '',
            createdAt: typeof r.created_at === 'object' ? r.created_at.toISOString() : String(r.created_at)
          };
        }
      } catch {}
    } else if (this.sqliteDb) {
      try {
        const r: any = this.sqliteDb.prepare(
          'SELECT * FROM search_sessions WHERE session_id = ? OR search_id = ? LIMIT 1'
        ).get(id, id);
        if (r) {
          return {
            searchId: r.search_id,
            sessionId: r.session_id,
            rawQuery: r.raw_query,
            normalizedQuery: r.raw_query,
            language: 'en',
            spec: JSON.parse(r.spec_json || '{}'),
            results: JSON.parse(r.results_json || '[]'),
            recommendation: JSON.parse(r.recommendation_json || 'null'),
            replyText: r.reply_text || '',
            spokenText: r.spoken_text || '',
            createdAt: String(r.created_at)
          };
        }
      } catch {}
    }
    return null;
  }

  public async ping(): Promise<{ ok: boolean; type: string; latencyMs: number }> {
    const start = Date.now();
    if (this.dbType === 'postgresql' && this.pgPool) {
      try {
        await this.pgPool.query('SELECT 1');
        return { ok: true, type: 'postgresql', latencyMs: Date.now() - start };
      } catch {
        return { ok: false, type: 'postgresql', latencyMs: Date.now() - start };
      }
    } else if (this.sqliteDb) {
      try {
        this.sqliteDb.prepare('SELECT 1').get();
        return { ok: true, type: 'sqlite', latencyMs: Date.now() - start };
      } catch {
        return { ok: false, type: 'sqlite', latencyMs: Date.now() - start };
      }
    }
    return { ok: false, type: 'none', latencyMs: 0 };
  }

  public run(sql: string, params: any[] = []): void {
    if (this.sqliteDb) {
      this.sqliteDb.prepare(sql).run(...params);
    }
  }

  public get(sql: string, params: any[] = []): any {
    if (this.sqliteDb) {
      return this.sqliteDb.prepare(sql).get(...params);
    }
    return null;
  }

  public all(sql: string, params: any[] = []): any[] {
    if (this.sqliteDb) {
      return this.sqliteDb.prepare(sql).all(...params);
    }
    return [];
  }
}

export const dbClient = new DatabaseClient();
