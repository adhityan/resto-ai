import NodeCache from "node-cache";

/**
 * A generic cache utility using node-cache with configurable TTL.
 * Can be reused across the monorepo for any caching needs.
 */
export class CacheUtil<T = unknown> {
    private cache: NodeCache;

    /**
     * Creates a new CacheUtil instance
     * @param ttlSeconds Time-to-live in seconds for cached items
     */
    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({ stdTTL: ttlSeconds });
    }

    /**
     * Get a value from the cache
     * @param key The cache key
     * @returns The cached value or undefined if not found or expired
     */
    get(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    /**
     * Set a value in the cache
     * @param key The cache key
     * @param value The value to cache
     * @returns true on success, false on failure
     */
    set(key: string, value: T): boolean {
        return this.cache.set(key, value);
    }

    /**
     * Check if a key exists in the cache
     * @param key The cache key
     * @returns true if the key exists and is not expired
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Delete a key from the cache
     * @param key The cache key
     * @returns The number of deleted entries
     */
    delete(key: string): number {
        return this.cache.del(key);
    }

    /**
     * Clear all entries from the cache
     */
    clear(): void {
        this.cache.flushAll();
    }

    /**
     * Get statistics about the cache
     */
    getStats() {
        return this.cache.getStats();
    }
}
