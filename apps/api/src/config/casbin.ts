// apps/api/src/config/casbin.ts
import { newEnforcer } from "casbin";
import { MongoAdapter } from "casbin-mongodb-adapter";
import { logger } from "./logger";
import { config } from "./environment";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Seed default policies (used ONLY when database is empty)
import { seedDefaultPolicies } from "../../../../packages/casbin-config/src/seed-policies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let enforcerInstance: any = null;

export async function getCasbinEnforcer() {
  // Return existing instance
  if (enforcerInstance) return enforcerInstance;

  try {
    // -----------------------------
    // 1️⃣ Load CASBIN MODEL FILE
    // -----------------------------
    let modelPath = join(
      __dirname,
      "../../../../packages/casbin-config/src/model.conf"
    );

    // Fallback check
    try {
      readFileSync(modelPath, "utf-8");
    } catch {
      modelPath = join(process.cwd(), "packages/casbin-config/src/model.conf");
    }

    // -----------------------------
    // 2️⃣ Create MongoDB Adapter
    // -----------------------------
    const uriObj = new URL(config.mongoUri);
    const dbName = uriObj.pathname?.replace("/", "") || "casbin";

    const adapter = await MongoAdapter.newAdapter({
      uri: config.mongoUri,
      database: dbName,
      collection: "casbin_rule",
    });

    // -----------------------------
    // 3️⃣ Create Enforcer
    // -----------------------------
    enforcerInstance = await newEnforcer(modelPath, adapter);

    // Load policies from DB
    await enforcerInstance.loadPolicy();

    // ---------------------------------------------------
    // ⭐ ADDED — SEED DEFAULT POLICIES ONLY IF DB IS EMPTY
    // ---------------------------------------------------
    const existing = await enforcerInstance.getPolicy();

    if (existing.length === 0) {
      console.log("🌱 Casbin database empty → Seeding default policies...");
      await seedDefaultPolicies(enforcerInstance);
      await enforcerInstance.savePolicy();
      console.log("✅ Default Casbin policies seeded");
    } else {
      console.log("🔄 Casbin policies already exist → Skipping seeding");
    }
    // ---------------------------------------------------

    logger.info("✅ Casbin enforcer initialized");
    return enforcerInstance;
  } catch (error) {
    logger.error("❌ CASBIN initialization error:", error);

    // -----------------------------
    // 5️⃣ Fallback minimal model
    // -----------------------------
    const fallbackModel = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
`;

    const uriObj = new URL(config.mongoUri);
    const dbName = uriObj.pathname?.replace("/", "") || "casbin";

    const adapter = await MongoAdapter.newAdapter({
      uri: config.mongoUri,
      database: dbName,
      collection: "casbin_rule",
    });

    const { newModelFromString } = await import("casbin");
    const model = newModelFromString(fallbackModel);

    enforcerInstance = await newEnforcer(model, adapter);

    logger.info("🚨 CASBIN initialized with fallback model");
    return enforcerInstance;
  }
}
