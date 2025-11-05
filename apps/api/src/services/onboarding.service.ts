import { CustomerOnboarding, ICustomerOnboarding } from '../models/customer-onboarding.model';
import { VendorOnboarding, IVendorOnboarding } from '../models/vendor-onboarding.model';
import { InvitationToken } from '../models/invitation-token.model';
import { Organization } from '../models/organization.model';
import { User } from '../models/user.model';
import { logger } from '../config/logger';
import { emailService } from './email.service';

export class OnboardingService {
  async getInvitationByToken(token: string) {
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
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

    // Create onboarding record
    const onboarding = new CustomerOnboarding({
      ...data,
      invitationToken: token,
      organizationId: invitation.organizationId,
      status: 'completed',
      submittedAt: new Date(),
    });

    await onboarding.save();

    // Mark invitation token as used
    invitation.used = true;
    invitation.usedAt = new Date();
    await invitation.save();

    // Update organization if exists
    if (invitation.organizationId) {
      const organization = await Organization.findById(invitation.organizationId);
      if (organization) {
        // Update organization details from onboarding
        organization.name = data.companyName || organization.name;
        await organization.save();
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

    // Create onboarding record
    const onboarding = new VendorOnboarding({
      ...data,
      invitationToken: token,
      organizationId: invitation.organizationId,
      status: 'completed',
      submittedAt: new Date(),
    });

    await onboarding.save();

    // Mark invitation token as used
    invitation.used = true;
    invitation.usedAt = new Date();
    await invitation.save();

    // Update organization if exists
    if (invitation.organizationId) {
      const organization = await Organization.findById(invitation.organizationId);
      if (organization) {
        // Update organization details from onboarding
        organization.name = data.companyName || organization.name;
        await organization.save();
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
}

export const onboardingService = new OnboardingService();

