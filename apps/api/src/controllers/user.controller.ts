import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { emailService } from '../services/email.service';
import { Organization } from '../models/organization.model';
import { logger } from '../config/logger';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';

export class UserController {

  

  // Existing Function: Create any user
  async createUser(req: Request, res: Response) {
    try {
      const data = req.body;
      const user = await userService.createUser(data);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Create user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user',
      });
    }
  }

  // Existing Function: Get users (tech+admin)
  async getUsers(req: Request, res: Response) {
    try {
      const portalType = req.query.portalType as string;
      const organizationId = req.query.organizationId as string;

      const filters: any = {};

      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      logger.info(
        `Getting users - portalType: ${portalType || 'all'}, organizationId: ${
          organizationId || 'none'
        }`
      );

      let users;
      if (portalType) {
        users = await userService.getUsers(
          portalType as PortalType,
          organizationId,
          filters
        );
      } else {
        const techUsers = await userService.getUsers(
          PortalType.TECH,
          organizationId,
          filters
        );
        const adminUsers = await userService.getUsers(
          PortalType.ADMIN,
          organizationId,
          filters
        );
        users = [...techUsers, ...adminUsers];
      }

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get users',
      });
    }
  }

  // Existing Function: Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get user error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'User not found',
      });
    }
  }

  // Existing Function: Update user
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const user = await userService.updateUser(id, data);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Update user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update user',
      });
    }
  }

  // Existing Function: Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete user',
      });
    }
  }

  // Existing Function: Invite user
  async inviteUser(req: Request, res: Response) {
    try {
      const data = req.body;
      const result = await userService.inviteUser(data);

      let emailSent = false;

      try {
        let organizationName = 'Euroasiann ERP';
        let organizationType: 'customer' | 'vendor' = 'customer';

        if (result.organizationId) {
          const organization = await Organization.findById(result.organizationId);
          if (organization) {
            organizationName = organization.name;
            organizationType =
              organization.type === 'customer' ? 'customer' : 'vendor';
          }
        }

        // Generate portal login link based on portal type
        let portalUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        if (data.portalType === PortalType.ADMIN) {
          portalUrl = process.env.ADMIN_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4300';
        } else if (data.portalType === PortalType.TECH) {
          portalUrl = process.env.TECH_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4200';
        } else if (data.portalType === PortalType.CUSTOMER) {
          portalUrl = process.env.CUSTOMER_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4400';
        } else if (data.portalType === PortalType.VENDOR) {
          portalUrl = process.env.VENDOR_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4500';
        }
        const portalLink = `${portalUrl}/login`;

        // Send user invitation email with temporary password
        await emailService.sendUserInvitationEmail({
          to: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          portalType: data.portalType,
          portalLink,
          temporaryPassword: result.temporaryPassword,
        });

        emailSent = true;
      } catch (emailError: any) {
        logger.error('Email error:', emailError);
      }

      const responseData: any = { ...result };
      if (emailSent) delete responseData.temporaryPassword;

      res.status(201).json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      logger.error('Invite user error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to invite user',
      });
    }
  }
}

export const userController = new UserController();
