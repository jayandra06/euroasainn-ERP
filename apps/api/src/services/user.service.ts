// src/services/user.service.ts
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, IUser } from "../models/user.model";
import { UserProfile } from "../models/user-profile.model";
import { Role } from "../models/role.model";
import { PortalType } from "../../../../packages/shared/src/types/index";
import { redisService } from "./redis.service";
import { logger } from "../config/logger";
import { getCasbinEnforcer } from "../config/casbin";

/* ---------------- UTIL ---------------- */
function generateTemporaryPassword() {
  return (
    Math.random().toString(36).slice(-6) +
    Math.random().toString(36).slice(-6).toUpperCase()
  );
}

/* ---------------- SERVICE ---------------- */
export class UserService {
  /* ---------------- HELPER: Find user by email or name ---------------- */
  private async findManagerId(query: string): Promise<mongoose.Types.ObjectId | null> {
    if (!query?.trim()) return null;

    const trimmed = query.trim();

    // 1. Try exact email match (most reliable)
    let manager = await User.findOne({ email: trimmed.toLowerCase() }).select('_id');
    if (manager) return manager._id;

    // 2. Try fullName exact match (case insensitive)
    manager = await User.findOne({ 
      fullName: { $regex: new RegExp(`^${trimmed}$`, 'i') } 
    }).select('_id');
    if (manager) return manager._id;

    // 3. Try firstName + lastName split
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      manager = await User.findOne({
        firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
      }).select('_id');
      if (manager) return manager._id;
    }

    return null; // Not found
  }

  /* ---------------- CREATE USER (Manual) ---------------- */
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
    organizationId: string;
    employeeId?: string;
    phone?: string;
    department?: string;
    designation?: string;
    location?: string;
    reportingTo?: string;  // ← Now accepts name/email
    createdBy?: string;
  }) {
    logger.info('createUser called', { email: data.email, organizationId: data.organizationId });

    if (!data.organizationId) {
      logger.error('createUser failed: OrganizationId missing');
      throw new Error("OrganizationId is required");
    }

    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await User.findOne({
      email: normalizedEmail,
      portalType: data.portalType,
      organizationId: data.organizationId,
    });

    if (existing) {
      logger.warn('createUser failed: User already exists', { email: normalizedEmail });
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      portalType: data.portalType,
      role: data.role,
      organizationId: new mongoose.Types.ObjectId(data.organizationId),
      isActive: true,
    });

    await user.save();
    logger.info('User created successfully', { userId: user._id, email: normalizedEmail });

    // ============== CREATE CASBIN GROUPING POLICY (g policy) ==============
    try {
      // Find the role to get the role key
      const role = await Role.findOne({
        key: data.role,
        portalType: data.portalType,
        organizationId: new mongoose.Types.ObjectId(data.organizationId),
      });

      if (role) {
        const enforcer = await getCasbinEnforcer();
        const userIdStr = user._id.toString();
        const orgIdStr = data.organizationId;

        // Create g(userId, role.key, organizationId) policy
        await enforcer.addGroupingPolicy(userIdStr, role.key, orgIdStr);
        // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
        // ✅ In-memory enforcer cache is automatically updated (no reset needed)

        // Update user's roleId and roleName fields
        user.roleId = role._id;
        user.roleName = role.name;
        await user.save();

        logger.info(`✅ Created Casbin grouping policy g(${userIdStr}, ${role.key}, ${orgIdStr}) and updated user roleId/roleName`);
      } else {
        logger.warn(`⚠️ Role not found for key: ${data.role}, portal: ${data.portalType}, org: ${data.organizationId}. Casbin policy not created.`);
      }
    } catch (error: any) {
      logger.error(`❌ Error creating Casbin grouping policy for user ${user._id}:`, error);
      // Don't fail user creation if Casbin policy creation fails
      // But log the error for debugging
    }
    // ================================================

    // ============== RESOLVE REPORTING MANAGER ==============
    let reportingToId: mongoose.Types.ObjectId | undefined;
    if (data.reportingTo) {
      const foundId = await this.findManagerId(data.reportingTo);
      if (!foundId) {
        throw new Error(`Reporting manager not found: "${data.reportingTo}"`);
      }
      reportingToId = foundId;
    }
    // ================================================

    // ============== SYNC TO USERPROFILE ==============
    const profileData: any = { userId: user._id };
    if (data.createdBy) {
      // Handle both string and ObjectId formats
      profileData.createdBy = typeof data.createdBy === 'string' 
        ? new mongoose.Types.ObjectId(data.createdBy)
        : data.createdBy;
    }
    if (data.employeeId) profileData.employeeId = data.employeeId.trim().toUpperCase();
    if (data.phone) profileData.phone = data.phone.trim();
    if (data.department) profileData.department = data.department.trim();
    if (data.designation) profileData.designation = data.designation.trim();
    if (data.location) profileData.location = data.location.trim();
    if (reportingToId) profileData.reportingTo = reportingToId;

    await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: profileData },
      { upsert: true, new: true }
    );
    logger.info('UserProfile synced for new user', { userId: user._id });
    // ================================================

    const userDoc = user.toObject();
    delete userDoc.password;

    try {
      await redisService.deleteCache(`users:${data.organizationId}:all`);
      await redisService.deleteCache(`users:${data.organizationId}:${data.portalType}`);
      await redisService.deleteCache(`user:${user._id}`);
<<<<<<< HEAD
      logger.info('Cache invalidated after user creation');
    } catch (error) {
      logger.warn('Cache invalidation failed', { error });
=======
    } catch {
      // Non-critical
>>>>>>> main
    }

    return userDoc;
  }

  /* ---------------- GET USERS ---------------- */
  async getUsers(portalType: PortalType, organizationId: string, filters?: any) {
    logger.info('getUsers called', { portalType, organizationId, filters });

    if (!organizationId) {
      logger.error('getUsers failed: OrganizationId missing');
      throw new Error("OrganizationId is required");
    }

    const baseQuery: any = { portalType, organizationId };
    const query: any = { ...baseQuery };
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    
    // Search support: search in email, firstName, lastName, roleName
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { roleName: searchRegex },
      ];
    }

    // Pagination support
    if (filters?.page && filters?.limit) {
      const skip = filters.skip || (filters.page - 1) * filters.limit;
      const limit = filters.limit;

      // Calculate counts: 
      // - total: all users (for stats cards)
      // - filteredTotal: count of filtered results (for pagination)
      const [users, total, filteredTotal, activeCount, inactiveCount] = await Promise.all([
        User.find(query).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
        User.countDocuments(baseQuery), // Total count without isActive filter (for stats)
        User.countDocuments(query), // Filtered count (for pagination)
        User.countDocuments({ ...baseQuery, isActive: true }),
        User.countDocuments({ ...baseQuery, isActive: false }),
      ]);

      logger.info(`getUsers returned ${users.length} users (page ${filters.page}, total: ${total}, filtered: ${filteredTotal}, active: ${activeCount}, inactive: ${inactiveCount})`);

      return {
        users,
        total, // Total all users (for stats)
        filteredTotal, // Filtered count (for pagination)
        activeCount,
        inactiveCount,
      };
    }

    // Non-paginated: return all users (backward compatibility)
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    logger.info(`getUsers returned ${users.length} users (non-paginated)`);

    return users;
  }

  /* ---------------- GET USER BY ID ---------------- */
  async getUserById(userId: string) {
    logger.info('getUserById called', { userId });

    const user = await User.findById(userId).select("-password");

    if (!user) {
      logger.warn('getUserById: User not found', { userId });
      throw new Error("User not found");
    }

    logger.info('getUserById success', { userId, email: user.email });
    return user;
  }

  /* ---------------- UPDATE USER ---------------- */
  async updateUser(
    userId: string,
    data: Partial<IUser & {
      employeeId?: string;
      phone?: string;
      department?: string;
      designation?: string;
      location?: string;
      reportingTo?: string | null;  // ← Can be name/email or null
    }>
  ) {
    logger.info('updateUser called', { userId, hasProfileData: Object.keys(data).some(k => ['employeeId','phone','department','designation','location','reportingTo'].includes(k)) });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('updateUser: User not found', { userId });
      throw new Error("User not found");
    }

    delete (data as any).password;

    Object.assign(user, data);
    await user.save();
    logger.info('User document updated', { userId });

    // ============== UPDATE USERPROFILE ==============
    const profileUpdate: any = {};
    if (data.employeeId !== undefined) profileUpdate.employeeId = data.employeeId?.trim().toUpperCase();
    if (data.phone !== undefined) profileUpdate.phone = data.phone?.trim();
    if (data.department !== undefined) profileUpdate.department = data.department?.trim();
    if (data.designation !== undefined) profileUpdate.designation = data.designation?.trim();
    if (data.location !== undefined) profileUpdate.location = data.location?.trim();

    if (data.reportingTo !== undefined) {
      if (!data.reportingTo) {
        profileUpdate.reportingTo = null;
      } else {
        const foundId = await this.findManagerId(data.reportingTo);
        if (!foundId) {
          throw new Error(`Reporting manager not found: "${data.reportingTo}"`);
        }
        profileUpdate.reportingTo = foundId;
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      await UserProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: profileUpdate },
        { upsert: true }
      );
      logger.info('UserProfile updated', { userId });
    }
    // ================================================

    const userDoc = user.toObject();
    delete userDoc.password;

    try {
      const orgId = user.organizationId?.toString();
      if (orgId) {
        await redisService.deleteCache(`users:${orgId}:all`);
        await redisService.deleteCache(`users:${orgId}:${user.portalType}`);
      }
      await redisService.deleteCache(`user:${userId}`);
<<<<<<< HEAD
      logger.info('Cache invalidated after update');
    } catch (error) {
      logger.warn('Cache invalidation failed on update');
=======
    } catch {
      // Non-critical
>>>>>>> main
    }

    return userDoc;
  }

  /* ---------------- DELETE USER ---------------- */
  async deleteUser(userId: string) {
    logger.info('deleteUser called', { userId });

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      logger.warn('deleteUser: User not found', { userId });
      throw new Error("User not found");
    }

    await UserProfile.deleteOne({ userId: user._id });
    logger.info('UserProfile deleted', { userId });

    try {
      const orgId = user.organizationId?.toString();
      if (orgId) {
        await redisService.deleteCache(`users:${orgId}:all`);
        await redisService.deleteCache(`users:${orgId}:${user.portalType}`);
      }
      await redisService.deleteCache(`user:${userId}`);
<<<<<<< HEAD
      logger.info('Cache invalidated after deletion');
    } catch (error) {
      logger.warn('Cache invalidation failed on delete');
=======
    } catch {
      // Non-critical
>>>>>>> main
    }

    return { success: true };
  }

  /* ---------------- INVITE USER ---------------- */
  async inviteUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
    roleId?: string;
    organizationId: string;
    employeeId?: string;
    phone?: string;
    department?: string;
    designation?: string;
    location?: string;
    reportingTo?: string;  // ← Accepts name/email
    createdBy?: string;
  }) {
    logger.info('inviteUser called', { email: data.email, organizationId: data.organizationId });

    if (!data.organizationId) {
      logger.error('inviteUser failed: OrganizationId missing');
      throw new Error("OrganizationId is required");
    }

    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await User.findOne({
      email: normalizedEmail,
      portalType: data.portalType,
      organizationId: data.organizationId,
    });

    if (existing) {
      logger.warn('inviteUser failed: User already exists', { email: normalizedEmail });
      throw new Error("User already exists");
    }

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = new User({
      email: normalizedEmail,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      portalType: data.portalType,
      role: data.role,
      roleId: data.roleId ? new mongoose.Types.ObjectId(data.roleId) : undefined,
      password: hashedPassword,
      organizationId: new mongoose.Types.ObjectId(data.organizationId),
      isActive: true,
    });

    await user.save();
    logger.info('Invited user created', { userId: user._id, email: normalizedEmail });

    // ============== CREATE CASBIN GROUPING POLICY (g policy) ==============
    try {
      // Find the role to get the role key
      const role = await Role.findOne({
        $or: [
          { key: data.role, portalType: data.portalType, organizationId: new mongoose.Types.ObjectId(data.organizationId) },
          ...(data.roleId ? [{ _id: new mongoose.Types.ObjectId(data.roleId), portalType: data.portalType, organizationId: new mongoose.Types.ObjectId(data.organizationId) }] : []),
        ],
      });

      if (role) {
        const enforcer = await getCasbinEnforcer();
        const userIdStr = user._id.toString();
        const orgIdStr = data.organizationId;

        // Create g(userId, role.key, organizationId) policy
        await enforcer.addGroupingPolicy(userIdStr, role.key, orgIdStr);
        // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
        // ✅ In-memory enforcer cache is automatically updated (no reset needed)

        // Update user's roleId and roleName fields
        user.roleId = role._id;
        user.roleName = role.name;
        user.role = role.key;
        await user.save();

        logger.info(`✅ Created Casbin grouping policy g(${userIdStr}, ${role.key}, ${orgIdStr}) for invited user`);
      } else {
        logger.warn(`⚠️ Role not found for key/id: ${data.role}/${data.roleId}, portal: ${data.portalType}, org: ${data.organizationId}. Casbin policy not created.`);
      }
    } catch (error: any) {
      logger.error(`❌ Error creating Casbin grouping policy for invited user ${user._id}:`, error);
      // Don't fail user invitation if Casbin policy creation fails
      // But log the error for debugging
    }
    // ================================================

    // ============== RESOLVE REPORTING MANAGER ==============
    let reportingToId: mongoose.Types.ObjectId | undefined;
    if (data.reportingTo) {
      const foundId = await this.findManagerId(data.reportingTo);
      if (!foundId) {
        throw new Error(`Reporting manager not found: "${data.reportingTo}"`);
      }
      reportingToId = foundId;
    }
    // ================================================

    // ============== SYNC TO USERPROFILE ==============
    const profileData: any = { userId: user._id };
    if (data.createdBy) {
      // Handle both string and ObjectId formats
      profileData.createdBy = typeof data.createdBy === 'string' 
        ? new mongoose.Types.ObjectId(data.createdBy)
        : data.createdBy;
    }
    if (data.employeeId) profileData.employeeId = data.employeeId.trim().toUpperCase();
    if (data.phone) profileData.phone = data.phone.trim();
    if (data.department) profileData.department = data.department.trim();
    if (data.designation) profileData.designation = data.designation.trim();
    if (data.location) profileData.location = data.location.trim();
    if (reportingToId) profileData.reportingTo = reportingToId;

    await UserProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: profileData },
      { upsert: true, new: true }
    );
    logger.info('UserProfile synced for invited user', { userId: user._id });
    // ================================================

    const userDoc = user.toObject();
    delete userDoc.password;

    try {
      await redisService.deleteCache(`users:${data.organizationId}:all`);
      await redisService.deleteCache(`users:${data.organizationId}:${data.portalType}`);
<<<<<<< HEAD
      logger.info('Cache invalidated after invite');
    } catch (error) {
      logger.warn('Cache invalidation failed on invite');
=======
    } catch {
      // Non-critical
>>>>>>> main
    }

    return { ...userDoc, temporaryPassword };
  }

  /* ---------------- RESET TEMP PASSWORD ---------------- */
  async resetUserTemporaryPassword(email: string, portalType: PortalType) {
    logger.info('resetUserTemporaryPassword called', { email, portalType });

    const user = await User.findOne({ email, portalType });
    if (!user) {
      logger.warn('resetUserTemporaryPassword: User not found', { email, portalType });
      throw new Error("User not found");
    }

    const temporaryPassword = generateTemporaryPassword();
    user.password = await bcrypt.hash(temporaryPassword, 10);
    await user.save();

    logger.info('Temporary password reset successful', { userId: user._id });

    const userDoc = user.toObject();
    delete userDoc.password;
    return { user: userDoc, temporaryPassword };
  }
}

export const userService = new UserService();