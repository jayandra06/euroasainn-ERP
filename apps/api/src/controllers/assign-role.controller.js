import { assignRoleService } from "../services/assign-role.service";
import { logger } from "../config/logger";
export class AssignRoleController {
    async listUsers(req, res) {
        try {
            const portalType = req.query.portalType || "all";
            const organizationId = req.user.organizationId;
            const users = await assignRoleService.listUsers(portalType, organizationId);
            res.status(200).json({ success: true, data: users });
        }
        catch (error) {
            logger.error("Failed to list users:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async listRoles(req, res) {
        try {
            const portalType = req.query.portalType || "all";
            const organizationId = req.user.organizationId;
            const roles = await assignRoleService.listRoles(portalType, organizationId);
            res.status(200).json({ success: true, data: roles });
        }
        catch (error) {
            logger.error("Failed to list roles:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async assignRole(req, res) {
        try {
            const { userId } = req.params;
            const { roleId } = req.body;
            const organizationId = req.user.organizationId;
            if (!roleId) {
                return res
                    .status(400)
                    .json({ success: false, error: "roleId is required" });
            }
            const updatedUser = await assignRoleService.assignRole(userId, roleId, organizationId);
            res.status(200).json({ success: true, data: updatedUser });
        }
        catch (error) {
            logger.error("Failed to assign role:", error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
    async removeRole(req, res) {
        try {
            const { userId } = req.params;
            const organizationId = req.user.organizationId;
            const updatedUser = await assignRoleService.removeRole(userId, organizationId);
            res.status(200).json({ success: true, data: updatedUser });
        }
        catch (error) {
            logger.error("Failed to remove role:", error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
export const assignRoleController = new AssignRoleController();
//# sourceMappingURL=assign-role.controller.js.map