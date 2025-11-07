import { CustomerOnboarding, ICustomerOnboarding } from '../models/customer-onboarding.model';
import { VendorOnboarding, IVendorOnboarding } from '../models/vendor-onboarding.model';
import { InvitationToken } from '../models/invitation-token.model';
import { Organization } from '../models/organization.model';
import { logger } from '../config/logger';
import { emailService } from './email.service';
import { licenseService } from './license.service';
import { OrganizationType } from '@euroasiann/shared';

const INVITATION_STATUS_PENDING = 'pending';
const INVITATION_STATUS_USED = 'used';

export class OnboardingService {
  async getInvitationByToken(token: string) {
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
      $or: [
        { status: INVITATION_STATUS_PENDING },
        { status: { $exists: false } },
      ],
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    if (!invitation.status) {
      invitation.status = INVITATION_STATUS_PENDING;
      await invitation.save();
    }

    return invitation;
  }

  async submitCustomerOnboarding(data: Partial<ICustomerOnboarding>, token: string) {
    // Verify invitation token
    const invitation = await this.getInvitationByToken(token);

    if (invitation.organizationType !== 'customer') {
      throw new Error('Invalid invitation type');
    }

    // Check if onboarding already exists for this token
    const existing = await CustomerOnboarding.findOne({ invitationToken: token });
    if (existing) {
      throw new Error('Onboarding already submitted for this invitation');
    }

    // Extract organizationId - should be ObjectId or string now (no populate)
    const orgId = invitation.organizationId || null;

    if (!orgId) {
      logger.error('❌ No organizationId found in invitation token');
      throw new Error('Invalid invitation: organizationId is missing');
    }

    logger.info(`Creating customer onboarding record for organizationId: ${orgId}`);

    // Create onboarding record with 'completed' status (form submitted, awaiting approval)
    const onboarding = new CustomerOnboarding({
      ...data,
      invitationToken: token,
      organizationId: orgId,
      status: 'completed',
      submittedAt: new Date(),
    });

    await onboarding.save();
    logger.info(`✅ Customer onboarding record saved with ID: ${onboarding._id}`);

    // Mark invitation token as used
    invitation.used = true;
    invitation.status = INVITATION_STATUS_USED;
    invitation.usedAt = new Date();
    await invitation.save();

    // Update organization name from onboarding data (but don't mark as active yet - wait for approval)
    const orgIdString = orgId ? orgId.toString() : null;
    
    if (orgIdString) {
      logger.info(`Looking up organization with ID: ${orgIdString}`);
      const organization = await Organization.findById(orgIdString);
      
      if (organization) {
        logger.info(`✅ Found organization: ${organization.name} (ID: ${organization._id})`);
        // Update organization details from onboarding (but keep isActive as false until approved)
        organization.name = data.companyName || organization.name;
        await organization.save();
        logger.info(`✅ Organization ${organization.name} updated (waiting for approval)`);
      } else {
        logger.error(`❌ Organization not found with ID: ${orgIdString}`);
      }
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        to: invitation.email,
        firstName: data.contactPerson?.split(' ')[0] || 'User',
        lastName: data.contactPerson?.split(' ').slice(1).join(' ') || '',
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // Don't fail onboarding if email fails
    }

    logger.info(`Customer onboarding completed for ${data.email}`);
    return onboarding;
  }

  async submitVendorOnboarding(data: Partial<IVendorOnboarding>, token: string) {
    // Verify invitation token
    const invitation = await this.getInvitationByToken(token);

    if (invitation.organizationType !== 'vendor') {
      throw new Error('Invalid invitation type');
    }

    // Check if onboarding already exists for this token
    const existing = await VendorOnboarding.findOne({ invitationToken: token });
    if (existing) {
      throw new Error('Onboarding already submitted for this invitation');
    }

    // Extract organizationId - should be ObjectId or string now (no populate)
    const orgId = invitation.organizationId || null;

    if (!orgId) {
      logger.error('❌ No organizationId found in invitation token');
      throw new Error('Invalid invitation: organizationId is missing');
    }

    logger.info(`Creating vendor onboarding record for organizationId: ${orgId}`);

    // Create onboarding record with 'completed' status (form submitted, awaiting approval)
    const onboarding = new VendorOnboarding({
      ...data,
      invitationToken: token,
      organizationId: orgId,
      status: 'completed',
      submittedAt: new Date(),
    });

    await onboarding.save();
    logger.info(`✅ Vendor onboarding record saved with ID: ${onboarding._id}`);

    // Mark invitation token as used
    invitation.used = true;
    invitation.status = INVITATION_STATUS_USED;
    invitation.usedAt = new Date();
    await invitation.save();

    // Update organization name from onboarding data (but don't mark as active yet - wait for approval)
    const orgIdString = orgId ? orgId.toString() : null;
    
    if (orgIdString) {
      logger.info(`Looking up vendor organization with ID: ${orgIdString}`);
      const organization = await Organization.findById(orgIdString);
      
      if (organization) {
        logger.info(`✅ Found vendor organization: ${organization.name} (ID: ${organization._id})`);
        // Update organization details from onboarding (but keep isActive as false until approved)
        organization.name = data.companyName || organization.name;
        await organization.save();
        logger.info(`✅ Vendor organization ${organization.name} updated (waiting for approval)`);
      } else {
        logger.error(`❌ Vendor organization not found with ID: ${orgIdString}`);
      }
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({
        to: invitation.email,
        firstName: data.contactPerson?.split(' ')[0] || 'User',
        lastName: data.contactPerson?.split(' ').slice(1).join(' ') || '',
      });
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
      // Don't fail onboarding if email fails
    }

    logger.info(`Vendor onboarding completed for ${data.email}`);
    return onboarding;
  }

  async getCustomerOnboardings(filters?: { organizationId?: string; status?: string }) {
    const query: any = {};
    if (filters?.organizationId) {
      query.organizationId = filters.organizationId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    return await CustomerOnboarding.find(query).sort({ createdAt: -1 });
  }

  async getVendorOnboardings(filters?: { organizationId?: string; status?: string }) {
    const query: any = {};
    if (filters?.organizationId) {
      query.organizationId = filters.organizationId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    return await VendorOnboarding.find(query).sort({ createdAt: -1 });
  }

  async getCustomerOnboardingById(id: string) {
    const onboarding = await CustomerOnboarding.findById(id);
    if (!onboarding) {
      throw new Error('Customer onboarding not found');
    }
    return onboarding;
  }

  async getVendorOnboardingById(id: string) {
    const onboarding = await VendorOnboarding.findById(id);
    if (!onboarding) {
      throw new Error('Vendor onboarding not found');
    }
    return onboarding;
  }

  async approveCustomerOnboarding(id: string) {
    logger.info(`🔍 Attempting to approve customer onboarding with ID: ${id}`);
    
    const onboarding = await CustomerOnboarding.findById(id);
    if (!onboarding) {
      logger.error(`❌ Customer onboarding not found with ID: ${id}`);
      throw new Error('Customer onboarding not found');
    }

    logger.info(`📋 Found onboarding: ${onboarding.companyName}, Status: ${onboarding.status}, OrganizationId: ${onboarding.organizationId}`);

    if (onboarding.status === 'approved') {
      logger.warn(`⚠️ Onboarding ${id} is already approved`);
      throw new Error('Onboarding is already approved');
    }

    if (onboarding.status === 'rejected') {
      logger.warn(`⚠️ Cannot approve rejected onboarding ${id}`);
      throw new Error('Cannot approve a rejected onboarding');
    }

    // Update onboarding status
    onboarding.status = 'approved';
    onboarding.approvedAt = new Date();
    await onboarding.save();
    logger.info(`✅ Customer onboarding ${id} approved`);

    // Get organization
    const orgIdString = onboarding.organizationId?.toString();
    if (!orgIdString) {
      logger.error(`❌ Organization ID is missing from onboarding ${id}`);
      logger.error(`   Onboarding data: ${JSON.stringify({ _id: onboarding._id, companyName: onboarding.companyName, organizationId: onboarding.organizationId })}`);
      throw new Error('Organization ID is missing from onboarding');
    }

    logger.info(`🔍 Looking up organization with ID: ${orgIdString}`);
    const organization = await Organization.findById(orgIdString);
    if (!organization) {
      logger.error(`❌ Organization not found with ID: ${orgIdString}`);
      throw new Error(`Organization not found with ID: ${orgIdString}`);
    }
    
    logger.info(`✅ Found organization: ${organization.name} (Type: ${organization.type}, PortalType: ${organization.portalType})`);

    // Mark organization as active
    organization.isActive = true;
    await organization.save();
    logger.info(`✅ Organization ${organization.name} marked as active`);

    // Create license if it doesn't exist
    try {
      const existingLicenses = await licenseService.getLicenses(orgIdString);
      
      if (existingLicenses.length === 0) {
        // Create a default license (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Determine usage limits based on number of vessels if provided
        const vesselsCount = onboarding.vessels ? parseInt(onboarding.vessels.toString(), 10) : 0;
        const defaultUserLimit = Math.max(10, vesselsCount * 2); // At least 10 users, or 2 per vessel

        logger.info(`Creating license for organization ${orgIdString} with expiry: ${expiresAt.toISOString()}`);
        logger.info(`License limits: users=${defaultUserLimit}, vessels=${vesselsCount || 10}, items=1000`);

        const license = await licenseService.createLicense({
          organizationId: orgIdString,
          organizationType: OrganizationType.CUSTOMER,
          expiresAt,
          usageLimits: {
            users: defaultUserLimit,
            vessels: vesselsCount || 10,
            items: 1000,
            employees: 50,
            businessUnits: 5,
          },
        });

        logger.info(`✅ License created successfully for organization ${organization.name}`);
        logger.info(`   License Key: ${license.licenseKey}`);
        logger.info(`   License ID: ${license._id}`);
      } else {
        logger.info(`License already exists for organization ${organization.name}, skipping creation`);
      }
    } catch (licenseError: any) {
      logger.error(`❌ Failed to create license for organization ${organization.name}:`);
      logger.error(`   Error: ${licenseError.message}`);
      throw new Error(`Failed to create license: ${licenseError.message}`);
    }

    return onboarding;
  }

  async rejectCustomerOnboarding(id: string, rejectionReason?: string) {
    const onboarding = await CustomerOnboarding.findById(id);
    if (!onboarding) {
      throw new Error('Customer onboarding not found');
    }

    if (onboarding.status === 'rejected') {
      throw new Error('Onboarding is already rejected');
    }

    if (onboarding.status === 'approved') {
      throw new Error('Cannot reject an approved onboarding');
    }

    // Update onboarding status
    onboarding.status = 'rejected';
    onboarding.rejectedAt = new Date();
    if (rejectionReason) {
      onboarding.rejectionReason = rejectionReason;
    }
    await onboarding.save();
    logger.info(`✅ Customer onboarding ${id} rejected`);

    return onboarding;
  }

  async approveVendorOnboarding(id: string) {
    logger.info(`🔍 Attempting to approve vendor onboarding with ID: ${id}`);
    
    const onboarding = await VendorOnboarding.findById(id);
    if (!onboarding) {
      logger.error(`❌ Vendor onboarding not found with ID: ${id}`);
      throw new Error('Vendor onboarding not found');
    }

    logger.info(`📋 Found onboarding: ${onboarding.companyName}, Status: ${onboarding.status}, OrganizationId: ${onboarding.organizationId}`);

    if (onboarding.status === 'approved') {
      logger.warn(`⚠️ Onboarding ${id} is already approved`);
      throw new Error('Onboarding is already approved');
    }

    if (onboarding.status === 'rejected') {
      logger.warn(`⚠️ Cannot approve rejected onboarding ${id}`);
      throw new Error('Cannot approve a rejected onboarding');
    }

    // Update onboarding status
    onboarding.status = 'approved';
    onboarding.approvedAt = new Date();
    await onboarding.save();
    logger.info(`✅ Vendor onboarding ${id} approved`);

    // Get organization
    const orgIdString = onboarding.organizationId?.toString();
    if (!orgIdString) {
      logger.error(`❌ Organization ID is missing from vendor onboarding ${id}`);
      logger.error(`   Onboarding data: ${JSON.stringify({ _id: onboarding._id, companyName: onboarding.companyName, organizationId: onboarding.organizationId })}`);
      throw new Error('Organization ID is missing from onboarding');
    }

    logger.info(`🔍 Looking up vendor organization with ID: ${orgIdString}`);
    const organization = await Organization.findById(orgIdString);
    if (!organization) {
      logger.error(`❌ Vendor organization not found with ID: ${orgIdString}`);
      throw new Error(`Organization not found with ID: ${orgIdString}`);
    }
    
    logger.info(`✅ Found vendor organization: ${organization.name} (Type: ${organization.type}, PortalType: ${organization.portalType})`);

    // Mark organization as active
    organization.isActive = true;
    await organization.save();
    logger.info(`✅ Vendor organization ${organization.name} marked as active`);

    // Create license if it doesn't exist
    try {
      const existingLicenses = await licenseService.getLicenses(orgIdString);
      
      if (existingLicenses.length === 0) {
        // Create a default license (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Default usage limits for vendors
        logger.info(`Creating license for vendor organization ${orgIdString} with expiry: ${expiresAt.toISOString()}`);

        const license = await licenseService.createLicense({
          organizationId: orgIdString,
          organizationType: OrganizationType.VENDOR,
          expiresAt,
          usageLimits: {
            users: 10,
            vessels: 10,
            items: 1000,
            employees: 50,
            businessUnits: 5,
          },
        });

        logger.info(`✅ License created successfully for vendor organization ${organization.name}`);
        logger.info(`   License Key: ${license.licenseKey}`);
        logger.info(`   License ID: ${license._id}`);
      } else {
        logger.info(`License already exists for vendor organization ${organization.name}, skipping creation`);
      }
    } catch (licenseError: any) {
      logger.error(`❌ Failed to create license for vendor organization ${organization.name}:`);
      logger.error(`   Error: ${licenseError.message}`);
      throw new Error(`Failed to create license: ${licenseError.message}`);
    }

    return onboarding;
  }

  async rejectVendorOnboarding(id: string, rejectionReason?: string) {
    const onboarding = await VendorOnboarding.findById(id);
    if (!onboarding) {
      throw new Error('Vendor onboarding not found');
    }

    if (onboarding.status === 'rejected') {
      throw new Error('Onboarding is already rejected');
    }

    if (onboarding.status === 'approved') {
      throw new Error('Cannot reject an approved onboarding');
    }

    // Update onboarding status
    onboarding.status = 'rejected';
    onboarding.rejectedAt = new Date();
    if (rejectionReason) {
      onboarding.rejectionReason = rejectionReason;
    }
    await onboarding.save();
    logger.info(`✅ Vendor onboarding ${id} rejected`);

    return onboarding;
  }
}

export const onboardingService = new OnboardingService();


