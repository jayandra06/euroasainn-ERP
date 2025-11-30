import { CustomerOnboarding, ICustomerOnboarding } from '../models/customer-onboarding.model';
import { VendorOnboarding, IVendorOnboarding } from '../models/vendor-onboarding.model';
import { InvitationToken } from '../models/invitation-token.model';
import { Organization } from '../models/organization.model';
import { logger } from '../config/logger';
import { emailService } from './email.service';
import { licenseService } from './license.service';
import { userService } from './user.service';
import { OrganizationType, PortalType } from '@euroasiann/shared';

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

    // Create onboarding record with 'completed' status (form submitted, awaiting admin approval)
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

    // Don't send email here - it will be sent after approval
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

    // Create onboarding record with 'completed' status (form submitted, awaiting admin approval)
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

    // Don't send email here - it will be sent after approval
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

    // Don't create license automatically - redirect to license creation page
    // License will be created manually with pricing information
    logger.info(`✅ Onboarding approved. License should be created manually with pricing information.`);

    // Send success email with credentials after approval
    try {
      // Find user by organization ID (user was created when organization was created)
      const { User } = await import('../models/user.model');
      let user = await User.findOne({ 
        organizationId: orgIdString, 
        portalType: PortalType.CUSTOMER 
      });
      
      // If not found by organization, try to find by onboarding email
      if (!user) {
        const userEmail = onboarding.email;
        if (userEmail) {
          logger.info(`🔍 User not found by organization, trying by email: ${userEmail}`);
          user = await User.findOne({ 
            email: userEmail.toLowerCase().trim(), 
            portalType: PortalType.CUSTOMER 
          });
        }
      }
      
      if (user) {
        const userEmail = user.email;
        logger.info(`✅ Found user for approval email: ${userEmail}`);
        
        const { temporaryPassword } = await userService.resetUserTemporaryPassword(userEmail, PortalType.CUSTOMER);
        
        // Build portal link
        const portalLink = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300';
        
        // Use onboarding contact person name if available, otherwise use user's name
        const firstName = onboarding.contactPerson?.split(' ')[0] || user.firstName || 'User';
        const lastName = onboarding.contactPerson?.split(' ').slice(1).join(' ') || user.lastName || '';
        
        await emailService.sendWelcomeEmail({
          to: userEmail,
          firstName,
          lastName,
          portalLink: `${portalLink}/login`,
          temporaryPassword,
          organizationType: 'customer',
        });
        
        logger.info(`✅ Success email with credentials sent to ${userEmail} after approval`);
      } else {
        logger.warn(`⚠️ User not found for organization ${orgIdString} or email ${onboarding.email}, skipping success email`);
        logger.warn(`   Organization ID: ${orgIdString}`);
        logger.warn(`   Onboarding email: ${onboarding.email}`);
      }
    } catch (error: any) {
      logger.error('Failed to send success email after approval:', error);
      logger.error(`   Error message: ${error.message}`);
      logger.error(`   Error stack: ${error.stack}`);
      // Don't fail approval if email fails
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

    // Don't create license automatically - redirect to license creation page
    // License will be created manually with pricing information
    logger.info(`✅ Vendor onboarding approved. License should be created manually with pricing information.`);

    // Send success email with credentials after approval
    try {
      // Get user email from onboarding data
      const userEmail = onboarding.email;
      if (userEmail) {
        // Get user to reset password
        const { User } = await import('../models/user.model');
        const user = await User.findOne({ email: userEmail, portalType: PortalType.VENDOR });
        
        if (user) {
          const { temporaryPassword } = await userService.resetUserTemporaryPassword(userEmail, PortalType.VENDOR);
          
          // Build portal link
          const portalLink = process.env.VENDOR_PORTAL_URL || 'http://localhost:4400';
          
          const firstName = onboarding.contactPerson?.split(' ')[0] || user.firstName || 'User';
          const lastName = onboarding.contactPerson?.split(' ').slice(1).join(' ') || user.lastName || '';
          
          // Check if this is an external vendor (invited by customer)
          const isExternalVendor = organization.invitedBy === 'customer' || 
                                   (organization.invitedByOrganizationId && organization.isAdminInvited === false);
          
          logger.info(`📧 Sending welcome email to vendor - isExternalVendor: ${isExternalVendor}, invitedBy: ${organization.invitedBy}`);
          
          await emailService.sendWelcomeEmail({
            to: userEmail,
            firstName,
            lastName,
            portalLink: `${portalLink}/login`,
            temporaryPassword,
            organizationType: 'vendor',
            isExternalVendor,
          });
          
          logger.info(`✅ Success email with credentials sent to ${userEmail} after approval`);
        } else {
          logger.warn(`⚠️ User not found for email ${userEmail}, skipping success email`);
        }
      } else {
        logger.warn(`⚠️ No email found in onboarding data, skipping success email`);
      }
    } catch (error) {
      logger.error('Failed to send success email after approval:', error);
      // Don't fail approval if email fails
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


