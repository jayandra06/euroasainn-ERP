// apps/api/src/services/role.service.ts
import { Role, IRole } from "../models/role.model";
import { PortalType } from "@euroasiann/shared";
import { logger } from "../config/logger";
import { getCasbinEnforcer } from "../config/casbin";

const generateRoleKey = (name: string, portalType: PortalType) => {
  const base = `${portalType}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return base || `${portalType}_role`;
};

// Map UI permissions → Casbin OBJ & ACT
function mapPermissionToCasbin(permission: string) {
  switch (permission) {
    // Admin Users
    case "adminUsersCreate":
      return { obj: "admin_users", act: "create" };
    case "adminUsersUpdate":
      return { obj: "admin_users", act: "update" };
    case "adminUsersDelete":
      return { obj: "admin_users", act: "delete" };
    case "adminUsersView":
      return { obj: "admin_users", act: "view" };

    // Tech Users
    case "techUsersCreate":
      return { obj: "tech_users", act: "create" };
    case "techUsersUpdate":
      return { obj: "tech_users", act: "update" };
    case "techUsersDelete":
      return { obj: "tech_users", act: "delete" };
    case "techUsersView":
      return { obj: "tech_users", act: "view" };

    // Organizations
    case "organizationsCreate":
      return { obj: "organizations", act: "create" };
    case "organizationsUpdate":
      return { obj: "organizations", act: "update" };
    case "organizationsDelete":
      return { obj: "organizations", act: "delete" };
    case "organizationsView":
      return { obj: "organizations", act: "view" };

    // Licenses
    case "licensesView":
      return { obj: "licenses", act: "view" };
    case "licensesIssue":
      return { obj: "licenses", act: "issue" };
    case "licensesRevoke":
      return { obj: "licenses", act: "revoke" };

    // Backward-compat (if any old role used this)
    case "licensesFullControl":
      return { obj: "licenses", act: "full_control" };

    // Onboarding
    case "onboardingView":
      return { obj: "onboarding", act: "view" };
    case "onboardingManage":
      return { obj: "onboarding", act: "manage" };

    // System
    case "systemLogsView":
      return { obj: "system_logs", act: "view" };
    case "systemConfigManage":
      return { obj: "system_config", act: "manage" };
    case "systemStatusView":
      return { obj: "system_status", act: "view" };

    // Roles management (if you use it)
    case "manageRoles":
      return { obj: "roles", act: "manage" };

    default:
      logger.warn(`Unknown permission: ${permission}`);
      return null;
  }
}

function portalTypeToCasbinPortal(portal: string) {
  return `${portal}_portal`;
}

class RoleService {
  async listRoles(filter: { portalType?: PortalType } = {}) {
    const query: Record<string, any> = {};
    if (filter.portalType) query.portalType = filter.portalType;

    return Role.find(query).sort({ isSystem: -1, name: 1 });
  }

  async createRole(data: {
    name: string;
    portalType: PortalType;
    permissions?: string[];
    description?: string;
  }): Promise<IRole> {
    const permissions = data.permissions || [];
    const name = data.name.trim();
    const normalizedPortal = data.portalType;

    if (!name) throw new Error("Role name is required");

    const existing = await Role.findOne({ name, portalType: normalizedPortal });
    if (existing) throw new Error("Role already exists");

    // Generate unique key
    let keyBase = generateRoleKey(name, normalizedPortal);
    let key = keyBase;
    let counter = 1;

    while (await Role.exists({ key })) {
      key = `${keyBase}_${counter++}`;
    }

    const role = new Role({
      name,
      key,
      portalType: normalizedPortal,
      permissions,
      description: data.description || "",
      isSystem: false,
    });

    await role.save();

    // ============= CASBIN ADD POLICIES =============
    const enforcer = await getCasbinEnforcer();
    const casbinPortal = portalTypeToCasbinPortal(normalizedPortal);

    // 1️⃣ Add g() hierarchy (ORG = "*")
    await enforcer.addGroupingPolicy(role.key, role.key, "*");

    // 2️⃣ Add g4() hierarchy (role → role inside portal)
    await enforcer.addNamedGroupingPolicy("g4", role.key, role.key, casbinPortal);

    // 3️⃣ Add permission policies
    for (const p of permissions) {
      const mapped = mapPermissionToCasbin(p);
      if (!mapped) continue;

      await enforcer.addPolicy(
        role.key,       // sub
        mapped.obj,     // obj
        mapped.act,     // act
        "*",            // org
        "allow",        // eft
        casbinPortal,   // portal
        role.key        // role
      );
    }

    await enforcer.savePolicy();

    return role;
  }

  async updateRole(roleId: string, data: Partial<IRole>) {
    const role = await Role.findById(roleId);
    if (!role) throw new Error("Role not found");

    const enforcer = await getCasbinEnforcer();
    const casbinPortal = portalTypeToCasbinPortal(role.portalType);

    if (data.name) role.name = data.name.trim();
    if (data.description !== undefined) role.description = data.description;

    if (data.permissions) {
      const perms = data.permissions.map((p) => p.trim());
      role.permissions = perms;

      // Remove old policies for this role
      await enforcer.removeFilteredPolicy(0, role.key);

      // Add new policies
      for (const p of perms) {
        const mapped = mapPermissionToCasbin(p);
        if (!mapped) continue;

        await enforcer.addPolicy(
          role.key,        // sub
          mapped.obj,      // obj
          mapped.act,      // act
          "*",             // org
          "allow",         // eft
          casbinPortal,    // portal
          role.key         // role
        );
      }

      await enforcer.savePolicy();
    }

    await role.save();
    return role;
  }

  async deleteRole(roleId: string) {
    const role = await Role.findById(roleId);
    if (!role) throw new Error("Role not found");

    const enforcer = await getCasbinEnforcer();

    await enforcer.removeFilteredPolicy(0, role.key);
    await enforcer.removeFilteredGroupingPolicy(0, role.key);
    await enforcer.removeFilteredNamedGroupingPolicy("g4", 0, role.key);

    await enforcer.savePolicy();
    await Role.findByIdAndDelete(roleId);

    return true;
  }
}

export const roleService = new RoleService();
