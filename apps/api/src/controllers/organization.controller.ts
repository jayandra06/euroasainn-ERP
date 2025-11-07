import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import { invitationService } from '../services/invitation.service';
import { PortalType, OrganizationType, InvitationStatus } from '../../../../packages/shared/src/types/index.ts';
import { logger } from '../config/logger';

function formatInvitation(invitation: any) {
  const obj = invitation.toObject ? invitation.toObject() : invitation;
  return {
    _id: obj._id?.toString(),
    email: obj.email,
    role: obj.role,
    status: obj.status as InvitationStatus,
    resendCount: obj.resendCount || 0,
    expiresAt: obj.expiresAt,
    createdAt: obj.createdAt,
    usedAt: obj.usedAt,
    revokedAt: obj.revokedAt,
  };
}

export class OrganizationController {
  async createOrganization(req: Request, res: Response) {
    try {
      const { adminEmail, ...orgData } = req.body;

      // Validate required fields
      if (!orgData.name || !orgData.type || !orgData.portalType) {
        return res.status(400).json({
          success: false,
          error: 'Organization name, type, and portalType are required',
        });
      }

      // Create the organization first
      const organization = await organizationService.createOrganization(orgData);

      // If adminEmail is provided, create invitation token and send invitation email
      if (adminEmail) {
        try {
          // Determine role based on organization type
          const role = (orgData.type === OrganizationType.CUSTOMER || orgData.type === 'customer')
            ? 'customer_admin' 
            : 'vendor_admin';

          // Extract name from email if needed
          const emailParts = adminEmail.split('@')[0];
          const nameParts = emailParts.split(/[._-]/);
          const firstName = nameParts[0] || 'Organization';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

          // Generate a secure temporary password
          const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
          
          // Create admin user for this organization
          const user = await userService.createUser({
            email: adminEmail,
            firstName,
            lastName,
            password: tempPassword,
            portalType: orgData.portalType as PortalType,
            role,
            organizationId: organization._id.toString(),
          });

          // Create invitation token
          const { invitationLink } = await invitationService.createInvitationToken({
            email: adminEmail,
            organizationId: organization._id.toString(),
            organizationType: orgData.type as OrganizationType,
            portalType: orgData.portalType as PortalType,
            role,
            organizationName: organization.name,
          });

          // Send invitation email with link and temporary password
          await invitationService.sendInvitationEmail({
            email: adminEmail,
            firstName,
            lastName,
            organizationName: organization.name,
            organizationType: orgData.type as OrganizationType,
            invitationLink,
            temporaryPassword: tempPassword,
          });

          logger.info(`✅ Invitation sent to ${adminEmail} for organization ${organization.name}`);
          logger.info(`   Invitation link: ${invitationLink}`);
          logger.info(`   Temporary password: ${tempPassword}`);
        } catch (userError: any) {
          logger.error('Error creating admin user and sending invitation:', userError);
          // Don't fail the organization creation if invitation fails
          // Just log the error
        }
      }

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Create organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create organization',
      });
    }
  }

  async getOrganizations(req: Request, res: Response) {
    try {
      const type = req.query.type as string;
      const portalType = req.query.portalType as string;
      const filters: any = {};

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const organizations = await organizationService.getOrganizations(
        type as any,
        portalType as any,
        filters
      );

      res.status(200).json({
        success: true,
        data: organizations,
      });
    } catch (error: any) {
      logger.error('Get organizations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get organizations',
      });
    }
  }

  async getOrganizationInvitations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includeAll = req.query.includeAll === 'true';
      const invitations = await invitationService.getOrganizationInvitations(id, includeAll);
      const formatted = invitations.map(formatInvitation);

      res.status(200).json({
        success: true,
        data: formatted,
      });
    } catch (error: any) {
      logger.error('Get organization invitations error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch invitations',
      });
    }
  }

  async resendOrganizationInvitation(req: Request, res: Response) {
    try {
      const { id, invitationId } = req.params;
      const result = await invitationService.resendInvitation(invitationId, id);

      if (!result.invitation) {
        throw new Error('Failed to create replacement invitation');
      }

      res.status(200).json({
        success: true,
        data: {
          invitation: formatInvitation(result.invitation),
          temporaryPassword: result.temporaryPassword,
        },
      });
    } catch (error: any) {
      logger.error('Resend invitation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to resend invitation',
      });
    }
  }

  async revokeOrganizationInvitation(req: Request, res: Response) {
    try {
      const { id, invitationId } = req.params;
      const invitation = await invitationService.revokeInvitation(invitationId, id);

      res.status(200).json({
        success: true,
        data: formatInvitation(invitation),
      });
    } catch (error: any) {
      logger.error('Revoke invitation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to revoke invitation',
      });
    }
  }

  async getOrganizationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Get organization by id error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Organization not found',
      });
    }
  }

  async updateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const organization = await organizationService.updateOrganization(id, data);

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Update organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update organization',
      });
    }
  }

  async deleteOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await organizationService.deleteOrganization(id);

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete organization error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete organization',
      });
    }
  }

  async inviteOrganizationAdmin(req: Request, res: Response) {
    try {
      const { organizationName, organizationType, adminEmail, firstName, lastName, isActive } = req.body;

      if (!organizationName || !organizationType || !adminEmail) {
        return res.status(400).json({
          success: false,
          error: 'Organization name, type, and admin email are required',
        });
      }

      // Validate organization type
      if (organizationType !== OrganizationType.CUSTOMER && organizationType !== OrganizationType.VENDOR && organizationType !== 'customer' && organizationType !== 'vendor') {
        return res.status(400).json({
          success: false,
          error: 'Organization type must be customer or vendor',
        });
      }

      // Determine portal type and role based on organization type
      const portalType = (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
        ? PortalType.CUSTOMER 
        : PortalType.VENDOR;
      const role = (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
        ? 'customer_admin' 
        : 'vendor_admin';

      // Create the organization first
      const organization = await organizationService.createOrganization({
        name: organizationName,
        type: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer') 
          ? OrganizationType.CUSTOMER 
          : OrganizationType.VENDOR,
        portalType,
        isActive: isActive !== undefined ? isActive : true,
      });

      // Extract name from email if not provided
      let finalFirstName = firstName;
      let finalLastName = lastName;

      if (!finalFirstName || !finalLastName) {
        const emailParts = adminEmail.split('@')[0];
        const nameParts = emailParts.split(/[._-]/);
        finalFirstName = firstName || nameParts[0] || 'Organization';
        finalLastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin');
      }

      // Generate a secure temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`;
      
      // Create admin user for this organization
      const user = await userService.createUser({
        email: adminEmail,
        firstName: finalFirstName,
        lastName: finalLastName,
        password: tempPassword,
        portalType,
        role,
        organizationId: organization._id.toString(),
      });

      // Create invitation token
      const { invitationLink } = await invitationService.createInvitationToken({
        email: adminEmail,
        organizationId: organization._id.toString(),
        organizationType: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
          ? OrganizationType.CUSTOMER
          : OrganizationType.VENDOR,
        portalType,
        role,
        organizationName: organization.name,
      });

      // Send invitation email with link and temporary password
      await invitationService.sendInvitationEmail({
        email: adminEmail,
        firstName: finalFirstName,
        lastName: finalLastName,
        organizationName: organization.name,
        organizationType: (organizationType === OrganizationType.CUSTOMER || organizationType === 'customer')
          ? OrganizationType.CUSTOMER
          : OrganizationType.VENDOR,
        invitationLink,
        temporaryPassword: tempPassword,
      });

      logger.info(`✅ Invitation sent to ${adminEmail} for organization ${organization.name}`);
      logger.info(`   Invitation link: ${invitationLink}`);
      logger.info(`   Temporary password: ${tempPassword}`);

      res.status(201).json({
        success: true,
        data: {
          organization,
          user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            temporaryPassword: tempPassword, // Include for now (should be sent via email only)
          },
          invitationLink,
          message: 'Organization created and invitation sent successfully',
        },
      });
    } catch (error: any) {
      logger.error('Invite organization admin error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to invite organization admin',
      });
    }
  }
}

export const organizationController = new OrganizationController();
