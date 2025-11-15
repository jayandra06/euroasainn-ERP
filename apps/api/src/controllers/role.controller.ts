import { Request, Response } from 'express';
import { roleService } from '../services/role.service';
import { PortalType } from '@euroasiann/shared';
import { logger } from '../config/logger';

export class RoleController {
  async listRoles(req: Request, res: Response) {
    try {
      const portalType = req.query.portalType as PortalType | undefined;
      const roles = await roleService.listRoles({
        portalType,
      });

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      logger.error('Failed to list roles:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch roles',
      });
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const { name, permissions, description, portalType } = req.body;

      if (!portalType || !Object.values(PortalType).includes(portalType)) {
        return res.status(400).json({
          success: false,
          error: 'portalType is required',
        });
      }

      const role = await roleService.createRole({
        name,
        permissions,
        description,
        portalType,
      });

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      logger.error('Failed to create role:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create role',
      });
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, permissions, description } = req.body;

      const role = await roleService.updateRole(id, { name, permissions, description });

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      logger.error('Failed to update role:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update role',
      });
    }
  }
}

export const roleController = new RoleController();




