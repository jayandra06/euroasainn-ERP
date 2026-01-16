import mongoose from 'mongoose';
import { CustomerVendorInvitation, ICustomerVendorInvitation } from '../models/customer-vendor-invitation.model';
import { User } from '../models/user.model';
import { logger } from '../config/logger';
import crypto from 'crypto';

export class CustomerVendorInvitationService {
  /**
   * Generate a secure invitation token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new customer-vendor invitation
   */
  async createInvitation(data: {
    customerOrganizationId: string;
    vendorEmail: string;
    vendorName: string;
    vendorFirstName?: string;
    vendorLastName?: string;
    vendorOrganizationId?: string;
  }): Promise<ICustomerVendorInvitation> {
    // Convert string IDs to ObjectIds
    const customerOrgId = new mongoose.Types.ObjectId(data.customerOrganizationId);
    const vendorOrgId = data.vendorOrganizationId 
      ? new mongoose.Types.ObjectId(data.vendorOrganizationId)
      : undefined;
    const normalizedEmail = data.vendorEmail.toLowerCase().trim();
    
    // Check if a pending invitation already exists for this customer-vendor pair
    const existingInvitation = await CustomerVendorInvitation.findOne({
      customerOrganizationId: customerOrgId,
      vendorEmail: normalizedEmail,
      status: 'pending',
    });
    
    if (existingInvitation) {
      logger.info(`ℹ️ Pending invitation already exists for ${normalizedEmail} from customer ${data.customerOrganizationId}. Returning existing invitation.`);
      return existingInvitation;
    }
    
    const token = this.generateToken();
    
    const invitation = new CustomerVendorInvitation({
      customerOrganizationId: customerOrgId,
      vendorEmail: normalizedEmail,
      vendorName: data.vendorName,
      vendorFirstName: data.vendorFirstName,
      vendorLastName: data.vendorLastName,
      vendorOrganizationId: vendorOrgId,
      status: 'pending',
      invitationToken: token,
    });

    await invitation.save();
    logger.info(`✅ Created customer-vendor invitation for ${normalizedEmail}`, {
      invitationId: invitation._id,
      customerOrgId: customerOrgId.toString(),
      vendorOrgId: vendorOrgId?.toString(),
    });
    
    return invitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<ICustomerVendorInvitation | null> {
    return await CustomerVendorInvitation.findOne({
      invitationToken: token,
      status: 'pending',
    });
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string): Promise<ICustomerVendorInvitation> {
    const invitation = await this.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    // If vendor organization exists, add customer to visibility
    if (invitation.vendorOrganizationId) {
      const { organizationService } = await import('./organization.service');
      await organizationService.addCustomerToVendorVisibility(
        invitation.vendorOrganizationId.toString(),
        invitation.customerOrganizationId.toString()
      );
    }

    logger.info(`✅ Customer-vendor invitation accepted for ${invitation.vendorEmail}`);
    return invitation;
  }

  /**
   * Decline invitation
   */
  async declineInvitation(token: string): Promise<ICustomerVendorInvitation> {
    const invitation = await this.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    invitation.status = 'declined';
    invitation.declinedAt = new Date();
    await invitation.save();

    logger.info(`❌ Customer-vendor invitation declined for ${invitation.vendorEmail}`);
    return invitation;
  }

  /**
   * Get invitations for a customer organization
   */
  async getCustomerInvitations(customerOrganizationId: string): Promise<ICustomerVendorInvitation[]> {
    return await CustomerVendorInvitation.find({
      customerOrganizationId,
    }).sort({ createdAt: -1 });
  }

  /**
   * Check if vendor email exists in the system
   */
  async checkVendorEmailExists(email: string): Promise<{ exists: boolean; vendorOrganizationId?: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists with vendor portal type
    const user = await User.findOne({
      email: normalizedEmail,
      portalType: 'vendor',
    });

    if (user && user.organizationId) {
      return {
        exists: true,
        vendorOrganizationId: user.organizationId.toString(),
      };
    }

    return { exists: false };
  }
}

export const customerVendorInvitationService = new CustomerVendorInvitationService();

