import { newEnforcer } from "casbin";
import { MongoAdapter } from "casbin-mongodb-adapter";
import { logger } from "./logger";
import { config } from "./environment";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let enforcerInstance = null;
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
async function migratePolicies(enforcer) {
    console.log("\n🛠️ Casbin migration check started...");
    const policies = await enforcer.getPolicy();
    console.log(`📦 Total policies loaded (before migration): ${policies.length}`);
    let migrated = 0;
    for (const p of policies) {
        if (p.length === 6) {
            const [sub, obj, act, org, eft, portal] = p;
            await enforcer.removePolicy(...p);
            await enforcer.addPolicy(sub, obj, act, org, eft, portal, sub // role = sub
            );
            migrated++;
        }
    }
    if (migrated > 0) {
        await enforcer.savePolicy();
        console.log(`🧹 Migration completed. Migrated ${migrated} policies`);
    }
    else {
        console.log("✅ No migration needed");
    }
}
/* =========================
   ENFORCER
========================= */
export async function getCasbinEnforcer() {
    if (enforcerInstance) {
        console.log("♻️ Using cached Casbin Enforcer instance");
        return enforcerInstance;
    }
    try {
        console.log("\n========== CASBIN INIT START ==========");
        /* 1️⃣ LOAD MODEL */
        let modelPath = join(__dirname, "../../../../packages/casbin-config/src/model.conf");
        try {
            readFileSync(modelPath, "utf-8");
            console.log("📄 Casbin model loaded:", modelPath);
        }
        catch {
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
        /* 4️⃣ LOAD POLICIES */
        await enforcerInstance.loadPolicy();
        console.log("📥 Casbin policies loaded from DB");
        /* 🔍 PRINT POLICIES (p) */
        const policies = await enforcerInstance.getPolicy();
        console.log("\n📜 POLICIES (p):");
        policies.forEach((p, i) => {
            console.log(`  [${i}]`, p);
        });
        /* 🔍 PRINT GROUPING POLICIES */
        console.log("\n🔗 g  (user → role → org):", await enforcerInstance.getNamedGroupingPolicy("g"));
        console.log("🔗 g2 (org scope):", await enforcerInstance.getNamedGroupingPolicy("g2"));
        console.log("🔗 g3 (portal hierarchy):", await enforcerInstance.getNamedGroupingPolicy("g3"));
        console.log("🔗 g4 (role hierarchy):", await enforcerInstance.getNamedGroupingPolicy("g4"));
        /* 5️⃣ MIGRATE OLD POLICIES */
        await migratePolicies(enforcerInstance);
        console.log("\n========== CASBIN INIT END ==========\n");
        logger.info("✅ Casbin enforcer initialized");
        return enforcerInstance;
    }
    catch (error) {
        logger.error("❌ CASBIN initialization error:", error);
        throw error;
    }
}
//# sourceMappingURL=casbin.js.map