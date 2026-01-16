import { verifyToken } from "../config/jwt";
import { redisService } from "../services/redis.service";
import { logger } from "../config/logger";
/**
 * Authentication Middleware
 * - Verifies JWT
 * - Checks token revocation (Redis)
 * - Ensures Casbin-required fields exist
 */
export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        // 1️⃣ Check Authorization header
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: "Authorization token required",
            });
        }
        const token = authHeader.replace("Bearer ", "");
        // 2️⃣ Redis blacklist check (fail open)
        try {
            const isBlacklisted = await redisService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    error: "Token has been revoked",
                });
            }
        }
        catch (redisError) {
            logger.warn("Redis blacklist check failed, continuing with token verification", redisError);
        }
        // 3️⃣ Verify JWT
        const decoded = verifyToken(token);
        // 4️⃣ Validate mandatory Casbin fields (defensive)
        if (!decoded ||
            !decoded.userId ||
            !decoded.organizationId ||
            decoded.organizationId.trim() === "" ||
            !decoded.role ||
            !decoded.portalType) {
            return res.status(401).json({
                success: false,
                error: "Invalid token payload",
            });
        }
        // 5️⃣ Attach safe user object
        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role,
            portalType: decoded.portalType,
        };
        next();
    }
    catch (error) {
        logger.error("Auth middleware error:", error);
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token",
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map