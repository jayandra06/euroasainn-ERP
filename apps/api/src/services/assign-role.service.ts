import mongoose from "mongoose";
import { User, IUser } from "../models/user.model";
import { Role, IRole } from "../models/role.model";
import { getCasbinEnforcer } from "../config/casbin";
import { redisService } from "./redis.service";

class AssignRoleService {

  async listUsers(portalType: string, organizationId: string, page: number = 1, limit: number = 10, search?: string, roleFilter?: string) {
    const query: any = { organizationId };
    if (portalType !== "all") query.portalType = portalType;
    
    // Apply role filter if provided
    if (roleFilter && roleFilter !== "all") {
      query.roleId = roleFilter;
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get paginated users
    const users = await User.find(query)
      .select("firstName lastName email portalType role roleName roleId organizationId")
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listRoles(portalType: string, organizationId: string) {
    const cacheKey = `assign-role:roles:${organizationId}:${portalType}`;
    const cached = await redisService.getCacheJSON<any[]>(cacheKey);
    if (cached) return cached;

    const query: any = { organizationId };
    if (portalType !== "all") query.portalType = portalType;

    const roles = await Role.find(query)
      .select("name key portalType permissions")
      .lean();

    redisService.setCacheJSON(cacheKey, roles, 300).catch(() => {});
    return roles;
  }

  async assignRole(userId: string, roleId: string, organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new Error("Invalid userId");
    if (!mongoose.Types.ObjectId.isValid(roleId))
      throw new Error("Invalid roleId");

    const [user, role] = await Promise.all([
      User.findOne({ _id: userId, organizationId }).lean<IUser>(),
      Role.findOne({ _id: roleId, organizationId }).lean<IRole>(),
    ]);

    if (!user) throw new Error("User not found in this organization");
    if (!role) throw new Error("Role not found in this organization");
    if (user.portalType !== role.portalType)
      throw new Error("User portal and role portal mismatch");

    const enforcer = await getCasbinEnforcer();
    const userIdStr = user._id.toString();
    const portal = `${role.portalType}_portal`;

    const existingRoles = (await enforcer.getGroupingPolicy()).filter(
      r => r[0] === userIdStr && r[2] === organizationId
    );

    if (existingRoles.length > 0) {
      await enforcer.removeGroupingPolicies(existingRoles);
    }

    await enforcer.addGroupingPolicy(userIdStr, role.key, organizationId);

    await enforcer.addNamedGroupingPolicy(
      "g4",
      role.key,
      role.key,
      portal
    );

    // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
    // ✅ In-memory enforcer cache is automatically updated (no reset needed)

    await User.updateOne(
      { _id: userId },
      {
        role: role.key,
        roleName: role.name,
        roleId: role._id,
      }
    );

    await redisService.deleteCache(`user:${userId}`).catch(() => {});
    await redisService
      .deleteCacheByPattern(`assign-role:users:${organizationId}:*`)
      .catch(() => {});

    return User.findById(userId).lean();
  }

  async removeRole(userId: string, organizationId: string) {
    const user = await User.findOne({ _id: userId, organizationId }).lean<IUser>();
    if (!user) throw new Error("User not found in this organization");

    const enforcer = await getCasbinEnforcer();
    const userIdStr = user._id.toString();

    const existingRoles = (await enforcer.getGroupingPolicy()).filter(
      r => r[0] === userIdStr && r[2] === organizationId
    );

    if (existingRoles.length > 0) {
      await enforcer.removeGroupingPolicies(existingRoles);
      // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
      // ✅ In-memory enforcer cache is automatically updated (no reset needed)
    }

    await User.updateOne(
      { _id: userId },
      {
        role: "",
        roleName: "",
        roleId: null,
      }
    );

    await redisService.deleteCache(`user:${userId}`).catch(() => {});
    await redisService
      .deleteCacheByPattern(`assign-role:users:${organizationId}:*`)
      .catch(() => {});

    return User.findById(userId).lean();
  }
}

export const assignRoleService = new AssignRoleService();
