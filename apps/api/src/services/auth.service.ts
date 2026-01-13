import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { RefreshToken } from "../models/refresh-token.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../config/jwt";
import { getRedisClient } from "../config/redis";
import { JwtPayload } from "../../../../packages/shared/src/types/index";
import { logger } from "../config/logger";

export class AuthService {

  /* ---------------- LOGIN ---------------- */
  async login(email: string, password: string, portalType: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1️⃣ Find user
    const user = await User.findOne({
      email: normalizedEmail,
      portalType,
    }).select("+password");

    if (!user || !user.isActive) {
      throw new Error("Invalid credentials");
    }

    // 2️⃣ Validate password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // 🔥 HARD CHECK (Casbin critical)
    if (!user.organizationId) {
      throw new Error("User is not assigned to an organization");
    }

    // 3️⃣ Fetch role → permissions
    const role = await Role.findOne({
      _id: user.roleId,
      portalType: user.portalType,
      $or: [
        { organizationId: user.organizationId },
        { isSystem: true },
      ],
    });

    const permissions = role?.permissions || [];
      console.log(permissions);
    // 4️⃣ Update last login
    user.lastLogin = new Date();
    await user.save();

    // 5️⃣ Casbin-safe JWT payload
    const payload: JwtPayload = {
      userId: user._id.toString(),
      organizationId: user.organizationId.toString(),
      role: user.role,
      portalType: user.portalType as any,
      email: user.email,
    };

    // 6️⃣ Generate tokens
    const accessToken = generateAccessToken(payload);
    const refreshTokenValue = generateRefreshToken(payload);

    // 7️⃣ Store refresh token
    const refreshToken = new RefreshToken({
      token: refreshTokenValue,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await refreshToken.save();

    // 8️⃣ FINAL RESPONSE (🔥 permissions included)
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
        roleName: user.roleName,
        organizationId: user.organizationId,
      },
      permissions,
    };
  }

  /* ---------------- REFRESH TOKEN ---------------- */
  async refreshToken(token: string) {
    try {
      const decoded = verifyToken(token) as JwtPayload;

      const refreshTokenDoc = await RefreshToken.findOne({ token });
      if (!refreshTokenDoc) {
        throw new Error("Invalid refresh token");
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive");
      }

      if (!user.organizationId) {
        throw new Error("User has no organization assigned");
      }

      const payload: JwtPayload = {
        userId: user._id.toString(),
        organizationId: user.organizationId.toString(),
        role: user.role,
        portalType: user.portalType as any,
        email: user.email,
      };

      const accessToken = generateAccessToken(payload);
      return { accessToken };
    } catch {
      throw new Error("Invalid refresh token");
    }
  }

  /* ---------------- LOGOUT ---------------- */
  async logout(token: string, refreshToken: string) {
    try {
      // Blacklist access token
      try {
        const redis = getRedisClient();
        if (token) {
          try {
            verifyToken(token);
            const ttl = 15 * 60;
            await redis.setex(`blacklist:${token}`, ttl, "1");
          } catch {}
        }
      } catch {}

      // Remove refresh token
      if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
      }

      return { success: true };
    } catch (error: any) {
      logger.error("Logout error:", error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /* ---------------- GET CURRENT USER ---------------- */
  async getCurrentUser(userId: string) {
    const user = await User.findById(userId)
      .select("-password")
      .populate("roleId", "name key permissions")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    // Get role permissions if roleId exists
    let permissions: string[] = [];
    if (user.roleId && typeof user.roleId === 'object' && 'permissions' in user.roleId) {
      permissions = (user.roleId as any).permissions || [];
    } else if (user.roleId) {
      // If roleId is populated but permissions not included, fetch role separately
      const role = await Role.findById(user.roleId).select("permissions").lean();
      permissions = role?.permissions || [];
    }

    return {
      ...user,
      permissions,
    };
  }

  
}

export const authService = new AuthService();
