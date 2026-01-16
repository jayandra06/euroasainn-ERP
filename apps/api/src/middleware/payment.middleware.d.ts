import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
/**
 * Middleware to check if user's organization has active payment
 * Blocks access if payment is not active
 * External vendors (invited by customers) don't need payment
 */
export declare function paymentStatusMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=payment.middleware.d.ts.map