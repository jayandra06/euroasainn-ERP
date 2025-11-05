import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import { invitationService } from '../services/invitation.service';
import { PortalType, OrganizationType } from '@euroasiann/shared';
import { logger } from '../config/logger';

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

  async getOrganizationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organization = await organizationService.getOrganizationById(id);

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      logger.error('Get organization error:', error);
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
      const { organizationName, organizationType, adminEmail, firstName, lastName } = req.body;

      if (!organizationName || !organizationType || !adminEmail) {
        return res.status(400).json({
          success: false,
          error: 'Organization name, type, and admin email are required',
        });
      }

      // Validate organization type
      if (organizationType !== OrganizationType.CUSTOMER && organizationType !== OrganizationType.VENDOR) {
        return res.status(400).json({
          success: false,
          error: 'Organization type must be customer or vendor',
        });
      }

      // Determine portal type and role based on organization type
      const portalType = organizationType === OrganizationType.CUSTOMER 
        ? PortalType.CUSTOMER 
        : PortalType.VENDOR;
      const role = organizationType === OrganizationType.CUSTOMER 
        ? 'customer_admin' 
        : 'vendor_admin';

      // Extract name from email if not provided
      let finalFirstName = firstName;
      let finalLastName = lastName;

      if (!finalFirstName || !finalLastName) {
        const emailParts = adminEmail.split('@')[0];
        const nameParts = emailParts.split(/[._-]/);
        finalFirstName = firstName || nameParts[0] || 'Organization';
        finalLastName = lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin');
      }

      // Invite the organization admin user
      // Note: organizationId will be null initially - they'll create the org during registration
      const invitedUser = await userService.inviteUser({
        email: adminEmail,
        firstName: finalFirstName,
        lastName: finalLastName,
        portalType,
        role,
        // organizationId is not set - they'll create the organization during registration
      });

      // TODO: Send invitation email with temporary password and registration link
      // For now, we'll log the temporary password (in production, this should be sent via email)
      logger.info(`Organization admin invitation sent to ${adminEmail} for ${organizationName} (${organizationType})`);
      logger.info(`Temporary password: ${invitedUser.temporaryPassword}`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            ...invitedUser,
            temporaryPassword: invitedUser.temporaryPassword, // Include for now (remove in production)
          },
          organizationName,
          organizationType,
          message: 'Organization admin invitation sent successfully. Please send the invitation email with the temporary password.',
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
