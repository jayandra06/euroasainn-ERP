
import { Request, Response } from "express";
import { assignRoleService } from "../services/assign-role.service";
import { logger } from "../config/logger";

export class AssignRoleController {
  async listUsers(req: Request, res: Response) {
    try {
      const portalType = (req.query.portalType as string) || "all";

      const users = await assignRoleService.listUsers(portalType);
      res.status(200).json({ success: true, data: users });

    } catch (error: any) {
      logger.error("Failed to list users:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async listRoles(req: Request, res: Response) {
    try {
      const portalType = (req.query.portalType as string) || "all";

      const roles = await assignRoleService.listRoles(portalType);
      res.status(200).json({ success: true, data: roles });

    } catch (error: any) {
      logger.error("Failed to list roles:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async assignRole(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        return res.status(400).json({ success: false, error: "roleId is required" });
      }

      const updatedUser = await assignRoleService.assignRole(userId, roleId);
      res.status(200).json({ success: true, data: updatedUser });

    } catch (error: any) {
      logger.error("Failed to assign role:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async removeRole(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const updatedUser = await assignRoleService.removeRole(userId);
      res.status(200).json({ success: true, data: updatedUser });

    } catch (error: any) {
      logger.error("Failed to remove role:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const assignRoleController = new AssignRoleController();
