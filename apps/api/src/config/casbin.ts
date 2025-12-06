import { newEnforcer } from 'casbin';
import { MongoAdapter } from 'casbin-mongodb-adapter';
import { logger } from './logger';
import { config } from './environment';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// IMPORT SEED FUNCTION
import { seedDefaultPolicies } from '../../../../packages/casbin-config/src/seed-policies.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let enforcerInstance: any = null;

// =====================================================
//  FIX FUNCTION: Remove corrupted 6-field policies
// =====================================================
async function fixCorruptedPolicies(enforcer) {
  const allPolicies = await enforcer.getPolicy();

  for (const p of allPolicies) {
    // Casbin model requires 7 fields (sub, obj, act, org, eft, portal, role)
    if (p.length === 6) {
      console.log("❌ Removing corrupted 6-field policy:", p);
      await enforcer.removePolicy(...p);
    }
  }

  await enforcer.savePolicy();
  console.log("✅ Cleanup complete: Corrupted policies removed");
}

// =====================================================
//  MAIN ENFORCER FUNCTION
// =====================================================
export async function getCasbinEnforcer(): Promise<any> {
  if (enforcerInstance) {
    return enforcerInstance;
  }

  try {
    // Load CASBIN model from package
    let modelPath = join(
      __dirname,
      '../../../../packages/casbin-config/src/model.conf'
    );

    // Try reading model file; fallback to process.cwd()
    try {
      readFileSync(modelPath, 'utf-8');
    } catch {
      modelPath = join(process.cwd(), 'packages/casbin-config/src/model.conf');
    }

    // Extract database name from MongoDB URI
    const uriObj = new URL(config.mongoUri);
    const databaseName = uriObj.pathname?.split('/')[1] || 'casbin';

    // Create MongoDB adapter
    const adapter = await MongoAdapter.newAdapter({
      uri: config.mongoUri,
      database: databaseName,
      collection: 'casbin_rule',
    });

    // Create enforcer with file path
    enforcerInstance = await newEnforcer(modelPath, adapter);

    // 🛠 CLEANUP: Remove corrupted old policies (6 fields)
    await fixCorruptedPolicies(enforcerInstance);

    // 🌱 RESEED DEFAULT POLICIES
    console.log("🌱 Seeding default Casbin policies...");
    await seedDefaultPolicies(enforcerInstance);
    console.log("✅ Default Casbin policies recreated");

    logger.info('✅ CASBIN enforcer initialized successfully');
    return enforcerInstance;

  } catch (error) {
    logger.error('❌ CASBIN initialization error:', error);

    // Basic fallback model
    const basicModel = `
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
    const databaseName = uriObj.pathname?.split('/')[1] || 'casbin';

    const adapter = await MongoAdapter.newAdapter({
      uri: config.mongoUri,
      database: databaseName,
      collection: 'casbin_rule',
    });

    const { newModelFromString } = await import('casbin');
    const model = newModelFromString(basicModel);

    enforcerInstance = await newEnforcer(model, adapter);

    logger.info('🚨 CASBIN enforcer initialized with fallback model');
    return enforcerInstance;
  }
}
