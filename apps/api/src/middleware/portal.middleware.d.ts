import { Response, NextFunction } from 'express';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';
import { AuthRequest } from './auth.middleware';
export declare function requirePortal(portalType: PortalType): (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=portal.middleware.d.ts.map