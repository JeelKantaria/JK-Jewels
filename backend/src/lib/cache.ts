import { getRedis } from './redis.js';

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
    CATEGORIES: 300,      // 5 minutes
    FEATURED_PRODUCTS: 300,  // 5 minutes
    PRODUCT_FILTERS: 600,    // 10 minutes
    PRODUCT_DETAIL: 300,     // 5 minutes
    METAL_TYPES: 600,        // 10 minutes
    PURITIES: 600,           // 10 minutes
    OCCASIONS: 600,          // 10 minutes
};

// Cache key prefixes
export const CACHE_KEYS = {
    CATEGORIES: 'cache:categories',
    FEATURED_PRODUCTS: 'cache:products:featured',
    PRODUCT_FILTERS: 'cache:products:filters',
    PRODUCT_DETAIL: (slug: string) => `cache:product:${slug}`,
    METAL_TYPES: 'cache:metal-types',
    PURITIES: 'cache:purities',
    OCCASIONS: 'cache:occasions',
};

/**
 * Get cached data from Redis
 */
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedis();
        const cached = await redis.get(key);
        if (cached) {
            console.log(`✅ Cache HIT: ${key}`);
            return JSON.parse(cached);
        }
        console.log(`❌ Cache MISS: ${key}`);
        return null;
    } catch (error) {
        // Fail silently - if Redis is down, just skip caching
        console.warn('Cache get error:', error);
        return null;
    }
}

/**
 * Set data in Redis cache
 */
export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    try {
        const redis = getRedis();
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
        console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
        // Fail silently - if Redis is down, just skip caching
        console.warn('Cache set error:', error);
    }
}

/**
 * Delete cache by key pattern (for invalidation)
 */
export async function invalidateCache(pattern: string): Promise<void> {
    try {
        const redis = getRedis();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`🗑️ Cache INVALIDATED: ${pattern} (${keys.length} keys)`);
        }
    } catch (error) {
        console.warn('Cache invalidate error:', error);
    }
}

/**
 * Invalidate all product-related caches
 */
export async function invalidateProductCaches(): Promise<void> {
    await invalidateCache('cache:product:*');
    await invalidateCache('cache:products:*');
}

/**
 * Invalidate all category-related caches
 */
export async function invalidateCategoryCaches(): Promise<void> {
    await invalidateCache('cache:categories*');
}

/**
 * Invalidate all entity caches (metal types, purities, occasions)
 */
export async function invalidateEntityCaches(): Promise<void> {
    await invalidateCache('cache:metal-types*');
    await invalidateCache('cache:purities*');
    await invalidateCache('cache:occasions*');
}
