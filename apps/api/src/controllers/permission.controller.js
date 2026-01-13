import { PERMISSIONS } from "../constants/permissions.constant";
class PermissionController {
    async getPermissions(req, res) {
        const portalType = req.query.portalType;
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
//# sourceMappingURL=permission.controller.js.map