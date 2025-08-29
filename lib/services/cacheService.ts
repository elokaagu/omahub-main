// Phase 2C: Advanced Caching Service
// OmaHub Premium Performance Caching System

export interface CacheConfig {
  maxAge: number;
  maxSize: number;
  priority: "high" | "medium" | "low";
  strategy: "cache-first" | "network-first" | "stale-while-revalidate";
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

class AdvancedCacheService {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: 5 * 60 * 1000, // 5 minutes default
      maxSize: 50 * 1024 * 1024, // 50MB default
      priority: "medium",
      strategy: "stale-while-revalidate",
      ...config,
    };

    // Cleanup expired entries periodically
    this.startCleanupInterval();
  }

  /**
   * Set a cache entry with intelligent expiration
   */
  async set<T>(
    key: string,
    data: T,
    options?: Partial<CacheConfig>
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (options?.maxAge || this.config.maxAge),
      accessCount: 0,
      lastAccessed: Date.now(),
      size: this.calculateSize(data),
    };

    // Check if we need to evict entries
    await this.ensureCapacity(entry.size);

    this.cache.set(key, entry);
    this.updateStats("set");
  }

  /**
   * Get a cache entry with intelligent fallback
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.updateStats("miss");
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.updateStats("miss");
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.updateStats("hit");
    return entry.data;
  }

  /**
   * Get with fallback function for stale-while-revalidate strategy
   */
  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options?: Partial<CacheConfig>
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached) {
      // Return cached data immediately
      this.triggerBackgroundRefresh(key, fallbackFn, options);
      return cached;
    }

    // No cache, fetch fresh data
    const fresh = await fallbackFn();
    await this.set(key, fresh, options);
    return fresh;
  }

  /**
   * Remove a specific cache entry
   */
  async remove(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    const hitRate =
      this.stats.totalRequests > 0
        ? this.stats.hits / this.stats.totalRequests
        : 0;
    const missRate =
      this.stats.totalRequests > 0
        ? this.stats.misses / this.stats.totalRequests
        : 0;

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      evictionCount: this.stats.evictions,
    };
  }

  /**
   * Preload critical data
   */
  async preload<T>(
    key: string,
    data: T,
    priority: "high" | "medium" | "low" = "medium"
  ): Promise<void> {
    await this.set(key, data, { priority, maxAge: this.config.maxAge * 2 });
  }

  /**
   * Warm up cache with multiple entries
   */
  async warmup<T>(
    entries: Array<{
      key: string;
      data: T;
      priority?: "high" | "medium" | "low";
    }>
  ): Promise<void> {
    const promises = entries.map((entry) =>
      this.preload(entry.key, entry.data, entry.priority)
    );
    await Promise.all(promises);
  }

  /**
   * Get cache keys matching a pattern
   */
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    if (!pattern) return keys;
    return keys.filter((key) => pattern.test(key));
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Get cache size in bytes
   */
  getSize(): number {
    return Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
  }

  /**
   * Private methods
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 1024; // Default size if calculation fails
    }
  }

  private async ensureCapacity(requiredSize: number): Promise<void> {
    const currentSize = this.getSize();

    if (currentSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Need to evict entries
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by priority, then by access count, then by last accessed
        const priorityOrder: Record<string, number> = {
          high: 3,
          medium: 2,
          low: 1,
        };
        const aPriority = priorityOrder[this.config.priority];
        const bPriority = priorityOrder[this.config.priority];

        if (aPriority !== bPriority) return bPriority - aPriority;
        if (a.entry.accessCount !== b.entry.accessCount)
          return b.entry.accessCount - a.entry.accessCount;
        return a.entry.lastAccessed - b.entry.lastAccessed;
      });

    // Evict entries until we have enough space
    for (const { key } of entries) {
      this.cache.delete(key);
      this.stats.evictions++;

      if (this.getSize() + requiredSize <= this.config.maxSize) {
        break;
      }
    }
  }

  private updateStats(type: "hit" | "miss" | "set"): void {
    this.stats.totalRequests++;
    if (type === "hit") this.stats.hits++;
    if (type === "miss") this.stats.misses++;
  }

  private resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Clean up every minute
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private async triggerBackgroundRefresh<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options?: Partial<CacheConfig>
  ): Promise<void> {
    // Trigger background refresh for stale-while-revalidate
    if (this.config.strategy === "stale-while-revalidate") {
      setTimeout(async () => {
        try {
          const fresh = await fallbackFn();
          await this.set(key, fresh, options);
        } catch (error) {
          console.warn("Background refresh failed for key:", key, error);
        }
      }, 0);
    }
  }
}

// Create default cache instances
export const defaultCache = new AdvancedCacheService();
export const imageCache = new AdvancedCacheService({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours for images
  maxSize: 100 * 1024 * 1024, // 100MB for images
  priority: "low",
});
export const apiCache = new AdvancedCacheService({
  maxAge: 2 * 60 * 1000, // 2 minutes for API calls
  maxSize: 25 * 1024 * 1024, // 25MB for API responses
  priority: "high",
});

// Export the class for custom instances
export { AdvancedCacheService };
export default defaultCache;
