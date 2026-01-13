import mongoose from 'mongoose';
export declare const testUtils: {
    /**
     * Create a test user
     */
    createTestUser(overrides?: {}): Promise<mongoose.Document<unknown, {}, import("../models/user.model").IUser, {}, {}> & import("../models/user.model").IUser & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get authentication tokens for a user
     */
    getAuthTokens(user: any): Promise<{
        accessToken: any;
        refreshToken: any;
    }>;
    /**
     * Wait for a specified time (for async operations)
     */
    wait(ms: number): Promise<unknown>;
};
//# sourceMappingURL=setup.d.ts.map