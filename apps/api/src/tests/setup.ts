import { beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
// import { connectDatabase, disconnectDatabase } from '../config/database';

// Test database connection
let testDbUri = process.env.MONGODB_TEST_URI || process.env.MONGODB_URI?.replace(/\/[^/]+$/, '/test_euroasiann');

if (!testDbUri) {
  testDbUri = 'mongodb://localhost:27017/test_euroasiann';
}

// Setup before all tests
beforeAll(async () => {
  try {
    // Connect to test database
    await mongoose.connect(testDbUri);
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close all connections
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log('✅ Disconnected from test database');
  } catch (error) {
    console.error('❌ Error disconnecting from test database:', error);
  }
});

// Clean database before each test
beforeEach(async () => {
  // Drop all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Global test utilities
export const testUtils = {
  /**
   * Create a test user
   */
  async createTestUser(overrides = {}) {
    const { User } = await import('../models/user.model');
    const { authService } = await import('../services/auth.service');
    
    const defaultUser = {
      email: 'test@example.com',
      password: await authService.hashPassword('TestPassword123!'),
      firstName: 'Test',
      lastName: 'User',
      portalType: 'tech',
      role: 'tech_admin',
      organizationId: new mongoose.Types.ObjectId(),
      isActive: true,
    };

    return await User.create({ ...defaultUser, ...overrides });
  },

  /**
   * Get authentication tokens for a user
   */
  async getAuthTokens(user: any) {
    const { authService } = await import('../services/auth.service');
    // const { jwtConfig } = await import('../config/jwt');
    
    const jwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId.toString(),
      portalType: user.portalType,
      role: user.role,
    };

    const accessToken = authService.generateAccessToken(jwtPayload);
    const refreshToken = authService.generateRefreshToken();

    return { accessToken, refreshToken };
  },

  /**
   * Wait for a specified time (for async operations)
   */
  async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

