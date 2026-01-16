export async function seedDefaultPolicies(enforcer) {
    console.log("\n========== CASBIN SEED START ==========");
    // 🔧 TEMP ORG (already created before Casbin)
    const TEMP_ORG_ID = "690daa40032014576096ab6b";
    // =========================================================================
    // 0️⃣ ORGANIZATION SCOPE (g2) — SAME ORG ONLY
    // =========================================================================
    console.log("🏢 Seeding organization scope (g2)");
    // Org can access ONLY itself
    await enforcer.addNamedGroupingPolicy("g2", TEMP_ORG_ID, // r.org
    TEMP_ORG_ID, // p.org
    "*");
    // =========================================================================
    // 1️⃣ PORTAL HIERARCHY (g3)
    // =========================================================================
    console.log("🌐 Seeding portal hierarchy (g3)");
    await enforcer.addNamedGroupingPolicy("g3", "tech_portal", "admin_portal", "*");
    await enforcer.addNamedGroupingPolicy("g3", "admin_portal", "customer_portal", "*");
    await enforcer.addNamedGroupingPolicy("g3", "admin_portal", "vendor_portal", "*");
    // =========================================================================
    // 2️⃣ ROLE HIERARCHY WITHIN TECH PORTAL (g4)
    // =========================================================================
    console.log("🧩 Seeding tech role hierarchy (g4)");
    await enforcer.addNamedGroupingPolicy("g4", "tech_admin", "tech_manager", "tech_portal");
    await enforcer.addNamedGroupingPolicy("g4", "tech_manager", "tech_developer", "tech_portal");
    await enforcer.addNamedGroupingPolicy("g4", "tech_developer", "tech_support", "tech_portal");
    // =========================================================================
    // Helper — IMPORTANT CHANGE (org is NOT "*")
    // =========================================================================
    function addPolicy(role, obj, act, portal) {
        return enforcer.addPolicy(role, obj, act, TEMP_ORG_ID, // ✅ SAME ORG ONLY (checked via g2)
        "allow", portal, role);
    }
    // =========================================================================
    // 3️⃣ TECH ADMIN
    // =========================================================================
    console.log("👑 Seeding TECH ADMIN policies");
    await addPolicy("tech_admin", "admin_users", "create", "tech_portal");
    await addPolicy("tech_admin", "admin_users", "update", "tech_portal");
    await addPolicy("tech_admin", "admin_users", "delete", "tech_portal");
    await addPolicy("tech_admin", "admin_users", "view", "tech_portal");
    await addPolicy("tech_admin", "tech_users", "create", "tech_portal");
    await addPolicy("tech_admin", "tech_users", "update", "tech_portal");
    await addPolicy("tech_admin", "tech_users", "delete", "tech_portal");
    await addPolicy("tech_admin", "tech_users", "view", "tech_portal");
    await addPolicy("tech_admin", "organizations", "create", "tech_portal");
    await addPolicy("tech_admin", "organizations", "update", "tech_portal");
    await addPolicy("tech_admin", "organizations", "delete", "tech_portal");
    await addPolicy("tech_admin", "organizations", "view", "tech_portal");
    await addPolicy("tech_admin", "licenses", "view", "tech_portal");
    await addPolicy("tech_admin", "licenses", "issue", "tech_portal");
    await addPolicy("tech_admin", "licenses", "revoke", "tech_portal");
    await addPolicy("tech_admin", "licenses", "full_control", "tech_portal");
    await addPolicy("tech_admin", "onboarding", "view", "tech_portal");
    await addPolicy("tech_admin", "onboarding", "manage", "tech_portal");
    await addPolicy("tech_admin", "system_config", "manage", "tech_portal");
    // =========================================================================
    // 4️⃣ TECH MANAGER (DENY still SAME ORG)
    // =========================================================================
    console.log("🧑‍💼 Seeding TECH MANAGER policies");
    await addPolicy("tech_manager", "admin_users", "create", "tech_portal");
    await addPolicy("tech_manager", "admin_users", "update", "tech_portal");
    await addPolicy("tech_manager", "admin_users", "view", "tech_portal");
    await enforcer.addPolicy("tech_manager", "tech_users", "create", TEMP_ORG_ID, "deny", "tech_portal", "tech_manager");
    await addPolicy("tech_manager", "licenses", "view", "tech_portal");
    await addPolicy("tech_manager", "licenses", "issue", "tech_portal");
    await addPolicy("tech_manager", "licenses", "revoke", "tech_portal");
    await addPolicy("tech_manager", "organizations", "view", "tech_portal");
    await addPolicy("tech_manager", "onboarding", "view", "tech_portal");
    // =========================================================================
    // 5️⃣ TECH DEVELOPER
    // =========================================================================
    console.log("👨‍💻 Seeding TECH DEVELOPER policies");
    await addPolicy("tech_developer", "licenses", "view", "tech_portal");
    await addPolicy("tech_developer", "system_logs", "view", "tech_portal");
    await addPolicy("tech_developer", "organizations", "view", "tech_portal");
    await addPolicy("tech_developer", "onboarding", "view", "tech_portal");
    // =========================================================================
    // 6️⃣ TECH SUPPORT
    // =========================================================================
    console.log("🎧 Seeding TECH SUPPORT policies");
    await addPolicy("tech_support", "system_status", "view", "tech_portal");
    await addPolicy("tech_support", "organizations", "view", "tech_portal");
    // =========================================================================
    // 7️⃣ TECH CTO
    // =========================================================================
    console.log("🧠 Seeding TECH CTO policies");
    await addPolicy("tech_cto", "tech_users", "view", "tech_portal");
    console.log("========== CASBIN SEED END ==========\n");
}
//# sourceMappingURL=seed-policies.js.map