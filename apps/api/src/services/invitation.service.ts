import { v4 as uuidv4 } from 'uuid';
import { InvitationToken } from '../models/invitation-token.model';
import { OrganizationType, PortalType } from '@euroasiann/shared';
import { emailService } from './email.service';
import { logger } from '../config/logger';

export class InvitationService {
  async createInvitationToken(data: {
    email: string;
    organizationId?: string;
    organizationType: OrganizationType;
    portalType: PortalType;
    role: string;
    organizationName?: string;
  }) {
    // Generate unique token
    const token = uuidv4();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation token record
    const invitationToken = new InvitationToken({
      token,
      email: data.email,
      organizationId: data.organizationId,
      organizationType: data.organizationType,
      portalType: data.portalType,
      role: data.role,
      expiresAt,
      used: false,
    });

    await invitationToken.save();

    // Generate invitation link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const onboardingPath = data.organizationType === OrganizationType.CUSTOMER 
      ? '/onboarding/customer' 
      : '/onboarding/vendor';
    const invitationLink = `${baseUrl}${onboardingPath}?token=${token}`;

    logger.info(`Created invitation token for ${data.email}: ${token}`);
    logger.info(`Invitation link: ${invitationLink}`);

    return {
      token,
      invitationLink,
      expiresAt,
    };
  }

  async sendInvitationEmail(data: {
    email: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationType: OrganizationType;
    invitationLink: string;
    temporaryPassword?: string;
  }) {
    try {
      await emailService.sendInvitationEmail({
        to: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: data.organizationName,
        organizationType: data.organizationType === OrganizationType.CUSTOMER ? 'customer' : 'vendor',
        invitationLink: data.invitationLink,
        temporaryPassword: data.temporaryPassword,
      });

      logger.info(`Invitation email sent to ${data.email}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send invitation email to ${data.email}:`, error);
      throw error;
    }
  }

  async getInvitationByToken(token: string) {
    const invitation = await InvitationToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    }).populate('organizationId');

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    return invitation;
  }
}

export const invitationService = new InvitationService();

