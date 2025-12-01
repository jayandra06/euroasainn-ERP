/**
 * Script to check if a vendor is internal or external
 * 
 * Run with: npx tsx apps/api/src/scripts/check-vendor-type.ts <email>
 */

import { connectDatabase } from '../config/database';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { logger } from '../config/logger';

async function checkVendorType(email: string) {
  try {
    await connectDatabase();
    logger.info(`Checking vendor type for email: ${email}`);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      logger.error(`User not found with email: ${email}`);
      process.exit(1);
    }

    logger.info(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    logger.info(`Organization ID: ${user.organizationId}`);

    if (!user.organizationId) {
      logger.error('User has no organization ID');
      process.exit(1);
    }

    // Find organization
    const organization = await Organization.findById(user.organizationId);
    
    if (!organization) {
      logger.error('Organization not found');
      process.exit(1);
    }

    logger.info(`\nOrganization Details:`);
    logger.info(`  Name: ${organization.name}`);
    logger.info(`  Type: ${organization.type}`);
    logger.info(`  Portal Type: ${organization.portalType}`);
    logger.info(`  invitedBy: ${organization.invitedBy || 'undefined'}`);
    logger.info(`  invitedByOrganizationId: ${organization.invitedByOrganizationId || 'undefined'}`);
    logger.info(`  isAdminInvited: ${organization.isAdminInvited}`);

    // Determine if external or internal
    const hasInvitedByOrgId = !!(organization.invitedByOrganizationId && organization.invitedByOrganizationId.toString());
    const invitedBy = organization.invitedBy ? String(organization.invitedBy).toLowerCase() : null;
    const isAdminInvited = organization.isAdminInvited === true;

    const isExternalVendor = 
      invitedBy === 'customer' ||
      hasInvitedByOrgId ||
      (!isAdminInvited && invitedBy !== 'admin' && invitedBy !== 'tech');

    logger.info(`\nVendor Classification:`);
    logger.info(`  isExternalVendor: ${isExternalVendor}`);
    logger.info(`  Vendor Type: ${isExternalVendor ? 'EXTERNAL (invited by customer)' : 'INTERNAL (invited by admin/tech)'}`);
    logger.info(`  Payment Required: ${isExternalVendor ? 'NO' : 'YES'}`);

    if (hasInvitedByOrgId) {
      const customerOrg = await Organization.findById(organization.invitedByOrganizationId);
      logger.info(`  Invited by customer organization: ${customerOrg?.name || 'Unknown'}`);
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('Error checking vendor type:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  logger.error('Please provide an email address as argument');
  logger.error('Usage: npx tsx apps/api/src/scripts/check-vendor-type.ts <email>');
  process.exit(1);
}

checkVendorType(email);




