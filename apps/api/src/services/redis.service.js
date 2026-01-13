import { getRedisClient } from '../config/redis';
import { logger } from '../config/logger';
export class RedisService {
    async blacklistToken(token, ttl = 900) {
        try {
            const redis = getRedisClient();
            await redis.setex(`blacklist:${token}`, ttl, '1');
        }
        catch (error) {
            logger.error('Redis blacklist error:', error);
            throw error;
        }
    }
    async isTokenBlacklisted(token) {
        try {
            const redis = getRedisClient();
            const result = await redis.get(`blacklist:${token}`);
            return result === '1';
        }
        catch (error) {
            logger.error('Redis check error:', error);
            return false;
        }
    }
    async setCache(key, value, ttl = 3600) {
        try {
            const redis = getRedisClient();
            await redis.setex(`cache:${key}`, ttl, value);
        }
        catch (error) {
            logger.error('Redis cache set error:', error);
        }
    }
    async getCache(key) {
        try {
            const redis = getRedisClient();
            return await redis.get(`cache:${key}`);
        }
        catch (error) {
            logger.error('Redis cache get error:', error);
            return null;
        }
    }
    async deleteCache(key) {
        try {
            const redis = getRedisClient();
            await redis.del(`cache:${key}`);
        }
        catch (error) {
            logger.error('Redis cache delete error:', error);
        }
    }
    /** Store JSON payloads with TTL */
    async setCacheJSON(key, value, ttl = 3600) {
        try {
            const redis = getRedisClient();
            await redis.setex(`cache:${key}`, ttl, JSON.stringify(value));
        }
        catch (error) {
            logger.error('Redis JSON cache set error:', error);
        }
    }
    /** Retrieve JSON payloads; returns null on parse or redis errors */
    async getCacheJSON(key) {
        try {
            const redis = getRedisClient();
            const raw = await redis.get(`cache:${key}`);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch (error) {
            logger.error('Redis JSON cache get error:', error);
            return null;
        }
    }
    /** Delete cached keys matching a pattern using SCAN to avoid blocking */
    async deleteCacheByPattern(pattern) {
        try {
            const redis = getRedisClient();
            let cursor = '0';
            let deleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `cache:${pattern}`, 'COUNT', 50);
                if (keys.length) {
                    await redis.del(...keys);
                    deleted += keys.length;
                }
                cursor = nextCursor;
            } while (cursor !== '0');
            return deleted;
        }
        catch (error) {
            logger.error('Redis pattern delete error:', error);
            return 0;
        }
    }
}
export const redisService = new RedisService();
//# sourceMappingURL=redis.service.js.map