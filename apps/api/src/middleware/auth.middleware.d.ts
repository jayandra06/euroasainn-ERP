import { Request, Response, NextFunction } from "express";
/**
 * Extended request with authenticated user
 */
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        organizationId: string;
        role: string;
        portalType: string;
    };
}
/**
 * Authentication Middleware
 * - Verifies JWT
 * - Checks token revocation (Redis)
 * - Ensures Casbin-required fields exist
 */
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map