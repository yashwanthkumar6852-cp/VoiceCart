import Redis from 'ioredis';
import { config } from '../config';
import { dbClient } from '../db/dbClient';

class CacheService {
  private redis: Redis | null = null;
  private memoryStore: Map<string, { data: string; expiry: number }> = new Map();
  private isRedisConnected = false;

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    if (!config.redisUrl || config.redisUrl.trim() === '' || config.redisUrl.includes('127.0.0.1')) {
      // If no explicit production redis URL, fall back gracefully to DB persistent cache
      if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️ REDIS_URL not configured. Using persistent PostgreSQL database cache.');
        return;
      }
    }

    try {
      this.redis = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 3) return null; // stop reconnecting if no redis instance
          return Math.min(times * 200, 1000);
        }
      });

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        console.log('✅ Connected to Redis cache service.');
      });

      this.redis.on('error', (err) => {
        if (this.isRedisConnected) {
          console.warn('⚠️ Redis error, falling back to database caching:', err.message);
        }
        this.isRedisConnected = false;
      });
    } catch {
      console.warn('⚠️ Redis unavailable. Using database/memory cache.');
      this.isRedisConnected = false;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redis) {
        const val = await this.redis.get(key);
        if (val) return JSON.parse(val) as T;
      }
    } catch {}

    // Check database persistent cache
    try {
      const dbVal = await dbClient.getCacheEntry<T>(key);
      if (dbVal !== null) return dbVal;
    } catch {}

    // Check memory store
    const item = this.memoryStore.get(key);
    if (item) {
      if (Date.now() > item.expiry) {
        this.memoryStore.delete(key);
        return null;
      }
      return JSON.parse(item.data) as T;
    }

    return null;
  }

  public async set(key: string, value: any, ttlSeconds = config.redisTtlSeconds): Promise<void> {
    const stringified = JSON.stringify(value);
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.set(key, stringified, 'EX', ttlSeconds);
      }
    } catch {}

    // Save to database persistent cache
    try {
      await dbClient.setCacheEntry(key, value, ttlSeconds);
    } catch {}

    // Save in memory store
    this.memoryStore.set(key, {
      data: stringified,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  public async delete(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }
    } catch {}

    try {
      await dbClient.deleteCacheEntry(key);
    } catch {}

    this.memoryStore.delete(key);
  }

  public async ping(): Promise<{ ok: boolean; type: 'redis' | 'database_cache' | 'memory' }> {
    if (this.isRedisConnected && this.redis) {
      try {
        const res = await this.redis.ping();
        if (res === 'PONG') return { ok: true, type: 'redis' };
      } catch {}
    }
    const dbPing = await dbClient.ping();
    if (dbPing.ok) {
      return { ok: true, type: 'database_cache' };
    }
    return { ok: true, type: 'memory' };
  }

  public getStatus() {
    return {
      connectedToRedis: this.isRedisConnected,
      backend: this.isRedisConnected ? 'Redis' : 'PostgreSQL Database Cache',
      memoryEntriesCount: this.memoryStore.size
    };
  }
}

export const cacheService = new CacheService();
