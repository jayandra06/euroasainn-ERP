import { Request, Response } from "express";
import { PERMISSIONS } from "../constants/permissions.constant";

class PermissionController {
  async getPermissions(req: Request, res: Response) {
    const portalType = req.query.portalType as string;

    if (!portalType || !PERMISSIONS[portalType]) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing portalType",
      });
    }

    return res.json({
      success: true,
      data: PERMISSIONS[portalType],
    });
  }
}

export const permissionController = new PermissionController();
