// apps/api/src/services/organization.service.ts

import mongoose from "mongoose";
import { Organization, IOrganization } from "../models/organization.model";
import {
  OrganizationType,
  PortalType,
} from "../../../../packages/shared/src/types/index.ts";
import { getCasbinEnforcer } from "../config/casbin";
import { Role } from "../models/role.model";
import { getDefaultRolesForOrganization } from "./default-roles.service";
import { PERMISSION_TO_CASBIN } from "../../../../packages/casbin-config/src/permission-casbin.map";
import { logger } from "../config/logger";
import { redisService } from "./redis.service";

export class OrganizationService {
  async createOrganization(data: {
    name: string;
    type: OrganizationType;
    portalType: PortalType;
    metadata?: Record<string, any>;
    invitedBy?: "admin" | "tech" | "customer";
    invitedByOrganizationId?: string;
  }) {
    const organizationData: any = {
      name: data.name,
      type: data.type,
      portalType: data.portalType,
      metadata: data.metadata,
    };

    // -----------------------------
    // Vendor invitation handling
    // -----------------------------
    if (data.type === OrganizationType.VENDOR) {
      if (data.invitedBy === "admin" || data.invitedBy === "tech") {
        organizationData.invitedBy = data.invitedBy;
        organizationData.isAdminInvited = true;
        organizationData.visibleToCustomerIds = [];
      } else if (
        data.invitedBy === "customer" &&
        data.invitedByOrganizationId
      ) {
        organizationData.invitedBy = "customer";
        organizationData.invitedByOrganizationId = new mongoose.Types.ObjectId(
          data.invitedByOrganizationId
        );
        organizationData.isAdminInvited = false;
        organizationData.visibleToCustomerIds = [
          new mongoose.Types.ObjectId(data.invitedByOrganizationId),
        ];
      }
    }

    // -----------------------------
    // Save organization
    // -----------------------------
    const organization = new Organization(organizationData);
    await organization.save();

    // =====================================================
    // ✅ CASBIN ORG SCOPE (g2) — SAME ORG ONLY
    // =====================================================
    const enforcer = await getCasbinEnforcer();

    /**
     * This satisfies:
     * g2(r.org, p.org, "*")
     *
     * r.org === p.org ONLY
     * No cross-organization access possible
     */
    await enforcer.addNamedGroupingPolicy(
      "g2",
      organization._id.toString(), // r.org
      organization._id.toString(), // p.org (IMPORTANT: SAME ORG)
      "*"
    );

    // ✅ AutoSave enabled - no need for manual savePolicy()
    // Policies are automatically persisted to MongoDB

    logger.info(
      "✅ Casbin g2 (same-org scope) added for org:",
      organization._id.toString()
    );
    // =====================================================

    // =====================================================
    // ✅ CREATE DEFAULT ROLES FOR ORGANIZATION
    // =====================================================
    try {
      const defaultRoles = getDefaultRolesForOrganization(data.type, data.portalType);
      const orgIdStr = organization._id.toString();
      const casbinPortal = `${data.portalType}_portal`;

      logger.info(`Creating ${defaultRoles.length} default roles for organization ${orgIdStr}`);

      for (const roleDef of defaultRoles) {
        // Create role in MongoDB
        const role = await Role.create({
          name: roleDef.name,
          key: roleDef.key,
          portalType: roleDef.portalType,
          permissions: roleDef.permissions,
          organizationId: organization._id,
          description: roleDef.description,
          isSystem: false, // These are organization-specific, not system roles
        });

        logger.info(`✅ Created default role: ${role.key} for org ${orgIdStr}`);

        // Create Casbin role hierarchy policy (g4)
        await enforcer.addNamedGroupingPolicy(
          "g4",
          role.key,
          role.key,
          casbinPortal
        );

        // Create Casbin permission policies (p)
        if (roleDef.permissions.length > 0) {
          const policies = roleDef.permissions
            .map((perm) => {
              const mapped = PERMISSION_TO_CASBIN[perm];
              if (!mapped) {
                logger.warn(`Permission ${perm} not mapped to Casbin, skipping`);
                return null;
              }

              return [
                role.key,           // sub (role key)
                mapped.obj,         // obj (resource)
                mapped.act,         // act (action)
                orgIdStr,           // org (organizationId)
                "allow",            // eft (effect)
                casbinPortal,       // portal
                role.key,           // role (role key)
              ];
            })
            .filter(Boolean) as string[][];

          if (policies.length > 0) {
            await enforcer.addPolicies(policies);
            logger.info(`✅ Created ${policies.length} Casbin policies for role ${role.key}`);
          }
        }
      }

      // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
      // ✅ In-memory enforcer cache is automatically updated (no reset needed)

      logger.info(`✅ Successfully created ${defaultRoles.length} default roles for organization ${orgIdStr}`);
    } catch (error: any) {
      logger.error(`❌ Error creating default roles for organization ${organization._id}:`, error);
      // Don't fail organization creation if role creation fails
      // But log the error for debugging
    }
    // =====================================================

    // Clear Redis cache for this organization (roles will be cached)
    try {
      await redisService.deleteCacheByPattern(`assign-role:roles:${organization._id}:*`);
      logger.info('✅ Cleared Redis cache for organization roles');
    } catch (error) {
      logger.warn('⚠️ Failed to clear Redis cache for organization roles', error);
    }

    return organization;
  }

  // ------------------------------------------------------
  // GET ORGANIZATIONS
  // ------------------------------------------------------
  async getOrganizations(
    type?: OrganizationType,
    portalType?: PortalType,
    filters?: {
      isActive?: boolean;
      customerOrganizationId?: string;
      requesterPortalType?: PortalType;
    }
  ) {
    const query: any = {
      type: { $in: [OrganizationType.CUSTOMER, OrganizationType.VENDOR] },
    };

    if (type) query.type = type;
    if (portalType) query.portalType = portalType;
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;

    // Customer → Vendor visibility rules
    if (
      type === OrganizationType.VENDOR &&
      filters?.requesterPortalType === PortalType.CUSTOMER &&
      filters.customerOrganizationId
    ) {
      const customerOrgId = new mongoose.Types.ObjectId(
        filters.customerOrganizationId
      );
      query.$or = [
        { visibleToCustomerIds: customerOrgId },
        { invitedByOrganizationId: customerOrgId },
      ];
    }

    return Organization.find(query)
      .select(
        "name type portalType isActive licenseKey createdAt invitedBy isAdminInvited visibleToCustomerIds invitedByOrganizationId"
      )
      .lean()
      .exec();
  }

  // ------------------------------------------------------
  // GET BY ID
  // ------------------------------------------------------
  async getOrganizationById(orgId: string) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error("Organization not found");
    }
    return organization;
  }

  // ------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------
  async updateOrganization(orgId: string, data: Partial<IOrganization>) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    Object.assign(organization, data);
    await organization.save();
    return organization;
  }

  // ------------------------------------------------------
  // DELETE
  // ------------------------------------------------------
  async deleteOrganization(orgId: string) {
    // 1️⃣ Ensure org exists
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    logger.info(`🗑️ Starting deletion of organization ${orgId}`);

    // 2️⃣ Load Casbin enforcer
    const enforcer = await getCasbinEnforcer();

    // =====================================================
    // 🧹 DELETE CASBIN POLICIES (CRITICAL: DO THIS FIRST)
    // =====================================================

    // Remove g2(org, org, *)
    await enforcer.removeNamedGroupingPolicy(
      "g2",
      orgId,
      orgId,
      "*"
    );
    logger.info(`✅ Removed g2 policies for org ${orgId}`);

    // Remove g(user, role, org) - user-to-role assignments for this org
    await enforcer.removeFilteredNamedGroupingPolicy(
      "g",
      2,      // index of orgId in g(user, role, org)
      orgId
    );
    logger.info(`✅ Removed g policies (user-role assignments) for org ${orgId}`);

    // Remove p(sub, obj, act, org, eft, portal, role) - permission policies for this org
    await enforcer.removeFilteredPolicy(
      3,      // index of orgId in p(sub, obj, act, org, eft, portal, role)
      orgId
    );
    logger.info(`✅ Removed p policies (permissions) for org ${orgId}`);

    // Remove g4(role, role, portal) for roles belonging to this org
    // First, find all roles for this org
    const orgRoles = await Role.find({ organizationId: orgId });
    for (const role of orgRoles) {
      const casbinPortal = `${role.portalType}_portal`;
      await enforcer.removeFilteredNamedGroupingPolicy(
        "g4",
        0,      // index of role.key
        role.key,
        2,      // index of portal
        casbinPortal
      );
    }
    if (orgRoles.length > 0) {
      logger.info(`✅ Removed g4 policies (role hierarchy) for ${orgRoles.length} roles`);
    }

    // ✅ AutoSave enabled - policies are automatically persisted to MongoDB
    // ✅ In-memory enforcer cache is automatically updated (no reset needed)

    // =====================================================
    // 🧹 DELETE USERS (EMPLOYEES) OF THIS ORGANIZATION
    // =====================================================
    const { User } = await import("../models/user.model");
    const { UserProfile } = await import("../models/user-profile.model");

    const users = await User.find({ organizationId: orgId });
    const userIds = users.map(u => u._id.toString());

    // Delete user profiles
    if (userIds.length > 0) {
      await UserProfile.deleteMany({ userId: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) } });
      logger.info(`✅ Deleted ${userIds.length} user profiles`);
    }

    // Delete users
    await User.deleteMany({ organizationId: orgId });
    if (users.length > 0) {
      logger.info(`✅ Deleted ${users.length} users`);
    }

    // =====================================================
    // 🧹 DELETE ROLES OF THIS ORGANIZATION
    // =====================================================
    await Role.deleteMany({ organizationId: orgId });
    if (orgRoles.length > 0) {
      logger.info(`✅ Deleted ${orgRoles.length} roles`);
    }

    // =====================================================
    // 🧹 CLEAR REDIS CACHE
    // =====================================================
    try {
      // Clear user caches
      await redisService.deleteCacheByPattern(`users:${orgId}:*`);
      await redisService.deleteCacheByPattern(`user:*`); // Clear all user caches (safer, but can be optimized)
      
      // Clear role caches
      await redisService.deleteCacheByPattern(`assign-role:roles:${orgId}:*`);
      await redisService.deleteCacheByPattern(`assign-role:users:${orgId}:*`);
      
      // Clear organization caches
      await redisService.deleteCache(`organization:${orgId}`);
      
      logger.info(`✅ Cleared Redis cache for organization ${orgId}`);
    } catch (error: any) {
      logger.warn(`⚠️ Failed to clear Redis cache for organization ${orgId}:`, error);
      // Don't fail deletion if cache clearing fails
    }

    // =====================================================
    // 🧹 DELETE ORGANIZATION FROM DB (FINAL STEP)
    // =====================================================
    await Organization.findByIdAndDelete(orgId);
    logger.info(`✅ Deleted organization ${orgId}`);

    return { success: true };
  }

}

export const organizationService = new OrganizationService();
