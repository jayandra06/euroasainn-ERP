import { userService } from "../services/user.service";
import { emailService } from "../services/email.service";
// import { Organization } from "../models/organization.model";
import { logger } from "../config/logger";
import { PortalType } from "../../../../packages/shared/src/types/index";
export class UserController {
    /* -------------------------------------------------
       CREATE USER (org enforced)
    ------------------------------------------------- */
    async createUser(req, res) {
        try {
            const authUser = req.user;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const data = {
                ...req.body,
                organizationId: authUser.organizationId, // 🔥 FORCE org
            };
            const user = await userService.createUser(data);
            res.status(201).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger.error("Create user error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to create user",
            });
        }
    }
    /* -------------------------------------------------
       GET USERS (org enforced)
    ------------------------------------------------- */
    async getUsers(req, res) {
        try {
            const authUser = req.user;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const portalType = req.query.portalType;
            const filters = {};
            if (req.query.isActive !== undefined) {
                filters.isActive = req.query.isActive === "true";
            }
            let users;
            if (portalType) {
                users = await userService.getUsers(portalType, authUser.organizationId, filters);
            }
            else {
                const techUsers = await userService.getUsers(PortalType.TECH, authUser.organizationId, filters);
                const adminUsers = await userService.getUsers(PortalType.ADMIN, authUser.organizationId, filters);
                users = [...techUsers, ...adminUsers];
            }
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            logger.error("Get users error:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get users",
            });
        }
    }
    /* -------------------------------------------------
       GET USER BY ID (org enforced)
    ------------------------------------------------- */
    async getUserById(req, res) {
        try {
            const authUser = req.user;
            const { id } = req.params;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const user = await userService.getUserById(id);
            if (user.organizationId.toString() !== authUser.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied",
                });
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger.error("Get user error:", error);
            res.status(404).json({
                success: false,
                error: error.message || "User not found",
            });
        }
    }
    /* -------------------------------------------------
       UPDATE USER (org enforced)
    ------------------------------------------------- */
    async updateUser(req, res) {
        try {
            const authUser = req.user;
            const { id } = req.params;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const existingUser = await userService.getUserById(id);
            if (existingUser.organizationId.toString() !== authUser.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied",
                });
            }
            const data = {
                ...req.body,
                organizationId: authUser.organizationId, // 🔥 prevent org change
            };
            const user = await userService.updateUser(id, data);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger.error("Update user error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to update user",
            });
        }
    }
    /* -------------------------------------------------
       DELETE USER (org enforced)
    ------------------------------------------------- */
    async deleteUser(req, res) {
        try {
            const authUser = req.user;
            const { id } = req.params;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const user = await userService.getUserById(id);
            if (user.organizationId.toString() !== authUser.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied",
                });
            }
            await userService.deleteUser(id);
            res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        }
        catch (error) {
            logger.error("Delete user error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to delete user",
            });
        }
    }
    /* -------------------------------------------------
       INVITE USER (org enforced)
    ------------------------------------------------- */
    async inviteUser(req, res) {
        try {
            const authUser = req.user;
            if (!authUser?.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: "Organization context missing",
                });
            }
            const data = {
                ...req.body,
                organizationId: authUser.organizationId, // 🔥 FORCE org
            };
            const result = await userService.inviteUser(data);
            const portalUrlMap = {
                [PortalType.ADMIN]: process.env.ADMIN_PORTAL_URL || "",
                [PortalType.TECH]: process.env.TECH_PORTAL_URL || "",
                [PortalType.CUSTOMER]: process.env.CUSTOMER_PORTAL_URL || "",
                [PortalType.VENDOR]: process.env.VENDOR_PORTAL_URL || "",
            };
            const portalUrl = portalUrlMap[data.portalType] ||
                process.env.FRONTEND_URL ||
                "http://localhost:4200";
            await emailService.sendUserInvitationEmail({
                to: result.email,
                firstName: result.firstName,
                lastName: result.lastName,
                portalType: data.portalType,
                portalLink: `${portalUrl}/login`,
                temporaryPassword: result.temporaryPassword,
            });
            delete result.temporaryPassword;
            res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger.error("Invite user error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to invite user",
            });
        }
    }
}
export const userController = new UserController();
//# sourceMappingURL=user.controller.js.map