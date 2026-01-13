import { Request, Response } from 'express';
/**
 * Mock Express Request object for testing
 */
export declare const createMockRequest: (overrides?: Partial<Request>) => Partial<Request>;
/**
 * Mock Express Response object for testing
 */
export declare const createMockResponse: () => Partial<Response>;
/**
 * Create a valid MongoDB ObjectId string
 */
export declare const createObjectId: () => string;
/**
 * Mock Redis service for testing
 */
export declare const mockRedisService: {
    isBlacklisted: import("vitest").Mock<(...args: any[]) => any>;
    addToBlacklist: import("vitest").Mock<(...args: any[]) => any>;
    removeFromBlacklist: import("vitest").Mock<(...args: any[]) => any>;
    get: import("vitest").Mock<(...args: any[]) => any>;
    set: import("vitest").Mock<(...args: any[]) => any>;
    del: import("vitest").Mock<(...args: any[]) => any>;
    exists: import("vitest").Mock<(...args: any[]) => any>;
};
//# sourceMappingURL=test-helpers.d.ts.map