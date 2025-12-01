import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../config/jwt';
import { getRedisClient } from '../config/redis';
import { JwtPayload } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';

export class AuthService {
  async login(email: string, password: string, portalType: string) {
    // Normalize email to lowercase and trim whitespace to match schema behavior
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, portalType }).select('+password');
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
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(token: string, refreshToken: string) {
    try {
      // Try to blacklist access token in Redis (optional - don't fail if this fails)
      try {
      const redis = getRedisClient();
        // Only try to verify and blacklist if token is provided and valid
        if (token) {
          try {
      verifyToken(token);
      const ttl = 15 * 60; // 15 minutes
      await redis.setex(`blacklist:${token}`, ttl, '1');
            logger.info('Access token blacklisted in Redis');
          } catch (tokenError: any) {
            // Token might be expired or invalid - that's okay, we can still logout
            logger.warn('Could not blacklist token (may be expired):', tokenError.message);
          }
        }
      } catch (redisError: any) {
        // Redis might be down - log but continue with logout
        logger.warn('Redis blacklist failed (continuing logout):', redisError.message);
      }

      // Delete refresh token (this is the critical part)
      if (refreshToken) {
        const deleteResult = await RefreshToken.deleteOne({ token: refreshToken });
        logger.info(`Refresh token deleted: ${deleteResult.deletedCount > 0 ? 'success' : 'not found'}`);
      } else {
        logger.warn('No refresh token provided for logout');
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Logout error:', error);
      // Log the actual error details for debugging
      logger.error('Logout error details:', {
        message: error.message,
        stack: error.stack,
        tokenProvided: !!token,
        refreshTokenProvided: !!refreshToken,
      });
      throw new Error(`Logout failed: ${error.message}`);
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
      preferences: user.preferences,
      securityQuestion: user.securityQuestion,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    logger.info(`Password changed for user ${user.email}`);
    return { success: true, message: 'Password changed successfully' };
  }

  async updatePreferences(userId: string, preferences: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
  }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    if (preferences.language !== undefined) {
      user.preferences.language = preferences.language;
    }
    if (preferences.timezone !== undefined) {
      user.preferences.timezone = preferences.timezone;
    }
    if (preferences.dateFormat !== undefined) {
      user.preferences.dateFormat = preferences.dateFormat;
    }
    if (preferences.timeFormat !== undefined) {
      user.preferences.timeFormat = preferences.timeFormat;
    }

    await user.save();
    logger.info(`Preferences updated for user ${user.email}`);
    return { success: true, preferences: user.preferences };
  }

  async updateSecurityQuestion(userId: string, question: string, answer: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!question || !answer.trim()) {
      throw new Error('Security question and answer are required');
    }

    // Hash the security answer
    const hashedAnswer = await bcrypt.hash(answer.trim().toLowerCase(), 10);
    user.securityQuestion = question;
    user.securityAnswer = hashedAnswer;

    await user.save();
    logger.info(`Security question updated for user ${user.email}`);
    return { success: true, message: 'Security question saved successfully' };
  }
}

export const authService = new AuthService();
