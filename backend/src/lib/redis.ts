import Redis from 'ioredis';
import { config } from '../config/index.js';

let redis: Redis | null = null;

export const getRedis = (): Redis => {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        redis.on('connect', () => {
            console.log('✅ Redis connected');
        });
    }
    return redis;
};

export const closeRedis = async (): Promise<void> => {
    if (redis) {
        await redis.quit();
        redis = null;
    }
};

export default getRedis;
