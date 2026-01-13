/**
 * Script to check admin portal users in MongoDB
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
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/euroasiann';
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    portalType: String,
    role: String,
    organizationId: mongoose.Schema.Types.ObjectId,
    isActive: Boolean,
}, { timestamps: true });
const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
async function checkAdminUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log(`   URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
        // Get all admin portal users
        const adminUsers = await UserModel.find({ portalType: 'admin' }).select('-password');
        console.log(`📊 Admin Portal Users Found: ${adminUsers.length}\n`);
        if (adminUsers.length > 0) {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🔐 ADMIN PORTAL USERS');
            console.log('═══════════════════════════════════════════════════════\n');
            adminUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.email}`);
                console.log(`   Name: ${user.firstName} ${user.lastName}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
                console.log(`   OrganizationId: ${user.organizationId || 'N/A'}`);
                console.log(`   Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}`);
                console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
                console.log('');
            });
            // According to seed script, the default admin credentials are:
            console.log('═══════════════════════════════════════════════════════');
            console.log('📝 DEFAULT ADMIN CREDENTIALS (from seed script):');
            console.log('═══════════════════════════════════════════════════════');
            console.log('   Email: admin@euroasiann.com');
            console.log('   Password: Admin123!');
            console.log('═══════════════════════════════════════════════════════\n');
        }
        else {
            console.log('⚠️  No admin portal users found!');
            console.log('   Run: npm run seed (in apps/api) to create admin user\n');
        }
        // Also check for any users that might be admin but with different portalType
        const allUsers = await UserModel.find({}).select('-password');
        const potentialAdmins = allUsers.filter(u => u.email.toLowerCase().includes('admin') ||
            u.role.toLowerCase().includes('admin'));
        if (potentialAdmins.length > 0 && potentialAdmins.length !== adminUsers.length) {
            console.log('═══════════════════════════════════════════════════════');
            console.log('⚠️  POTENTIAL ADMIN USERS (different portalType):');
            console.log('═══════════════════════════════════════════════════════\n');
            potentialAdmins.forEach((user, index) => {
                if (user.portalType !== 'admin') {
                    console.log(`${index + 1}. ${user.email}`);
                    console.log(`   Portal Type: ${user.portalType}`);
                    console.log(`   Role: ${user.role}`);
                    console.log(`   Name: ${user.firstName} ${user.lastName}`);
                    console.log('');
                }
            });
        }
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}
checkAdminUsers();
//# sourceMappingURL=check-admin-users.js.map