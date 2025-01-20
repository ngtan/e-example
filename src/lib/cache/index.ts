// src/lib/cache/index.ts

import type { MonitoringSystem } from '../monitoring';

export interface CacheConfig {
  storage: Storage | null;
  prefix: string;
  defaultTtl?: number;
  maxEntries?: number;
  maxSize?: number;
  monitoring: MonitoringSystem;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  size: number;
  lastAccessed: number;
  hits: number;
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

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entryCount: number;
  oldestEntry: number;
  newestEntry: number;
}

// Custom error class for cache operations
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>();
  private readonly config: Required<CacheConfig>;
  private totalSize = 0;

  constructor(config: CacheConfig) {
    this.config = {
      storage: config.storage,
      prefix: config.prefix,
      defaultTtl: config.defaultTtl ?? 60000,
      maxEntries: config.maxEntries ?? 1000,
      maxSize: config.maxSize ?? 5 * 1024 * 1024, // 5MB default
      monitoring: config.monitoring
    };

    this.startMaintenanceInterval();
  }

  private startMaintenanceInterval(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => this.maintenance(), 60000); // Run every minute
    }
  }

  private async maintenance(): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.maintenance');
    try {
      // const now = Date.now(); // TODO: Use this to optimize maintenance
      let removedCount = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (this.isExpired(entry) || this.shouldEvict(entry)) {
          await this.delete(key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.config.monitoring?.logger.info('Cache maintenance completed', {
          removedEntries: removedCount,
          remainingEntries: this.cache.size,
          totalSize: this.totalSize
        });
      }
    } catch (error) {
      this.handleError('maintenance_failed', error);
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.get', { key });
    
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        this.recordCacheMiss(key);
        return null;
      }

      if (this.isExpired(entry)) {
        await this.delete(key);
        this.recordCacheMiss(key);
        return null;
      }

      entry.hits++;
      entry.lastAccessed = Date.now();
      this.recordCacheHit(key);
      return entry.value as T;
    } catch (error) {
      this.handleError('get_failed', error, { key });
      return null;
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.set', { key, options });

    try {
      const size = this.getSize(value);
      if (size > (options.maxSize ?? this.config.maxSize)) {
        throw new CacheError(
          'Value exceeds size limit',
          'size_limit_exceeded',
          { key, size, maxSize: options.maxSize ?? this.config.maxSize }
        );
      }

      // Ensure we have space
      await this.ensureCapacity(size);

      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + (options.ttl ?? this.config.defaultTtl),
        tags: options.tags ?? [],
        size,
        lastAccessed: Date.now(),
        hits: 0
      };

      const oldEntry = this.cache.get(key);
      if (oldEntry) {
        this.totalSize -= oldEntry.size;
      }

      this.cache.set(key, entry);
      this.totalSize += size;
      this.updateTagIndex(key, entry.tags);

      this.config.monitoring?.metrics.record('cache.size', this.totalSize);
    } catch (error) {
      this.handleError('set_failed', error, { key });
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }

  private async ensureCapacity(requiredSize: number): Promise<void> {
    if (this.totalSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Evict entries until we have enough space
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => this.getEntryPriority(a) - this.getEntryPriority(b));

    for (const [key] of entries) {
      if (this.totalSize + requiredSize <= this.config.maxSize) {
        break;
      }
      await this.delete(key);
    }
  }

  private getEntryPriority(entry: CacheEntry<any>): number {
    const age = Date.now() - entry.lastAccessed;
    return (entry.hits / Math.max(age, 1)) * entry.size;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.expiresAt < Date.now();
  }

  private shouldEvict(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.lastAccessed;
    return age > this.config.defaultTtl * 2 && entry.hits < 2;
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

  private recordCacheHit(key: string): void {
    if (this.config.monitoring) {
      this.config.monitoring.metrics.record('cache.hit', 1);
      this.config.monitoring.logger.debug('Cache hit', { key });
    }
  }

  private recordCacheMiss(key: string): void {
    if (this.config.monitoring) {
      this.config.monitoring.metrics.record('cache.miss', 1);
      this.config.monitoring.logger.debug('Cache miss', { key });
    }
  }

  private handleError(code: string, error: unknown, metadata: Record<string, unknown> = {}): void {
    if (this.config.monitoring) {
      this.config.monitoring.metrics.record('cache.error', 1);
      this.config.monitoring.logger.error('Cache operation failed', {
        code,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        ...metadata
      });
    }
    throw new CacheError(
      error instanceof Error ? error.message : 'Cache operation failed',
      code,
      metadata
    );
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    return {
      hits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      misses: 0, // Would need to track this separately
      size: this.totalSize,
      entryCount: this.cache.size,
      oldestEntry: Math.min(...entries.map(e => e.lastAccessed)),
      newestEntry: Math.max(...entries.map(e => e.lastAccessed))
    };
  }

  async delete(key: string): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.delete', { key });
    
    try {
      const entry = this.cache.get(key);
      if (entry) {
        // Update total size
        this.totalSize -= entry.size;
        
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
  
        // Remove the entry
        this.cache.delete(key);
  
        this.config.monitoring?.metrics.record('cache.size', this.totalSize);
        this.config.monitoring?.logger.debug('Cache entry deleted', { key });
      }
    } catch (error) {
      this.handleError('delete_failed', error, { key });
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.invalidateByTag', { tag });
    
    try {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        await Promise.all([...keys].map(key => this.delete(key)));
        this.tagIndex.delete(tag);
        
        this.config.monitoring?.logger.info('Cache entries invalidated by tag', { 
          tag, 
          invalidatedCount: keys.size 
        });
      }
    } catch (error) {
      this.handleError('tag_invalidation_failed', error, { tag });
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }
  
  async invalidateByTags(tags: string[]): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.invalidateByTags', { tags });
    
    try {
      await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
    } catch (error) {
      this.handleError('tags_invalidation_failed', error, { tags });
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }
  
  async invalidateByPattern(pattern: string | RegExp): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.invalidateByPattern', { 
      pattern: pattern.toString() 
    });
    
    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
      
      await Promise.all(keysToDelete.map(key => this.delete(key)));
      
      this.config.monitoring?.logger.info('Cache entries invalidated by pattern', {
        pattern: pattern.toString(),
        invalidatedCount: keysToDelete.length
      });
    } catch (error) {
      this.handleError('pattern_invalidation_failed', error, { pattern: pattern.toString() });
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
  }
  
  async clear(): Promise<void> {
    const spanId = this.config.monitoring?.tracer.startSpan('cache.clear');
    
    try {
      const entryCount = this.cache.size;
      
      this.cache.clear();
      this.tagIndex.clear();
      this.totalSize = 0;
      
      this.config.monitoring?.metrics.record('cache.size', 0);
      this.config.monitoring?.logger.info('Cache cleared', { 
        clearedEntries: entryCount 
      });
    } catch (error) {
      this.handleError('clear_failed', error);
    } finally {
      if (spanId) this.config.monitoring?.tracer.endSpan(spanId);
    }
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
    const spanId = this.monitoring?.tracer.startSpan('cache.getOrSet', { key, options });

    try {
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const value = await factory();
      await this.cache.set(key, value, options);
      return value;
    } finally {
      if (spanId) this.monitoring?.tracer.endSpan(spanId);
    }
  }

  async delete(key: string): Promise<void> {
    return this.cache.delete(key);
  }
  
  async invalidateByTag(tag: string): Promise<void> {
    return this.cache.invalidateByTag(tag);
  }
  
  async invalidateByTags(tags: string[]): Promise<void> {
    return this.cache.invalidateByTags(tags);
  }
  
  async invalidateByPattern(pattern: string | RegExp): Promise<void> {
    return this.cache.invalidateByPattern(pattern);
  }
  
  async clear(): Promise<void> {
    return this.cache.clear();
  }
}

export function createCache(config: CacheConfig): CacheManager {
  const cache = new Cache(config);
  return new CacheManager(cache, config.monitoring);
}
