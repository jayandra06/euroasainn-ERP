import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
export declare function validateLicense(req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=license.middleware.d.ts.map