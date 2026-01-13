import { Response } from "express";
import { roleService } from "../services/role.service";
import { PortalType } from "@euroasiann/shared";
import { logger } from "../config/logger";
import { AuthRequest } from "../middleware/auth.middleware";

export class RoleController {

  async listRoles(req: AuthRequest, res: Response) {
    try {
      const portalType = req.query.portalType as PortalType | undefined;
      const organizationIdFromQuery = req.query.organizationId as string | undefined;
      
      // Get organizationId from authenticated user (source of truth)
      const userOrganizationId = req.user!.organizationId;
      
      // Validate: if organizationId is provided in URL, it must match user's organization
      if (organizationIdFromQuery && organizationIdFromQuery !== userOrganizationId) {
        return res.status(403).json({ 
          success: false, 
          error: "You can only access roles from your own organization" 
        });
      }

      const roles = await roleService.listRoles({
        portalType,
        organizationId: userOrganizationId,
      });

      return res.status(200).json({ success: true, data: roles });
    } catch (error: any) {
      logger.error("Failed to list roles:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async createRole(req: AuthRequest, res: Response) {
    try {
      const { name, permissions, description, portalType } = req.body;

      const role = await roleService.createRole({
        name,
        permissions,
        description,
        portalType,
        organizationId: req.user!.organizationId,
      });

      return res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      logger.error("Failed to create role:", error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const updated = await roleService.updateRole(id, req.body, organizationId);

      return res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
      logger.error("Failed to update role:", error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteRole(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await roleService.deleteRole(id, req.user!.organizationId);

      return res.status(200).json({
        success: true,
        message: "Role deleted and users updated successfully",
      });
    } catch (error: any) {
      logger.error("Failed to delete role:", error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const roleController = new RoleController();
