// src/lib/cache/index.ts

import type { MonitoringSystem } from '../monitoring';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Tags for cache invalidation */
  tags?: string[];
  /** Whether to compress the cached data */
  compress?: boolean;
  /** Maximum size in bytes (optional) */
  maxSize?: number;
  /** Cache priority (optional) */
  priority?: 'low' | 'normal' | 'high';
  /** Whether to ignore errors when fetching/setting cache */
  ignoreErrors?: boolean;
}

// Custom error class for cache operations
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly metadata: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>();
  private readonly defaultTtl: number = 60000; // 1 minute

  constructor(
    private readonly options: {
      defaultTtl?: number;
      maxEntries?: number;
      maxSize?: number;
    } = {}
  ) {
    this.defaultTtl = options.defaultTtl ?? 60000;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return null;
  
      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      return entry.value as T;
    } catch (error) {
      throw new CacheError('Failed to get value from cache', { key, error });
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + (options.ttl ?? this.defaultTtl),
        tags: options.tags ?? []
      };

      if (options.maxSize && this.getSize(value) > options.maxSize) {
        throw new CacheError('Value exceeds maximum size limit', { 
          key, 
          size: this.getSize(value), 
          maxSize: options.maxSize 
        });
      }

      this.cache.set(key, entry);
      this.updateTagIndex(key, entry.tags);
    } catch (error) {
      throw new CacheError('Failed to set value in cache', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const entry = this.cache.get(key);
      if (entry) {
        // Remove from tag index
        entry.tags.forEach(tag => {
          const tagSet = this.tagIndex.get(tag);
          if (tagSet) {
            tagSet.delete(key);
            // Clean up empty tag sets
            if (tagSet.size === 0) {
              this.tagIndex.delete(tag);
            }
          }
        });
        this.cache.delete(key);
      }
    } catch (error) {
      throw new CacheError('Failed to delete from cache', { key, error });
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        await Promise.all([...keys].map(key => this.delete(key)));
        this.tagIndex.delete(tag);
      }
    } catch (error) {
      throw new CacheError('Failed to invalidate by tag', { tag, error });
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.tagIndex.clear();
    } catch (error) {
      throw new CacheError('Failed to clear cache', { error });
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.expiresAt < Date.now();
  }

  private getSize(value: any): number {
    try {
      return new TextEncoder().encode(JSON.stringify(value)).length;
    } catch {
      return 0;
    }
  }

  private updateTagIndex(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }
}

export class CacheManager {
  constructor(
    private readonly cache: Cache,
    private readonly monitoring: MonitoringSystem
  ) {}

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const spanId = this.monitoring.tracer.startSpan('cache.getOrSet', { 
      key,
      options 
    });

    try {
      // Try to get from cache
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        this.recordCacheHit(key, spanId);
        return cached;
      }

      // Cache miss, execute factory
      this.recordCacheMiss(key, spanId);
      
      const startTime = performance.now();
      const value = await factory();
      const duration = performance.now() - startTime;

      this.monitoring.metrics.record('cache.factory.duration', duration);

      await this.cache.set(key, value, options);
      
      return value;
    } catch (error) {
      this.handleError(error, key, spanId);
      throw error;
    } finally {
      this.monitoring.tracer.endSpan(spanId);
    }
  }

  private recordCacheHit(key: string, spanId: string): void {
    this.monitoring.metrics.record('cache.hit', 1);
    this.monitoring.tracer.addEvent(spanId, 'cache.hit', { key });
    this.monitoring.logger.log('debug', 'Cache hit', { key });
  }

  private recordCacheMiss(key: string, spanId: string): void {
    this.monitoring.metrics.record('cache.miss', 1);
    this.monitoring.tracer.addEvent(spanId, 'cache.miss', { key });
    this.monitoring.logger.log('debug', 'Cache miss', { key });
  }

  private handleError(error: unknown, key: string, spanId: string): void {
    this.monitoring.metrics.record('cache.error', 1);
    this.monitoring.tracer.addEvent(spanId, 'cache.error', { 
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    this.monitoring.logger.log('error', 'Cache operation failed', {
      key,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error'
    });
  }
}
