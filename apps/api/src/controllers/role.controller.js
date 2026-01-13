import { roleService } from "../services/role.service";
import { logger } from "../config/logger";
export class RoleController {
    async listRoles(req, res) {
        try {
            const portalType = req.query.portalType;
            const roles = await roleService.listRoles({
                portalType,
                organizationId: req.user.organizationId,
            });
            return res.status(200).json({ success: true, data: roles });
        }
        catch (error) {
            logger.error("Failed to list roles:", error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    async createRole(req, res) {
        try {
            const { name, permissions, description, portalType } = req.body;
            const role = await roleService.createRole({
                name,
                permissions,
                description,
                portalType,
                organizationId: req.user.organizationId,
            });
            return res.status(201).json({ success: true, data: role });
        }
        catch (error) {
            logger.error("Failed to create role:", error);
            return res.status(400).json({ success: false, error: error.message });
        }
    }
    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const updated = await roleService.updateRole(id, req.body);
            return res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            logger.error("Failed to update role:", error);
            return res.status(400).json({ success: false, error: error.message });
        }
    }
    async deleteRole(req, res) {
        try {
            const { id } = req.params;
            await roleService.deleteRole(id, req.user.organizationId);
            return res.status(200).json({
                success: true,
                message: "Role deleted and users updated successfully",
            });
        }
        catch (error) {
            logger.error("Failed to delete role:", error);
            return res.status(400).json({ success: false, error: error.message });
        }
    }
}
export const roleController = new RoleController();
//# sourceMappingURL=role.controller.js.map