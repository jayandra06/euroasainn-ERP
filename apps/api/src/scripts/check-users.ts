/**
 * Script to check users in database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/euroasiann';

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

async function checkUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await UserModel.find({}).select('-password');
    console.log(`📊 Total Users: ${allUsers.length}\n`);

    // Get tech users
    const techUsers = await UserModel.find({ portalType: 'tech' }).select('-password');
    console.log(`🔧 Tech Portal Users: ${techUsers.length}\n`);

    if (techUsers.length > 0) {
      console.log('Tech Portal Users:');
      techUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   OrganizationId: ${user.organizationId}`);
        console.log(`   Created: ${user.createdAt}`);
      });
    } else {
      console.log('⚠️  No tech portal users found!');
    }

    // Check specific user
    const jayUser = await UserModel.findOne({ email: 'jayandraa5@gmail.com' }).select('-password');
    if (jayUser) {
      console.log('\n✅ Found jayandraa5@gmail.com:');
      console.log(`   Portal Type: ${jayUser.portalType}`);
      console.log(`   Role: ${jayUser.role}`);
      console.log(`   Active: ${jayUser.isActive}`);
      console.log(`   OrganizationId: ${jayUser.organizationId}`);
    } else {
      console.log('\n❌ jayandraa5@gmail.com not found!');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();






