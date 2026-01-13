import { newEnforcer } from "casbin";
import { MongoAdapter } from "casbin-mongodb-adapter";
import { logger } from "./logger";
import { config } from "./environment";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let enforcerInstance: any = null;

/* =====================================================
   🔥 RESET CACHED CASBIN ENFORCER
===================================================== */
export function resetCasbinEnforcer() {
  enforcerInstance = null;
  console.log("♻️ Casbin enforcer cache cleared");
}

/* =========================
   🔧 AUTO MIGRATION
========================= */
async function migratePolicies(enforcer: any) {
  console.log("\n🛠️ Casbin migration check started...");

  const policies = await enforcer.getPolicy();
  console.log(`📦 Total policies loaded (before migration): ${policies.length}`);

  let migrated = 0;

  for (const p of policies) {
    if (p.length === 6) {
      const [sub, obj, act, org, eft, portal] = p;

      await enforcer.removePolicy(...p);

      await enforcer.addPolicy(
        sub,
        obj,
        act,
        org,
        eft,
        portal,
        sub // role = sub
      );

      migrated++;
    }
  }

  if (migrated > 0) {
    await enforcer.savePolicy();
    console.log(`🧹 Migration completed. Migrated ${migrated} policies`);
  } else {
    console.log("✅ No migration needed");
  }
}

/* =========================
   HELPER: Log Policy Counts
========================= */
async function logPolicyCounts(enforcer: any) {
  try {
    const policies = await enforcer.getPolicy();
    const gPolicies = await enforcer.getNamedGroupingPolicy("g");
    const g2Policies = await enforcer.getNamedGroupingPolicy("g2");
    const g3Policies = await enforcer.getNamedGroupingPolicy("g3");
    const g4Policies = await enforcer.getNamedGroupingPolicy("g4");
    
    // Also get ALL grouping policies (default "g" without named)
    const allGroupingPolicies = await enforcer.getGroupingPolicy();
    
    console.log(`\n📊 CASBIN POLICY COUNTS:`);
    console.log(`  📜 Policies (p) - Role PERMISSION policies: ${policies.length} ⚠️ This won't change when creating users!`);
    console.log(`  🔗 DEFAULT g (user → role → org) - USER GROUPING: ${allGroupingPolicies.length} ✅ WATCH THIS!`);
    if (gPolicies.length > 0) {
      console.log(`  🔗 Named "g" policies: ${gPolicies.length}`);
    }
    console.log(`  🔗 g2 (org scope): ${g2Policies.length}`);
    console.log(`  🔗 g3 (portal hierarchy): ${g3Policies.length}`);
    console.log(`  🔗 g4 (role hierarchy): ${g4Policies.length}`);
    console.log(`  📈 Total grouping policies (g + g2 + g3 + g4): ${allGroupingPolicies.length + g2Policies.length + g3Policies.length + g4Policies.length}`);
    console.log(`  📈 Grand Total (p + all grouping): ${policies.length + allGroupingPolicies.length + g2Policies.length + g3Policies.length + g4Policies.length}`);
    console.log(`\n  💡 IMPORTANT: When you create users, watch "DEFAULT g (user → role → org)" count increase!`);
    console.log(`  💡 The "Policies (p)" count is for role permissions and won't change with user creation.\n`);
  } catch (error: any) {
    console.error(`❌ Error logging policy counts:`, error);
  }
}

/* =========================
   ENFORCER
========================= */
export async function getCasbinEnforcer() {
  if (enforcerInstance) {
    console.log("♻️ Using cached Casbin Enforcer instance");
    // Log current policy counts when using cached instance
    await logPolicyCounts(enforcerInstance);
    return enforcerInstance;
  }

  try {
    console.log("\n========== CASBIN INIT START ==========");

    /* 1️⃣ LOAD MODEL */
    let modelPath = join(
      __dirname,
      "../../../../packages/casbin-config/src/model.conf"
    );

    try {
      readFileSync(modelPath, "utf-8");
      console.log("📄 Casbin model loaded:", modelPath);
    } catch {
      modelPath = join(process.cwd(), "packages/casbin-config/src/model.conf");
      console.log("📄 Casbin model fallback:", modelPath);
    }

    /* 2️⃣ MONGO ADAPTER */
    const uriObj = new URL(config.mongoUri);
    const dbName = uriObj.pathname?.replace("/", "") || "casbin";

    console.log("🗄️ Casbin MongoDB:", { dbName });

    const adapter = await MongoAdapter.newAdapter({
      uri: config.mongoUri,
      database: dbName,
      collection: "casbin_rule",
    });

    console.log("✅ Casbin Mongo adapter ready");

    /* 3️⃣ CREATE ENFORCER */
    enforcerInstance = await newEnforcer(modelPath, adapter);
    console.log("✅ Casbin enforcer created");

    /* 3.5️⃣ ENABLE AUTO-SAVE (Auto-persist to MongoDB without manual savePolicy) */
    enforcerInstance.enableAutoSave(true);
    console.log("✅ Casbin AutoSave enabled - policies will auto-persist to MongoDB");

    /* 4️⃣ LOAD POLICIES */
    await enforcerInstance.loadPolicy();
    console.log("📥 Casbin policies loaded from DB");

    /* 🔍 PRINT POLICIES (p) */
    const policies = await enforcerInstance.getPolicy();
    console.log(`\n📜 POLICIES (p): ${policies.length} total`);
    // Uncomment to see all policies
    // policies.forEach((p: string[], i: number) => {
    //   console.log(`  [${i}]`, p);
    // });

    /* 🔍 PRINT GROUPING POLICIES */
    // IMPORTANT: We use getGroupingPolicy() for default "g" (not getNamedGroupingPolicy("g"))
    // This is what addGroupingPolicy() creates when adding users!
    const defaultGPolicies = await enforcerInstance.getGroupingPolicy();
    const g2Policies = await enforcerInstance.getNamedGroupingPolicy("g2");
    const g3Policies = await enforcerInstance.getNamedGroupingPolicy("g3");
    const g4Policies = await enforcerInstance.getNamedGroupingPolicy("g4");
    
    console.log(`\n🔗 GROUPING POLICIES:`);
    console.log(`  🔗 DEFAULT g (user → role → org) - USER GROUPING: ${defaultGPolicies.length} policies ✅ WATCH THIS!`);
    console.log(`  🔗 g2 (org scope): ${g2Policies.length} policies`);
    console.log(`  🔗 g3 (portal hierarchy): ${g3Policies.length} policies`);
    console.log(`  🔗 g4 (role hierarchy): ${g4Policies.length} policies`);
    console.log(`  💡 IMPORTANT: When creating users, the "DEFAULT g (user → role → org)" count should increase!`);
    console.log(`  💡 The "Policies (p)" count (${policies.length}) is for role permissions and stays the same.\n`);
    
    // Uncomment to see all grouping policies
    // console.log("\n🔗 DEFAULT g (user → role → org):", defaultGPolicies);
    // console.log("🔗 g2 (org scope):", g2Policies);
    // console.log("🔗 g3 (portal hierarchy):", g3Policies);
    // console.log("🔗 g4 (role hierarchy):", g4Policies);

    /* 5️⃣ MIGRATE OLD POLICIES */
    await migratePolicies(enforcerInstance);

    /* 6️⃣ LOG FINAL POLICY COUNTS */
    await logPolicyCounts(enforcerInstance);

    console.log("\n========== CASBIN INIT END ==========\n");
    logger.info("✅ Casbin enforcer initialized");

    return enforcerInstance;
  } catch (error) {
    logger.error("❌ CASBIN initialization error:", error);
    throw error;
  }
}
