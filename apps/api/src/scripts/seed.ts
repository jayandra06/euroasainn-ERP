import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { License } from '../models/license.model';
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';

async function seed() {
  try {
    await connectDatabase();
    logger.info('Starting seed...');

    // Create Euroasiann Group - Platform Owner Organization
    // This organization owns both tech and admin portals
    let euroasiannGroup = await Organization.findOne({ 
      name: 'Euroasiann Group',
      type: OrganizationType.ADMIN 
    });
    
    if (!euroasiannGroup) {
      euroasiannGroup = await Organization.create({
        name: 'Euroasiann Group',
        type: OrganizationType.ADMIN,
        portalType: PortalType.TECH, // Use TECH as primary portal type (highest level)
        isActive: true,
      });
      logger.info('✅ Created Euroasiann Group (Platform Owner Organization)');
    } else {
      // Update existing organization to ensure correct name
      if (euroasiannGroup.name !== 'Euroasiann Group') {
        euroasiannGroup.name = 'Euroasiann Group';
        await euroasiannGroup.save();
        logger.info('✅ Updated organization name to Euroasiann Group');
      }
    }

    // Create Tech Admin User
    const techAdminEmail = 'techadmin@euroasiann.com';
    let techAdmin = await User.findOne({ email: techAdminEmail, portalType: PortalType.TECH });
    if (!techAdmin) {
      const hashedPassword = await bcrypt.hash('TechAdmin123!', 10);
      techAdmin = await User.create({
        email: techAdminEmail,
        password: hashedPassword,
        firstName: 'Tech',
        lastName: 'Admin',
        portalType: PortalType.TECH,
        role: 'tech_admin',
        organizationId: euroasiannGroup._id,
        isActive: true,
      });
      logger.info('✅ Created Tech Admin User');
      logger.info(`   Email: ${techAdminEmail}`);
      logger.info(`   Password: TechAdmin123!`);
      logger.info(`   Organization: Euroasiann Group`);
    } else {
      // Update existing tech admin to Euroasiann Group
      if (techAdmin.organizationId?.toString() !== euroasiannGroup._id.toString()) {
        techAdmin.organizationId = euroasiannGroup._id;
        await techAdmin.save();
        logger.info('✅ Updated Tech Admin User to Euroasiann Group');
      }
    }

    // Create User: jayandraa5@gmail.com
    const jayEmail = 'jayandraa5@gmail.com';
    let jayUser = await User.findOne({ email: jayEmail, portalType: PortalType.TECH });
    if (!jayUser) {
      const hashedPassword = await bcrypt.hash('J@yandra06', 10);
      jayUser = await User.create({
        email: jayEmail,
        password: hashedPassword,
        firstName: 'Jay',
        lastName: 'Andra',
        portalType: PortalType.TECH,
        role: 'tech_admin',
        organizationId: euroasiannGroup._id,
        isActive: true,
      });
      logger.info('✅ Created User: jayandraa5@gmail.com');
      logger.info(`   Email: ${jayEmail}`);
      logger.info(`   Password: J@yandra06`);
      logger.info(`   Organization: Euroasiann Group`);
    } else {
      // Update password and organization if user exists
      const hashedPassword = await bcrypt.hash('J@yandra06', 10);
      jayUser.password = hashedPassword;
      jayUser.firstName = 'Jay';
      jayUser.lastName = 'Andra';
      jayUser.role = 'tech_admin';
      jayUser.organizationId = euroasiannGroup._id;
      jayUser.isActive = true;
      await jayUser.save();
      logger.info('✅ Updated User: jayandraa5@gmail.com');
      logger.info(`   Email: ${jayEmail}`);
      logger.info(`   Password: J@yandra06`);
      logger.info(`   Organization: Euroasiann Group`);
    }

    // Create Admin Portal User (also belongs to Euroasiann Group)
    const adminEmail = 'admin@euroasiann.com';
    let admin = await User.findOne({ email: adminEmail, portalType: PortalType.ADMIN });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        portalType: PortalType.ADMIN,
        role: 'admin_superuser',
        organizationId: euroasiannGroup._id, // Same organization as tech users
        isActive: true,
      });
      logger.info('✅ Created Admin User');
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: Admin123!`);
      logger.info(`   Organization: Euroasiann Group`);
    } else {
      // Update existing admin to Euroasiann Group
      if (admin.organizationId?.toString() !== euroasiannGroup._id.toString()) {
        admin.organizationId = euroasiannGroup._id;
        await admin.save();
        logger.info('✅ Updated Admin User to Euroasiann Group');
      }
    }

    // Update any existing tech portal users to Euroasiann Group
    const techUsers = await User.find({ portalType: PortalType.TECH });
    for (const user of techUsers) {
      if (user.organizationId?.toString() !== euroasiannGroup._id.toString()) {
        user.organizationId = euroasiannGroup._id;
        await user.save();
        logger.info(`✅ Updated tech user ${user.email} to Euroasiann Group`);
      }
    }

    // Update any existing admin portal users to Euroasiann Group
    const adminUsers = await User.find({ portalType: PortalType.ADMIN });
    for (const user of adminUsers) {
      if (user.organizationId?.toString() !== euroasiannGroup._id.toString()) {
        user.organizationId = euroasiannGroup._id;
        await user.save();
        logger.info(`✅ Updated admin user ${user.email} to Euroasiann Group`);
      }
    }

    // Clean up old duplicate organizations
    // Delete "Euroasiann Platform Admin" (old organization)
    const oldTechOrg = await Organization.findOne({ 
      name: 'Euroasiann Platform Admin',
      type: OrganizationType.ADMIN 
    });
    if (oldTechOrg) {
      // Check if any users are still assigned to this org
      const usersInOldOrg = await User.find({ organizationId: oldTechOrg._id });
      if (usersInOldOrg.length > 0) {
        // Migrate users to Euroasiann Group
        await User.updateMany(
          { organizationId: oldTechOrg._id },
          { organizationId: euroasiannGroup._id }
        );
        logger.info(`✅ Migrated ${usersInOldOrg.length} users from "Euroasiann Platform Admin" to Euroasiann Group`);
      }
      // Check for licenses
      const licensesInOldOrg = await License.find({ organizationId: oldTechOrg._id });
      if (licensesInOldOrg.length > 0) {
        logger.warn(`⚠️  Found ${licensesInOldOrg.length} license(s) associated with "Euroasiann Platform Admin". Moving to Euroasiann Group...`);
        await License.updateMany(
          { organizationId: oldTechOrg._id },
          { organizationId: euroasiannGroup._id }
        );
      }
      // Delete the old organization
      await Organization.findByIdAndDelete(oldTechOrg._id);
      logger.info('✅ Deleted old "Euroasiann Platform Admin" organization');
    }

    // Delete "Admin Portal Organization" (old organization)
    const oldAdminOrg = await Organization.findOne({ 
      name: 'Admin Portal Organization',
      type: OrganizationType.ADMIN 
    });
    if (oldAdminOrg) {
      // Check if any users are still assigned to this org
      const usersInOldOrg = await User.find({ organizationId: oldAdminOrg._id });
      if (usersInOldOrg.length > 0) {
        // Migrate users to Euroasiann Group
        await User.updateMany(
          { organizationId: oldAdminOrg._id },
          { organizationId: euroasiannGroup._id }
        );
        logger.info(`✅ Migrated ${usersInOldOrg.length} users from "Admin Portal Organization" to Euroasiann Group`);
      }
      // Check for licenses
      const licensesInOldOrg = await License.find({ organizationId: oldAdminOrg._id });
      if (licensesInOldOrg.length > 0) {
        logger.warn(`⚠️  Found ${licensesInOldOrg.length} license(s) associated with "Admin Portal Organization". Moving to Euroasiann Group...`);
        await License.updateMany(
          { organizationId: oldAdminOrg._id },
          { organizationId: euroasiannGroup._id }
        );
      }
      // Delete the old organization
      await Organization.findByIdAndDelete(oldAdminOrg._id);
      logger.info('✅ Deleted old "Admin Portal Organization" organization');
    }

    // Delete Sample Customer Organization
    const sampleCustomerOrg = await Organization.findOne({ 
      name: 'Sample Customer Organization',
      type: OrganizationType.CUSTOMER 
    });
    if (sampleCustomerOrg) {
      // Check for users
      const usersInOrg = await User.find({ organizationId: sampleCustomerOrg._id });
      if (usersInOrg.length > 0) {
        logger.warn(`⚠️  Found ${usersInOrg.length} user(s) in "Sample Customer Organization". Deleting users...`);
        await User.deleteMany({ organizationId: sampleCustomerOrg._id });
      }
      // Check for licenses
      const licensesInOrg = await License.find({ organizationId: sampleCustomerOrg._id });
      if (licensesInOrg.length > 0) {
        logger.info(`🗑️  Deleting ${licensesInOrg.length} license(s) associated with "Sample Customer Organization"...`);
        await License.deleteMany({ organizationId: sampleCustomerOrg._id });
      }
      // Delete the organization
      await Organization.findByIdAndDelete(sampleCustomerOrg._id);
      logger.info('✅ Deleted "Sample Customer Organization"');
    }

    // Delete Sample Vendor Organization
    const sampleVendorOrg = await Organization.findOne({ 
      name: 'Sample Vendor Organization',
      type: OrganizationType.VENDOR 
    });
    if (sampleVendorOrg) {
      // Check for users
      const usersInOrg = await User.find({ organizationId: sampleVendorOrg._id });
      if (usersInOrg.length > 0) {
        logger.warn(`⚠️  Found ${usersInOrg.length} user(s) in "Sample Vendor Organization". Deleting users...`);
        await User.deleteMany({ organizationId: sampleVendorOrg._id });
      }
      // Check for licenses
      const licensesInOrg = await License.find({ organizationId: sampleVendorOrg._id });
      if (licensesInOrg.length > 0) {
        logger.info(`🗑️  Deleting ${licensesInOrg.length} license(s) associated with "Sample Vendor Organization"...`);
        await License.deleteMany({ organizationId: sampleVendorOrg._id });
      }
      // Delete the organization
      await Organization.findByIdAndDelete(sampleVendorOrg._id);
      logger.info('✅ Deleted "Sample Vendor Organization"');
    }

    logger.info('✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
