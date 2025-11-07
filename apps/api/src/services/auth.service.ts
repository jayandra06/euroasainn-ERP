import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../config/jwt';
import { getRedisClient } from '../config/redis';
import { JwtPayload } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';

export class AuthService {
  async login(email: string, password: string, portalType: string) {
    const user = await User.findOne({ email, portalType }).select('+password');
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: user.organizationId?.toString() || '',
      portalType: String(user.portalType) as any, // Ensure it's a string
      role: user.role,
    };
    
    logger.info(`Login - Generating token for user ${user.email} with portalType: ${payload.portalType}`);

    const accessToken = generateAccessToken(payload);
    const refreshTokenValue = generateRefreshToken(payload);

    // Store refresh token
    const refreshToken = new RefreshToken({
      token: refreshTokenValue,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await refreshToken.save();

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        portalType: user.portalType,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = verifyToken(token);
      
      // Check if refresh token exists
      const refreshTokenDoc = await RefreshToken.findOne({ token });
      if (!refreshTokenDoc) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const payload: JwtPayload = {
        userId: user._id.toString(),
        email: user.email,
        organizationId: user.organizationId?.toString() || '',
        portalType: user.portalType as any,
        role: user.role,
      };

      const accessToken = generateAccessToken(payload);

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(token: string, refreshToken: string) {
    try {
      // Blacklist access token in Redis
      const redis = getRedisClient();
      const decoded = verifyToken(token);
      const ttl = 15 * 60; // 15 minutes
      await redis.setex(`blacklist:${token}`, ttl, '1');

      // Delete refresh token
      await RefreshToken.deleteOne({ token: refreshToken });

      return { success: true };
    } catch (error) {
      logger.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      portalType: user.portalType,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };
  }
}

export const authService = new AuthService();
