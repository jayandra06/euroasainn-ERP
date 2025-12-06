// apps/api/src/services/assign-role.service.ts
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { Role } from "../models/role.model";
import { getCasbinEnforcer } from "../config/casbin";

class AssignRoleService {
  async listUsers(portalType: string) {
    const query: any = {};
    if (portalType !== "all") query.portalType = portalType;

    return User.find(query)
      .select("firstName lastName email portalType role roleName roleId")
      .lean();
  }

  async listRoles(portalType: string) {
    const query: any = {};
    if (portalType !== "all") query.portalType = portalType;

    return Role.find(query)
      .select("name key portalType permissions")
      .lean();
  }

  /**
   * Assign a role to a user (with correct Casbin g4 portal-scoped RBAC)
   */
  async assignRole(userId: string, roleId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new Error("Invalid userId");
    if (!mongoose.Types.ObjectId.isValid(roleId))
      throw new Error("Invalid roleId");

    const role = await Role.findById(roleId);
    const user = await User.findById(userId);

    if (!role) throw new Error("Role not found");
    if (!user) throw new Error("User not found");

    if (user.portalType !== role.portalType) {
      throw new Error(
        `User portal (${user.portalType}) does not match role portal (${role.portalType})`
      );
    }

    const portal = `${role.portalType}_portal`; // e.g. "tech_portal"
    const enforcer = await getCasbinEnforcer();

    const userIdStr = user._id.toString();

    // ===================== CLEAN OLD POLICIES =====================
    await enforcer.removeFilteredGroupingPolicy(0, userIdStr); // g: user ↛ role
    await enforcer.removeFilteredNamedGroupingPolicy("g4", 0, userIdStr); // g4: user ↛ role ↛ portal

    // ===================== ADD NEW POLICIES =====================
    // g: user → role → "*"  (3 fields required)
    await enforcer.addGroupingPolicy(userIdStr, role.key, "*");

    // g4: user → role → portal  (3 fields required)
    await enforcer.addNamedGroupingPolicy("g4", userIdStr, role.key, portal);

    await enforcer.savePolicy();

    // ===================== UPDATE USER DOCUMENT =====================
    user.role = role.key;
    user.roleName = role.name;
    user.roleId = role._id;

    await user.save();

    return user;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId))
      throw new Error("Invalid userId");

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const enforcer = await getCasbinEnforcer();
    const userIdStr = user._id.toString();

    // Remove Casbin links
    await enforcer.removeFilteredGroupingPolicy(0, userIdStr);
    await enforcer.removeFilteredNamedGroupingPolicy("g4", 0, userIdStr);
    await enforcer.savePolicy();

    // Remove from Mongo user doc
    user.role = "";
    user.roleName = "";
    user.roleId = null;

    await user.save();

    return user;
  }
}

export const assignRoleService = new AssignRoleService();
