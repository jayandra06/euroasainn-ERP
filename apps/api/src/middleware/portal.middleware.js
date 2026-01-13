import { logger } from '../config/logger';
export function requirePortal(portalType) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }
        // Log for debugging
        logger.info(`Portal check - User portalType: ${req.user.portalType}, Required: ${portalType}, Match: ${req.user.portalType === portalType}`);
        // Compare as strings to handle enum/string mismatches
        const userPortalType = String(req.user.portalType);
        const requiredPortalType = String(portalType);
        if (userPortalType !== requiredPortalType) {
            logger.warn(`Portal mismatch - User: ${userPortalType}, Required: ${requiredPortalType}`);
            return res.status(403).json({
                success: false,
                error: `Access denied. This endpoint requires ${portalType} portal access. Your portal type is ${req.user.portalType}`,
            });
        }
        next();
    };
}
//# sourceMappingURL=portal.middleware.js.map