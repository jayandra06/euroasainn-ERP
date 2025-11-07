/**
 * Script to test users API query
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/euroasiann';

async function testUsersQuery() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test query exactly as the service does
    const portalType = 'tech';
    const query: any = {};
    
    if (portalType) {
      query.portalType = portalType;
    }
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const users = await User.find(query).select('-password');
    console.log(`\n📊 Found ${users.length} users\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   portalType: ${user.portalType}`);
      console.log(`   role: ${user.role}`);
      console.log(`   isActive: ${user.isActive}`);
    });

    // Test with PortalType enum
    console.log('\n--- Testing with PortalType.TECH ---');
    const users2 = await User.find({ portalType: 'tech' }).select('-password');
    console.log(`Found ${users2.length} users`);

    // Check raw documents
    console.log('\n--- Raw Documents ---');
    const rawUsers = await User.find({}).select('-password').lean();
    console.log(`Total documents: ${rawUsers.length}`);
    rawUsers.forEach((u: any) => {
      console.log(`Email: ${u.email}, portalType: ${u.portalType}, typeof: ${typeof u.portalType}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testUsersQuery();






