import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { License } from '../models/license.model';
import { PortalType, OrganizationType } from '@euroasiann/shared';
import { logger } from '../config/logger';
import { Role } from '../models/role.model';
import { Types } from 'mongoose';

async function seed() {
  try {
    await connectDatabase();
    logger.info('Starting seed...');

    const defaultRoles = [
      {
        key: 'admin_superuser',
        name: 'Super Admin',
        portalType: PortalType.ADMIN,
        permissions: ['*'],
        description: 'Full administrative access across the admin portal',
      },
      {
        key: 'admin_system_admin',
        name: 'System Admin',
        portalType: PortalType.ADMIN,
        permissions: ['users:manage', 'licenses:manage', 'settings:update'],
        description: 'Manage admin users, licenses, and critical settings',
      },
      {
        key: 'admin_finance_admin',
        name: 'Finance Admin',
        portalType: PortalType.ADMIN,
        permissions: ['invoices:*', 'transactions:read', 'reports:generate'],
        description: 'Oversees billing, invoices, and financial reporting',
      },
      {
        key: 'admin_hr_admin',
        name: 'HR Admin',
        portalType: PortalType.ADMIN,
        permissions: ['employees:*', 'attendance:read', 'leaves:approve'],
        description: 'Manages employee records and HR processes',
      },
      {
        key: 'admin_auditor',
        name: 'Auditor',
        portalType: PortalType.ADMIN,
        permissions: ['logs:read', 'invoices:read', 'users:read'],
        description: 'Provides read-only insight into system records for compliance',
      },
      {
        key: 'admin_support_agent',
        name: 'Support Agent',
        portalType: PortalType.ADMIN,
        permissions: ['tickets:*', 'customers:read'],
        description: 'Manages customer support tickets and communications',
      },
      {
        key: 'tech_lead',
        name: 'Tech Lead',
        portalType: PortalType.TECH,
        permissions: ['*'],
        description: 'Full access to the tech portal with leadership responsibilities',
      },
      {
        key: 'tech_developer',
        name: 'Developer',
        portalType: PortalType.TECH,
        permissions: ['apps:develop', 'deployments:manage'],
        description: 'Develop and deploy technical solutions',
      },
      {
        key: 'tech_devops_engineer',
        name: 'DevOps Engineer',
        portalType: PortalType.TECH,
        permissions: ['pipeline:*', 'health:read', 'servers:update'],
        description: 'Handles CI/CD pipelines and infrastructure health',
      },
      {
        key: 'tech_qa_engineer',
        name: 'QA Engineer',
        portalType: PortalType.TECH,
        permissions: ['testcases:read', 'bugs:update', 'deployments:read'],
        description: 'Verifies release quality and manages QA workflows',
      },
      {
        key: 'tech_intern',
        name: 'Tech Intern',
        portalType: PortalType.TECH,
        permissions: ['issues:read', 'deployments:read'],
        description: 'View-only access for training purposes',
      },
      {
        key: 'vendor_admin',
        name: 'Vendor Admin',
        portalType: PortalType.VENDOR,
        permissions: ['*'],
        description: 'Oversee vendor operations and approvals',
      },
      {
        key: 'vendor_manager',
        name: 'Vendor Manager',
        portalType: PortalType.VENDOR,
        permissions: ['items:manage', 'quotation:manage', 'inventory:update'],
        description: 'Manage vendor catalogue, inventory, and quotations',
      },
      {
        key: 'vendor_accountant',
        name: 'Vendor Accountant',
        portalType: PortalType.VENDOR,
        permissions: ['invoices:read', 'transactions:update'],
        description: 'Handles vendor invoices and financial entries',
      },
      {
        key: 'vendor_staff',
        name: 'Vendor Staff',
        portalType: PortalType.VENDOR,
        permissions: ['orders:read', 'products:read'],
        description: 'Processes assigned orders with limited access',
      },
      {
        key: 'vendor_viewer',
        name: 'Vendor Viewer',
        portalType: PortalType.VENDOR,
        permissions: ['dashboard:read', 'orders:read'],
        description: 'Read-only visibility into vendor dashboards and orders',
      },
      {
        key: 'customer_admin',
        name: 'Customer Admin',
        portalType: PortalType.CUSTOMER,
        permissions: ['*'],
        description: 'Full access to manage customer portal activities',
      },
      {
        key: 'customer_manager',
        name: 'Customer Manager',
        portalType: PortalType.CUSTOMER,
        permissions: ['rfq:manage', 'orders:approve'],
        description: 'Manage RFQs and customer orders',
      },
      {
        key: 'customer_accountant',
        name: 'Customer Accountant',
        portalType: PortalType.CUSTOMER,
        permissions: ['invoices:read', 'transactions:read'],
        description: 'Views and reconciles customer financial records',
      },
      {
        key: 'customer_viewer',
        name: 'Customer Viewer',
        portalType: PortalType.CUSTOMER,
        permissions: ['orders:read', 'invoices:read', 'dashboard:read'],
        description: 'Read-only access to customer dashboards and records',
      },
    ];

    for (const roleDef of defaultRoles) {
      const existingRole = await Role.findOne({ key: roleDef.key });
      if (!existingRole) {
        await Role.create({
          ...roleDef,
          permissions: roleDef.permissions,
          isSystem: true,
        });
        logger.info(`✅ Seeded default role: ${roleDef.name} [${roleDef.portalType}]`);
      } else {
        let updated = false;
        if (existingRole.name !== roleDef.name) {
          existingRole.name = roleDef.name;
          updated = true;
        }
        if (existingRole.portalType !== roleDef.portalType) {
          existingRole.portalType = roleDef.portalType;
          updated = true;
        }
        const existingPermissions = (existingRole.permissions || []).sort().join(',');
        const desiredPermissions = (roleDef.permissions || []).sort().join(',');
        if (existingPermissions !== desiredPermissions) {
          existingRole.permissions = roleDef.permissions;
          updated = true;
        }
        if (roleDef.description && existingRole.description !== roleDef.description) {
          existingRole.description = roleDef.description;
          updated = true;
        }
        if (!existingRole.isSystem) {
          existingRole.isSystem = true;
          updated = true;
        }
        if (updated) {
          await existingRole.save();
          logger.info(`🔄 Updated default role: ${roleDef.name} [${roleDef.portalType}]`);
        }
      }
    }

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

    const euroasiannGroupId = new Types.ObjectId(euroasiannGroup.id);

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
        organizationId: euroasiannGroupId,
        isActive: true,
      });
      logger.info('✅ Created Tech Admin User');
      logger.info(`   Email: ${techAdminEmail}`);
      logger.info(`   Password: TechAdmin123!`);
      logger.info(`   Organization: Euroasiann Group`);
    } else {
      // Update existing tech admin to Euroasiann Group
      if (techAdmin.organizationId?.toString() !== euroasiannGroupId.toString()) {
        techAdmin.organizationId = euroasiannGroupId;
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
        organizationId: euroasiannGroupId,
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
      jayUser.organizationId = euroasiannGroupId;
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
        organizationId: euroasiannGroupId, // Same organization as tech users
        isActive: true,
      });
      logger.info('✅ Created Admin User');
      logger.info(`   Email: ${adminEmail}`);
      logger.info(`   Password: Admin123!`);
      logger.info(`   Organization: Euroasiann Group`);
    } else {
      // Update existing admin to Euroasiann Group
      if (admin.organizationId?.toString() !== euroasiannGroupId.toString()) {
        admin.organizationId = euroasiannGroupId;
        await admin.save();
        logger.info('✅ Updated Admin User to Euroasiann Group');
      }
    }

    // Update any existing tech portal users to Euroasiann Group
    const techUsers = await User.find({ portalType: PortalType.TECH });
    for (const user of techUsers) {
      if (user.organizationId?.toString() !== euroasiannGroupId.toString()) {
        user.organizationId = euroasiannGroupId;
        await user.save();
        logger.info(`✅ Updated tech user ${user.email} to Euroasiann Group`);
      }
    }

    // Update any existing admin portal users to Euroasiann Group
    const adminUsers = await User.find({ portalType: PortalType.ADMIN });
    for (const user of adminUsers) {
      if (user.organizationId?.toString() !== euroasiannGroupId.toString()) {
        user.organizationId = euroasiannGroupId;
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
          { organizationId: euroasiannGroupId }
        );
        logger.info(`✅ Migrated ${usersInOldOrg.length} users from "Euroasiann Platform Admin" to Euroasiann Group`);
      }
      // Check for licenses
      const licensesInOldOrg = await License.find({ organizationId: oldTechOrg._id });
      if (licensesInOldOrg.length > 0) {
        logger.warn(`⚠️  Found ${licensesInOldOrg.length} license(s) associated with "Euroasiann Platform Admin". Moving to Euroasiann Group...`);
        await License.updateMany(
          { organizationId: oldTechOrg._id },
          { organizationId: euroasiannGroupId }
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
          { organizationId: euroasiannGroupId }
        );
        logger.info(`✅ Migrated ${usersInOldOrg.length} users from "Admin Portal Organization" to Euroasiann Group`);
      }
      // Check for licenses
      const licensesInOldOrg = await License.find({ organizationId: oldAdminOrg._id });
      if (licensesInOldOrg.length > 0) {
        logger.warn(`⚠️  Found ${licensesInOldOrg.length} license(s) associated with "Admin Portal Organization". Moving to Euroasiann Group...`);
        await License.updateMany(
          { organizationId: oldAdminOrg._id },
          { organizationId: euroasiannGroupId }
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
