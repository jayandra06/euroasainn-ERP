import { authService } from "../services/auth.service";
import { logger } from "../config/logger";
export class AuthController {
    /* ---------------- LOGIN ---------------- */
    async login(req, res) {
        try {
            const { email, password, portalType } = req.body;
            if (!email || !password || !portalType) {
                return res.status(400).json({
                    success: false,
                    error: "Email, password, and portalType are required",
                });
            }
            const result = await authService.login(email, password, portalType);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger.error("Login error:", error);
            res.status(401).json({
                success: false,
                error: error.message || "Login failed",
            });
        }
    }
    /* ---------------- REFRESH TOKEN ---------------- */
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: "Refresh token is required",
                });
            }
            const result = await authService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger.error("Refresh token error:", error);
            res.status(401).json({
                success: false,
                error: error.message || "Token refresh failed",
            });
        }
    }
    /* ---------------- LOGOUT ---------------- */
    async logout(req, res) {
        try {
            const token = req.headers.authorization?.replace("Bearer ", "") || "";
            const { refreshToken } = req.body;
            await authService.logout(token, refreshToken || "");
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            logger.error("Logout error:", error);
            res.status(200).json({
                success: true,
                message: "Logged out (some cleanup may have failed)",
                warning: error.message || "Some logout operations failed",
            });
        }
    }
    /* ---------------- GET CURRENT USER ---------------- */
    async getMe(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }
            const user = await authService.getCurrentUser(userId);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger.error("Get me error:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get user",
            });
        }
    }
    /* ---------------- CHANGE PASSWORD ---------------- */
    async changePassword(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: "Current password and new password are required",
                });
            }
            const result = await authService.changePassword(userId, currentPassword, newPassword);
            res.status(200).json(result);
        }
        catch (error) {
            logger.error("Change password error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to change password",
            });
        }
    }
    /* ---------------- UPDATE PREFERENCES ---------------- */
    async updatePreferences(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }
            const preferences = req.body;
            const result = await authService.updatePreferences(userId, preferences);
            res.status(200).json(result);
        }
        catch (error) {
            logger.error("Update preferences error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to update preferences",
            });
        }
    }
    /* ---------------- UPDATE SECURITY QUESTION ---------------- */
    async updateSecurityQuestion(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "Unauthorized",
                });
            }
            const { question, answer } = req.body;
            if (!question || !answer) {
                return res.status(400).json({
                    success: false,
                    error: "Security question and answer are required",
                });
            }
            const result = await authService.updateSecurityQuestion(userId, question, answer);
            res.status(200).json(result);
        }
        catch (error) {
            logger.error("Update security question error:", error);
            res.status(400).json({
                success: false,
                error: error.message || "Failed to update security question",
            });
        }
    }
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map