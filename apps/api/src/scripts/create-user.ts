/**
 * Standalone script to create a user
 * Usage: tsx src/scripts/create-user.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection string
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/euroasiann';

interface User {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role: string;
  organizationId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  portalType: { type: String, required: true },
  role: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const OrganizationModel = mongoose.models.Organization || mongoose.model('Organization', new mongoose.Schema({
  name: String,
  type: String,
  portalType: String,
  isActive: Boolean,
}, { timestamps: true }));

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find or create tech organization
    let techOrg = await OrganizationModel.findOne({ portalType: 'tech' });
    if (!techOrg) {
      techOrg = await OrganizationModel.create({
        name: 'Euroasiann Platform Admin',
        type: 'admin',
        portalType: 'tech',
        isActive: true,
      });
      console.log('✅ Created Tech Organization');
    }

    // Create user: jayandraa5@gmail.com
    const email = 'jayandraa5@gmail.com';
    const password = 'J@yandra06';
    
    // Check if user exists
    const existing = await UserModel.findOne({ email, portalType: 'tech' });
    
    if (existing) {
      // Update existing user
      const hashedPassword = await bcrypt.hash(password, 10);
      existing.password = hashedPassword;
      existing.firstName = 'Jay';
      existing.lastName = 'Andra';
      existing.role = 'tech_admin';
      existing.isActive = true;
      existing.organizationId = techOrg._id;
      await existing.save();
      console.log('✅ Updated existing user');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await UserModel.create({
        email,
        password: hashedPassword,
        firstName: 'Jay',
        lastName: 'Andra',
        portalType: 'tech',
        role: 'tech_admin',
        organizationId: techOrg._id,
        isActive: true,
      });
      console.log('✅ Created new user');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   User ID: ${user._id}`);
    }

    // Count tech users
    const techUsersCount = await UserModel.countDocuments({ portalType: 'tech' });
    console.log(`\n📊 Total Tech Portal Users: ${techUsersCount}`);

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createUser();






