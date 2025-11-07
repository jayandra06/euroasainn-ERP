import { v4 as uuidv4 } from 'uuid';
import { InvitationToken } from '../models/invitation-token.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
import { emailService } from './email.service';
import { logger } from '../config/logger';
import { Organization } from '../models/organization.model';
import { userService } from './user.service';

function buildFrontEndOnboardingLink(organizationType: OrganizationType, token: string) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4300';
  const onboardingPath = organizationType === OrganizationType.CUSTOMER ? '/onboarding/customer' : '/onboarding/vendor';
  return `${baseUrl}${onboardingPath}?token=${token}`;
}

const INVITATION_STATUS_PENDING = 'pending';
const INVITATION_STATUS_REVOKED = 'revoked';
const INVITATION_STATUS_USED = 'used';
const INVITATION_STATUS_EXPIRED = 'expired';

export class InvitationService {
  async createInvitationToken(data: {
    email: string;
    organizationId?: string;
    organizationType: OrganizationType;
    portalType: PortalType;
    role: string;
    organizationName?: string;
    resendCount?: number;
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
      status: INVITATION_STATUS_PENDING,
      resendCount: data.resendCount ?? 0,
    });

    await invitationToken.save();

    // Generate invitation link
    const invitationLink = buildFrontEndOnboardingLink(data.organizationType, token);

    logger.info(`Created invitation token for ${data.email}: ${token}`);
    logger.info(`Invitation link: ${invitationLink}`);

    return {
      invitationId: invitationToken._id.toString(),
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
      $or: [
        { status: INVITATION_STATUS_PENDING },
        { status: { $exists: false } },
      ],
    }).populate('organizationId');

    if (!invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    if (!invitation.status) {
      invitation.status = INVITATION_STATUS_PENDING;
      await invitation.save();
    }

    return invitation;
  }

  async getOrganizationInvitations(organizationId: string, includeAllStatuses = false) {
    const query: any = { organizationId };
    if (!includeAllStatuses) {
      query.used = false;
      query.status = { $in: [INVITATION_STATUS_PENDING, null] };
    }

    const invitations = await InvitationToken.find(query).sort({ createdAt: -1 });
    const now = new Date();
    const updates: Promise<any>[] = [];

    invitations.forEach((invitation) => {
      const status = invitation.status || (invitation.used ? INVITATION_STATUS_USED : INVITATION_STATUS_PENDING);
      if (status === INVITATION_STATUS_PENDING && invitation.expiresAt < now) {
        invitation.status = INVITATION_STATUS_EXPIRED;
        invitation.used = true;
        invitation.usedAt = invitation.usedAt || now;
        updates.push(invitation.save());
      } else if (!invitation.status) {
        invitation.status = status;
        updates.push(invitation.save());
      }
    });

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return invitations;
  }

  async revokeInvitation(invitationId: string, organizationId?: string) {
    const invitation = await InvitationToken.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (organizationId && invitation.organizationId?.toString() !== organizationId) {
      throw new Error('Invitation does not belong to this organization');
    }

    const effectiveStatus = invitation.status || (invitation.used ? INVITATION_STATUS_USED : INVITATION_STATUS_PENDING);
    if (effectiveStatus !== INVITATION_STATUS_PENDING) {
      throw new Error('Only pending invitations can be revoked');
    }

    invitation.status = INVITATION_STATUS_REVOKED;
    invitation.used = true;
    invitation.usedAt = new Date();
    invitation.revokedAt = new Date();
    await invitation.save();

    return invitation;
  }

  async resendInvitation(invitationId: string, organizationId?: string) {
    const invitation = await InvitationToken.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (organizationId && invitation.organizationId?.toString() !== organizationId) {
      throw new Error('Invitation does not belong to this organization');
    }

    const effectiveStatus = invitation.status || (invitation.used ? INVITATION_STATUS_USED : INVITATION_STATUS_PENDING);
    if (effectiveStatus !== INVITATION_STATUS_PENDING) {
      throw new Error('Only pending invitations can be resent');
    }

    const organization = invitation.organizationId ? await Organization.findById(invitation.organizationId) : null;

    // Mark existing invitation as revoked
    invitation.status = INVITATION_STATUS_REVOKED;
    invitation.used = true;
    invitation.usedAt = new Date();
    invitation.revokedAt = new Date();
    await invitation.save();

    // Reset user temporary password
    const { temporaryPassword, user: updatedUser } = await userService.resetUserTemporaryPassword(invitation.email, invitation.portalType);

    // Create new invitation token with incremented resend count
    const { invitationId: newInvitationId, invitationLink, expiresAt } = await this.createInvitationToken({
      email: invitation.email,
      organizationId: invitation.organizationId?.toString(),
      organizationType: invitation.organizationType,
      portalType: invitation.portalType,
      role: invitation.role,
      organizationName: organization?.name,
      resendCount: (invitation.resendCount ?? 0) + 1,
    });

    await this.sendInvitationEmail({
      email: invitation.email,
      firstName: updatedUser.firstName || invitation.email.split('@')[0],
      lastName: updatedUser.lastName || '',
      organizationName: organization?.name || 'Organization',
      organizationType: invitation.organizationType,
      invitationLink,
      temporaryPassword,
    });

    const newInvitation = await InvitationToken.findById(newInvitationId);

    return {
      invitation: newInvitation,
      temporaryPassword,
    };
  }
}

export const invitationService = new InvitationService();


