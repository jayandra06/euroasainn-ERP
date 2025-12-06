// packages/casbin-config/src/seed-policies.ts
import { Enforcer } from "casbin";

/**
 * Seed default CASBIN policies for the platform
 * This function should be called during application startup
 */
export async function seedDefaultPolicies(enforcer: Enforcer) {
  // =========================================================================
  // 1️⃣ PORTAL HIERARCHY (g3)
  // =========================================================================
  // tech_portal → admin_portal
  await enforcer.addNamedGroupingPolicy("g3", "tech_portal", "admin_portal", "*");

  // admin_portal → customer_portal
  await enforcer.addNamedGroupingPolicy("g3", "admin_portal", "customer_portal", "*");

  // admin_portal → vendor_portal
  await enforcer.addNamedGroupingPolicy("g3", "admin_portal", "vendor_portal", "*");

  // =========================================================================
  // 2️⃣ ROLE HIERARCHY WITHIN TECH PORTAL (g4)
  // =========================================================================
  await enforcer.addNamedGroupingPolicy("g4", "tech_admin", "tech_manager", "tech_portal");
  await enforcer.addNamedGroupingPolicy("g4", "tech_manager", "tech_developer", "tech_portal");
  await enforcer.addNamedGroupingPolicy("g4", "tech_developer", "tech_support", "tech_portal");

  // =========================================================================
  // Helper to add correct P-policy format
  // p: sub, obj, act, org, eft, portal, role
  // r: sub, obj, act, org, portal, role
  // =========================================================================
  function addPolicy(role: string, obj: string, act: string, portal: string) {
    return enforcer.addPolicy(
      role,   // p.sub
      obj,    // p.obj
      act,    // p.act
      "*",    // p.org
      "allow",// p.eft
      portal, // p.portal
      role    // p.role
    );
  }

  // =========================================================================
  // 3️⃣ TECH ADMIN – FULL ACCESS (matches PERMISSIONS + extra)
  // =========================================================================
  // Admin Users
  await addPolicy("tech_admin", "admin_users", "create", "tech_portal");
  await addPolicy("tech_admin", "admin_users", "update", "tech_portal");
  await addPolicy("tech_admin", "admin_users", "delete", "tech_portal");
  await addPolicy("tech_admin", "admin_users", "view", "tech_portal");

  // Tech Users
  await addPolicy("tech_admin", "tech_users", "create", "tech_portal");
  await addPolicy("tech_admin", "tech_users", "update", "tech_portal");
  await addPolicy("tech_admin", "tech_users", "delete", "tech_portal");
  await addPolicy("tech_admin", "tech_users", "view", "tech_portal");

  // Organizations
  await addPolicy("tech_admin", "organizations", "create", "tech_portal");
  await addPolicy("tech_admin", "organizations", "update", "tech_portal");
  await addPolicy("tech_admin", "organizations", "delete", "tech_portal");
  await addPolicy("tech_admin", "organizations", "view", "tech_portal");

  // Licenses
  await addPolicy("tech_admin", "licenses", "view", "tech_portal");
  await addPolicy("tech_admin", "licenses", "issue", "tech_portal");
  await addPolicy("tech_admin", "licenses", "revoke", "tech_portal");
  // Optional: keep full_control for future use
  await addPolicy("tech_admin", "licenses", "full_control", "tech_portal");

  // Onboarding
  await addPolicy("tech_admin", "onboarding", "view", "tech_portal");
  await addPolicy("tech_admin", "onboarding", "manage", "tech_portal");

  // System config
  await addPolicy("tech_admin", "system_config", "manage", "tech_portal");

  // =========================================================================
  // 4️⃣ TECH MANAGER – LIMITED ACCESS
  // =========================================================================
  // Admin Users
  await addPolicy("tech_manager", "admin_users", "create", "tech_portal");
  await addPolicy("tech_manager", "admin_users", "update", "tech_portal");
  await addPolicy("tech_manager", "admin_users", "view", "tech_portal");

  // Deny tech user creation
  await enforcer.addPolicy(
    "tech_manager",
    "tech_users",
    "create",
    "*",
    "deny",
    "tech_portal",
    "tech_manager"
  );

  // Licenses
  await addPolicy("tech_manager", "licenses", "view", "tech_portal");
  await addPolicy("tech_manager", "licenses", "issue", "tech_portal");
  await addPolicy("tech_manager", "licenses", "revoke", "tech_portal");

  // Organizations
  await addPolicy("tech_manager", "organizations", "view", "tech_portal");

  // Onboarding
  await addPolicy("tech_manager", "onboarding", "view", "tech_portal");

  // =========================================================================
  // 5️⃣ TECH DEVELOPER – READ-ONLY-ish
  // =========================================================================
  await enforcer.addPolicy(
    "tech_developer",
    "admin_users",
    "create",
    "*",
    "deny",
    "tech_portal",
    "tech_developer"
  );

  await enforcer.addPolicy(
    "tech_developer",
    "tech_users",
    "create",
    "*",
    "deny",
    "tech_portal",
    "tech_developer"
  );

  await addPolicy("tech_developer", "licenses", "view", "tech_portal");
  await addPolicy("tech_developer", "system_logs", "view", "tech_portal");
  await addPolicy("tech_developer", "organizations", "view", "tech_portal");
  await addPolicy("tech_developer", "onboarding", "view", "tech_portal");

  // =========================================================================
  // 6️⃣ TECH SUPPORT – MINIMAL ACCESS
  // =========================================================================
  await enforcer.addPolicy(
    "tech_support",
    "admin_users",
    "create",
    "*",
    "deny",
    "tech_portal",
    "tech_support"
  );
  await enforcer.addPolicy(
    "tech_support",
    "tech_users",
    "create",
    "*",
    "deny",
    "tech_portal",
    "tech_support"
  );

  await addPolicy("tech_support", "system_status", "view", "tech_portal");
  await addPolicy("tech_support", "organizations", "view", "tech_portal");

  // =========================================================================
  // 7️⃣ TECH CTO – VIEW ONLY (what you tested)
  // =========================================================================
  await addPolicy("tech_cto", "tech_users", "view", "tech_portal");
  // (If later you want CTO to view organizations/onboarding, just add:
  // await addPolicy("tech_cto", "organizations", "view", "tech_portal");
  // await addPolicy("tech_cto", "onboarding", "view", "tech_portal");
  // )

  // =========================================================================
  // 8️⃣ ADMIN PORTAL
  // =========================================================================
  // admin_superuser cannot create/update/delete tech users
  await enforcer.addPolicy(
    "admin_superuser",
    "tech_users",
    "create",
    "*",
    "deny",
    "admin_portal",
    "admin_superuser"
  );
  await enforcer.addPolicy(
    "admin_superuser",
    "tech_users",
    "update",
    "*",
    "deny",
    "admin_portal",
    "admin_superuser"
  );
  await enforcer.addPolicy(
    "admin_superuser",
    "tech_users",
    "delete",
    "*",
    "deny",
    "admin_portal",
    "admin_superuser"
  );

  await addPolicy("admin_superuser", "admin_users", "create", "admin_portal");
  await addPolicy("admin_superuser", "customer_orgs", "manage", "admin_portal");
  await addPolicy("admin_superuser", "vendor_orgs", "manage", "admin_portal");

  await addPolicy("admin_superuser", "licenses", "issue", "admin_portal");
  await addPolicy("admin_superuser", "licenses", "revoke", "admin_portal");

  // =========================================================================
  // 9️⃣ CUSTOMER PORTAL
  // =========================================================================
  await addPolicy("customer_admin", "rfq", "manage", "customer_portal");
  await addPolicy("customer_admin", "vessels", "manage", "customer_portal");
  await addPolicy("customer_admin", "employees", "manage", "customer_portal");

  await addPolicy("customer_user", "rfq", "view", "customer_portal");
  await addPolicy("customer_user", "vessels", "view", "customer_portal");

  // =========================================================================
  // 🔟 VENDOR PORTAL
  // =========================================================================
  await addPolicy("vendor_admin", "catalogue", "manage", "vendor_portal");
  await addPolicy("vendor_admin", "inventory", "manage", "vendor_portal");
  await addPolicy("vendor_admin", "quotation", "manage", "vendor_portal");

  await addPolicy("vendor_user", "catalogue", "view", "vendor_portal");
  await addPolicy("vendor_user", "quotation", "view", "vendor_portal");

  console.log("✅ Default CASBIN policies seeded");
}
