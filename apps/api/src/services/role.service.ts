import mongoose from "mongoose";
import { Role, IRole } from "../models/role.model";
import { PortalType } from "@euroasiann/shared";
import { logger } from "../config/logger";
import { getCasbinEnforcer } from "../config/casbin";
import { PERMISSION_TO_CASBIN } from
  "../../../../packages/casbin-config/src/permission-casbin.map";
import { redisService } from "./redis.service";

/* =========================
   HELPERS
========================= */

const generateRoleKey = (name: string, portalType: PortalType) => {
  const base = `${portalType}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || `${portalType}_role`;
};

const portalTypeToCasbinPortal = (portal: string) =>
  `${portal}_portal`;

/* =========================
   SERVICE
========================= */

class RoleService {

  async listRoles(filter: {
    portalType?: PortalType;
    organizationId: string;
  }) {
    const orgId = new mongoose.Types.ObjectId(filter.organizationId);
    
    // Build query: ONLY roles that belong to this specific organization
    // Each organization should only see their own roles, not roles from other organizations
    const query: any = {
      organizationId: orgId,
    };

    // Add portal type filter - ensures roles match the portal type
    // This ensures roles are filtered by both organization AND portal type
    if (filter.portalType) {
      query.portalType = filter.portalType;
    }

    return Role.find(query)
      .sort({ isSystem: -1, name: 1 })
      .lean();
  }

  /* ---------- CREATE ROLE ---------- */

  async createRole(data: {
    name: string;
    portalType: PortalType;
    permissions?: string[];
    description?: string;
    organizationId: string;
  }) {
    const {
      name,
      portalType,
      permissions = [],
      description,
      organizationId,
    } = data;

    const orgId = new mongoose.Types.ObjectId(organizationId);

    const existing = await Role.findOne({
      name: name.trim(),
      portalType,
      organizationId: orgId,
    });

    if (existing) {
      throw new Error("Role with this name already exists");
    }

    const baseKey = generateRoleKey(name, portalType);
    let key = baseKey;
    let counter = 1;

    while (await Role.exists({ key, organizationId: orgId })) {
      key = `${baseKey}_${counter++}`;
    }

    const role = await Role.create({
      name: name.trim(),
      key,
      portalType,
      permissions,
      organizationId: orgId,
      description: description?.trim() || "",
      isSystem: false,
    });

    const enforcer = await getCasbinEnforcer();
    const casbinPortal = portalTypeToCasbinPortal(portalType);

    await enforcer.addNamedGroupingPolicy(
      "g4",
      role.key,
      role.key,
      casbinPortal
    );

    if (permissions.length > 0) {
      const policies = permissions
        .map((perm) => {
          const mapped = PERMISSION_TO_CASBIN[perm];
          if (!mapped) return null;

          return [
            role.key,
            mapped.obj,
            mapped.act,
            organizationId,
            "allow",
            casbinPortal,
            role.key,
          ];
        })
        .filter(Boolean) as string[][];

      await enforcer.addPolicies(policies);
      // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
      // ✅ In-memory enforcer cache is automatically updated (no reset needed)
    }

    // Clear Redis cache for this organization's roles
    try {
      await redisService.deleteCacheByPattern(`assign-role:roles:${organizationId}:*`);
      logger.info(`✅ Cleared Redis cache for organization roles after role creation`);
    } catch (error: any) {
      logger.warn(`⚠️ Failed to clear Redis cache for organization roles:`, error);
      // Don't fail role creation if cache clearing fails
    }

    logger.info(`✅ Role created: ${role.key}`);
    return role;
  }

  /* ---------- UPDATE ROLE ---------- */

  async updateRole(roleId: string, data: Partial<IRole>, organizationId: string) {
    const role = await Role.findOne({ _id: roleId, organizationId });
    if (!role) throw new Error("Role not found in this organization");
    if (role.isSystem) throw new Error("Cannot update system roles");

    const enforcer = await getCasbinEnforcer();
    const casbinPortal = portalTypeToCasbinPortal(role.portalType);
    const orgIdStr = role.organizationId!.toString();

    if (data.permissions) {
      role.permissions = data.permissions;

      const allPolicies = await enforcer.getPolicy();
      const oldPolicies = allPolicies.filter(
        (p) => p[0] === role.key && p[3] === orgIdStr
      );

      if (oldPolicies.length > 0) {
        await enforcer.removePolicies(oldPolicies);
      }

      const newPolicies = role.permissions
        .map((perm) => {
          const mapped = PERMISSION_TO_CASBIN[perm];
          if (!mapped) return null;

          return [
            role.key,
            mapped.obj,
            mapped.act,
            orgIdStr,
            "allow",
            casbinPortal,
            role.key,
          ];
        })
        .filter(Boolean) as string[][];

      if (newPolicies.length > 0) {
        await enforcer.addPolicies(newPolicies);
      }

      // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
      // ✅ In-memory enforcer cache is automatically updated (no reset needed)
    }

    // Update other fields if provided
    if (data.name) role.name = data.name;
    if (data.description !== undefined) role.description = data.description;

    await role.save();

    // Clear Redis cache for this organization's roles and users
    try {
      await redisService.deleteCacheByPattern(`assign-role:roles:${orgIdStr}:*`);
      await redisService.deleteCacheByPattern(`assign-role:users:${orgIdStr}:*`);
      // Clear user caches that might have cached role info
      await redisService.deleteCacheByPattern(`user:*`);
      logger.info(`✅ Cleared Redis cache for organization roles/users after role update`);
    } catch (error: any) {
      logger.warn(`⚠️ Failed to clear Redis cache for organization roles/users:`, error);
      // Don't fail role update if cache clearing fails
    }

    return role;
  }

  async deleteRole(roleId: string, organizationId: string) {
    const role = await Role.findOne({ _id: roleId, organizationId });
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");

    const enforcer = await getCasbinEnforcer();

    const allPolicies = await enforcer.getPolicy();
    const oldPolicies = allPolicies.filter(
      (p) => p[0] === role.key && p[3] === organizationId
    );

    if (oldPolicies.length > 0) {
      await enforcer.removePolicies(oldPolicies);
    }

    await enforcer.removeFilteredNamedGroupingPolicy("g4", 0, role.key);
    // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
    // ✅ In-memory enforcer cache is automatically updated (no reset needed)

    await Role.findByIdAndDelete(roleId);

    // Clear Redis cache for this organization's roles and users
    try {
      await redisService.deleteCacheByPattern(`assign-role:roles:${organizationId}:*`);
      await redisService.deleteCacheByPattern(`assign-role:users:${organizationId}:*`);
      // Clear user caches that might have cached role info
      await redisService.deleteCacheByPattern(`user:*`);
      logger.info(`✅ Cleared Redis cache for organization roles/users after role deletion`);
    } catch (error: any) {
      logger.warn(`⚠️ Failed to clear Redis cache for organization roles/users:`, error);
      // Don't fail role deletion if cache clearing fails
    }

    logger.info(`✅ Role deleted fully: ${role.key}`);
    return true;
  }
}

export const roleService = new RoleService();
