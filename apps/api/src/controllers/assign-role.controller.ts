import { Response } from "express";
import { assignRoleService } from "../services/assign-role.service";
import { logger } from "../config/logger";
import { AuthRequest } from "../middleware/auth.middleware";

export class AssignRoleController {

  async listUsers(req: AuthRequest, res: Response) {
    try {
      const portalType = (req.query.portalType as string) || "all";
      const organizationId = req.user!.organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const roleFilter = req.query.roleFilter as string | undefined;

      const result = await assignRoleService.listUsers(
        portalType,
        organizationId,
        page,
        limit,
        search,
        roleFilter
      );

      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      logger.error("Failed to list users:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async listRoles(req: AuthRequest, res: Response) {
    try {
      const portalType = (req.query.portalType as string) || "all";
      const organizationId = req.user!.organizationId;

      const roles = await assignRoleService.listRoles(
        portalType,
        organizationId
      );

      res.status(200).json({ success: true, data: roles });
    } catch (error: any) {
      logger.error("Failed to list roles:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async assignRole(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      const organizationId = req.user!.organizationId;

      if (!roleId) {
        return res
          .status(400)
          .json({ success: false, error: "roleId is required" });
      }

      const updatedUser = await assignRoleService.assignRole(
        userId,
        roleId,
        organizationId
      );

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error: any) {
      logger.error("Failed to assign role:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async removeRole(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const organizationId = req.user!.organizationId;

      const updatedUser = await assignRoleService.removeRole(
        userId,
        organizationId
      );

      res.status(200).json({ success: true, data: updatedUser });
    } catch (error: any) {
      logger.error("Failed to remove role:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const assignRoleController = new AssignRoleController();
