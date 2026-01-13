import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
const envPath = path.resolve(__dirname, '../../../.env');
if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
}
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/euroasiann-erp';
async function checkLicense(emailOrOrgId) {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        const { User } = await import('../models/user.model');
        const { Organization } = await import('../models/organization.model');
        const { License } = await import('../models/license.model');
        let user;
        let organizationId;
        // Check if input is an ObjectId (organization ID) or email
        if (mongoose.Types.ObjectId.isValid(emailOrOrgId)) {
            organizationId = new mongoose.Types.ObjectId(emailOrOrgId);
            const org = await Organization.findById(organizationId);
            if (org) {
                console.log(`✅ Found organization by ID: ${org.name}`);
                user = await User.findOne({ organizationId: organizationId });
            }
            else {
                console.error(`❌ Organization not found with ID: ${emailOrOrgId}`);
                return;
            }
        }
        else {
            // It's an email
            const normalizedEmail = emailOrOrgId.toLowerCase().trim();
            user = await User.findOne({ email: normalizedEmail });
            if (user) {
                organizationId = user.organizationId;
            }
            else {
                // Try to find by organization name
                const org = await Organization.findOne({ name: emailOrOrgId });
                if (org) {
                    console.log(`✅ Found organization by name: ${org.name}`);
                    organizationId = org._id;
                }
                else {
                    console.error(`❌ User not found: ${emailOrOrgId}`);
                    return;
                }
            }
        }
        if (user) {
            console.log(`✅ Found user: ${user.email}`);
            console.log(`   Organization ID: ${user.organizationId}`);
        }
        if (!organizationId) {
            console.error('❌ No organization ID found');
            return;
        }
        const organization = await Organization.findById(organizationId);
        if (!organization) {
            console.error('❌ Organization not found');
            return;
        }
        console.log(`✅ Found organization: ${organization.name}`);
        // Check licenses - try both ObjectId and string formats
        const licenses = await License.find({
            $or: [
                { organizationId: organizationId },
                { organizationId: organizationId.toString() }
            ]
        });
        console.log(`\n📋 Found ${licenses.length} license(s):`);
        if (licenses.length === 0) {
            console.log('❌ No licenses found for this organization!');
        }
        else {
            licenses.forEach((license, index) => {
                console.log(`\n   License ${index + 1}:`);
                console.log(`   - ID: ${license._id}`);
                console.log(`   - Key: ${license.licenseKey}`);
                console.log(`   - Status: ${license.status}`);
                console.log(`   - Expires At: ${license.expiresAt}`);
                console.log(`   - Organization ID (type): ${typeof license.organizationId}`);
                console.log(`   - Organization ID (value): ${license.organizationId}`);
                console.log(`   - Is Expired: ${new Date() > license.expiresAt}`);
                console.log(`   - Is Active: ${license.status === 'active'}`);
                console.log(`   - Is Valid: ${license.status === 'active' && new Date() < license.expiresAt}`);
            });
        }
        // Test the validateLicense method
        console.log('\n🔍 Testing validateLicense method...');
        const { licenseService } = await import('../services/license.service');
        try {
            const validLicense = await licenseService.validateLicense(organizationId.toString());
            console.log('✅ License validation passed!');
            console.log(`   License Key: ${validLicense.licenseKey}`);
        }
        catch (error) {
            console.error('❌ License validation failed:', error.message);
        }
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
    finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}
const email = process.argv[2];
if (!email) {
    console.error('Usage: npx tsx src/scripts/check-license.ts <email>');
    process.exit(1);
}
checkLicense(email);
//# sourceMappingURL=check-license.js.map