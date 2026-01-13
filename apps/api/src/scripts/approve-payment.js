/**
 * Script to temporarily approve payment for a user
 * Usage: tsx src/scripts/approve-payment.ts <email>
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try multiple locations for .env file
const possiblePaths = [
    path.resolve(__dirname, '../../../.env'), // Root of workspace
    path.resolve(__dirname, '../../../../.env'), // Alternative root path
    path.resolve(__dirname, '../../.env'), // apps/.env
    path.resolve(process.cwd(), '.env'), // Current working directory
];
let envPath;
for (const possiblePath of possiblePaths) {
    if (existsSync(possiblePath)) {
        envPath = possiblePath;
        break;
    }
}
if (envPath) {
    dotenv.config({ path: envPath });
}
else {
    // Fallback: try default location
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/euroasiann';
// Import models
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    portalType: String,
    role: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean,
}, { timestamps: true, collection: 'users' });
const OrganizationSchema = new mongoose.Schema({
    name: String,
    type: String,
    isActive: Boolean,
}, { timestamps: true, collection: 'organizations' });
const PaymentSchema = new mongoose.Schema({
    organizationId: mongoose.Schema.Types.ObjectId,
    organizationType: String,
    portalType: String,
    userId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    currency: String,
    paymentType: String,
    status: String,
    paymentMethod: String,
    transactionId: String,
    paymentGateway: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    description: String,
    subscriptionPeriod: {
        startDate: Date,
        endDate: Date,
    },
    licenseId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'payments' });
const LicenseSchema = new mongoose.Schema({
    licenseKey: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    organizationType: String,
    status: String,
    expiresAt: Date,
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
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
const License = mongoose.models.License || mongoose.model('License', LicenseSchema);
async function approvePayment(email) {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`🔍 Looking for user with email: ${normalizedEmail}\n`);
        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.error(`❌ User not found with email: ${normalizedEmail}`);
            console.log('\n💡 Available users:');
            const allUsers = await User.find({}).select('email portalType organizationId').limit(10);
            allUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.portalType})`);
            });
            process.exit(1);
        }
        console.log(`✅ Found user: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Portal Type: ${user.portalType}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Organization ID: ${user.organizationId || 'None'}\n`);
        if (!user.organizationId) {
            console.error('❌ User does not have an organization assigned.');
            console.log('   Please assign an organization to the user first.');
            process.exit(1);
        }
        // Get organization
        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            console.error(`❌ Organization not found with ID: ${user.organizationId}`);
            process.exit(1);
        }
        console.log(`✅ Found organization: ${organization.name}`);
        console.log(`   Type: ${organization.type}\n`);
        // Check if payment already exists
        const existingPayment = await Payment.findOne({
            organizationId: user.organizationId,
            status: 'success',
        }).sort({ createdAt: -1 });
        if (existingPayment) {
            const endDate = existingPayment.subscriptionPeriod?.endDate;
            const isExpired = endDate && new Date(endDate) < new Date();
            if (!isExpired) {
                console.log('✅ Active payment already exists:');
                console.log(`   Payment ID: ${existingPayment._id}`);
                console.log(`   Status: ${existingPayment.status}`);
                console.log(`   Amount: ${existingPayment.currency} ${existingPayment.amount}`);
                console.log(`   Subscription End: ${endDate ? new Date(endDate).toISOString() : 'N/A'}`);
                // Check if license exists
                let license = await License.findOne({ organizationId: user.organizationId, status: 'active' });
                if (!license) {
                    console.log('\n⚠️  No active license found. Creating license...');
                    const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
                    license = new License({
                        licenseKey,
                        organizationId: user.organizationId,
                        organizationType: organization.type,
                        status: 'active',
                        expiresAt: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        usageLimits: {
                            users: 100,
                            vessels: 50,
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
                    existingPayment.licenseId = license._id;
                    await existingPayment.save();
                    console.log(`✅ License created: ${license.licenseKey}`);
                }
                else {
                    console.log(`✅ Active license found: ${license.licenseKey}`);
                }
                console.log('\n✅ User should already have access to the dashboard.');
                await mongoose.disconnect();
                process.exit(0);
            }
            else {
                console.log('⚠️  Existing payment found but expired. Creating new payment...\n');
            }
        }
        // Create new payment with SUCCESS status
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
        const payment = new Payment({
            organizationId: user.organizationId,
            organizationType: organization.type,
            portalType: user.portalType,
            userId: user._id,
            amount: 0, // Temporary approval, no amount
            currency: 'USD',
            paymentType: 'subscription',
            status: 'success',
            paymentMethod: 'manual_approval',
            transactionId: `TEMP_${Date.now()}`,
            paymentGateway: 'manual',
            description: `Temporary payment approval for ${user.email} - Manual override`,
            subscriptionPeriod: {
                startDate,
                endDate,
            },
            metadata: {
                approvedBy: 'admin',
                temporaryApproval: true,
                approvedAt: new Date(),
            },
        });
        await payment.save();
        // Check if license already exists
        let license = await License.findOne({ organizationId: user.organizationId, status: 'active' });
        if (!license) {
            // Create a license for the organization
            const licenseKey = `LIC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
            license = new License({
                licenseKey,
                organizationId: user.organizationId,
                organizationType: organization.type,
                status: 'active',
                expiresAt: endDate,
                usageLimits: {
                    users: 100,
                    vessels: 50,
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
            console.log('✅ License created successfully!');
            console.log(`   License Key: ${license.licenseKey}`);
        }
        else {
            // Update existing license
            license.expiresAt = endDate;
            license.status = 'active';
            await license.save();
            console.log('✅ Existing license updated!');
            console.log(`   License Key: ${license.licenseKey}`);
        }
        // Link license to payment
        payment.licenseId = license._id;
        await payment.save();
        console.log('\n✅ Payment approved successfully!');
        console.log(`   Payment ID: ${payment._id}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Subscription Start: ${startDate.toISOString()}`);
        console.log(`   Subscription End: ${endDate.toISOString()}`);
        console.log(`   License ID: ${license._id}`);
        console.log(`   Note: This is a temporary approval (manual override)\n`);
        console.log('✅ User can now access the dashboard!');
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: (use the temporary password provided)\n`);
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}
// Get email from command line argument
const email = process.argv[2] || 'ruxohare@denipl.com';
if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: tsx src/scripts/approve-payment.ts <email>');
    process.exit(1);
}
approvePayment(email);
//# sourceMappingURL=approve-payment.js.map