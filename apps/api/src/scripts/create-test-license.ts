/**
 * Script to create a temporary test license for an organization
 * Usage: tsx src/scripts/create-test-license.ts <organizationId> [vesselLimit]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple locations for .env file
const possiblePaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];

let envPath: string | undefined;
for (const possiblePath of possiblePaths) {
  if (existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
}

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/euroasiann';

// Import models
const LicenseSchema = new mongoose.Schema({
  licenseKey: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  organizationType: String,
  status: String,
  expiresAt: Date,
  issuedAt: Date,
  usageLimits: {
    users: Number,
    vessels: Number,
    items: Number,
    employees: Number,
    businessUnits: Number,
  },
  currentUsage: {
    users: Number,
    vessels: Number,
    items: Number,
    employees: Number,
    businessUnits: Number,
  },
  pricing: {
    monthlyPrice: Number,
    yearlyPrice: Number,
    currency: String,
  },
}, { timestamps: true, collection: 'licenses' });

const OrganizationSchema = new mongoose.Schema({
  name: String,
  type: String,
  isActive: Boolean,
}, { timestamps: true, collection: 'organizations' });

const License = mongoose.models.License || mongoose.model('License', LicenseSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

function generateLicenseKey(): string {
  return `LIC-${uuidv4().toUpperCase().replace(/-/g, '')}`;
}

async function createTestLicense(organizationId: string, vesselLimit: number = 50) {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Validate organizationId
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      console.error(`❌ Invalid organizationId: ${organizationId}`);
      process.exit(1);
    }

    const orgObjectId = new mongoose.Types.ObjectId(organizationId);

    // Find organization
    const organization = await Organization.findById(orgObjectId);
    if (!organization) {
      console.error(`❌ Organization not found with ID: ${organizationId}`);
      process.exit(1);
    }

    console.log(`✅ Found organization: ${organization.name}`);
    console.log(`   Type: ${organization.type}\n`);

    // Check for existing active license
    const existingLicense = await License.findOne({
      organizationId: orgObjectId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    if (existingLicense) {
      console.log('⚠️  Active license already exists:');
      console.log(`   License Key: ${existingLicense.licenseKey}`);
      console.log(`   Status: ${existingLicense.status}`);
      console.log(`   Vessel Limit: ${existingLicense.usageLimits?.vessels || 0}`);
      console.log(`   Current Vessels: ${existingLicense.currentUsage?.vessels || 0}`);
      console.log(`   Expires: ${existingLicense.expiresAt.toISOString()}\n`);

      const response = await new Promise<string>((resolve) => {
        // In a real script, you'd use readline, but for simplicity, we'll just update it
        resolve('update');
      });

      if (response === 'update') {
        // Update existing license
        existingLicense.usageLimits.vessels = vesselLimit;
        existingLicense.expiresAt = new Date();
        existingLicense.expiresAt.setFullYear(existingLicense.expiresAt.getFullYear() + 1);
        await existingLicense.save();

        console.log('✅ License updated successfully!');
        console.log(`   New Vessel Limit: ${vesselLimit}`);
        console.log(`   New Expiry: ${existingLicense.expiresAt.toISOString()}\n`);
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Create new license
    const licenseKey = generateLicenseKey();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    const license = new License({
      licenseKey,
      organizationId: orgObjectId,
      organizationType: organization.type,
      status: 'active',
      expiresAt,
      issuedAt: new Date(),
      usageLimits: {
        users: 100,
        vessels: vesselLimit,
        items: 1000,
        employees: 200,
        businessUnits: 20,
      },
      currentUsage: {
        users: 0,
        vessels: 0,
        items: 0,
        employees: 0,
        businessUnits: 0,
      },
      pricing: {
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'USD',
      },
    });

    await license.save();

    console.log('✅ Test license created successfully!');
    console.log(`   License Key: ${licenseKey}`);
    console.log(`   Organization: ${organization.name}`);
    console.log(`   Status: ${license.status}`);
    console.log(`   Vessel Limit: ${vesselLimit}`);
    console.log(`   User Limit: 100`);
    console.log(`   Item Limit: 1000`);
    console.log(`   Employee Limit: 200`);
    console.log(`   Business Unit Limit: 20`);
    console.log(`   Expires: ${expiresAt.toISOString()}\n`);

    console.log('✅ You can now add vessels up to the limit!');
    console.log(`   Current Usage: 0 / ${vesselLimit} vessels\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get arguments from command line
const organizationId = process.argv[2];
const vesselLimit = process.argv[3] ? parseInt(process.argv[3], 10) : 50;

if (!organizationId) {
  console.error('❌ Please provide an organization ID');
  console.log('Usage: tsx src/scripts/create-test-license.ts <organizationId> [vesselLimit]');
  console.log('\nExample:');
  console.log('  tsx src/scripts/create-test-license.ts 692010755acee3bb82bf99e3 50');
  process.exit(1);
}

if (isNaN(vesselLimit) || vesselLimit < 0) {
  console.error('❌ Vessel limit must be a positive number');
  process.exit(1);
}

createTestLicense(organizationId, vesselLimit);

