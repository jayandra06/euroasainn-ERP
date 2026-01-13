export declare class RedisService {
    blacklistToken(token: string, ttl?: number): Promise<void>;
    isTokenBlacklisted(token: string): Promise<boolean>;
    setCache(key: string, value: string, ttl?: number): Promise<void>;
    getCache(key: string): Promise<string | null>;
    deleteCache(key: string): Promise<void>;
    /** Store JSON payloads with TTL */
    setCacheJSON<T>(key: string, value: T, ttl?: number): Promise<void>;
    /** Retrieve JSON payloads; returns null on parse or redis errors */
    getCacheJSON<T>(key: string): Promise<T | null>;
    /** Delete cached keys matching a pattern using SCAN to avoid blocking */
    deleteCacheByPattern(pattern: string): Promise<number>;
}
export declare const redisService: RedisService;
//# sourceMappingURL=redis.service.d.ts.map