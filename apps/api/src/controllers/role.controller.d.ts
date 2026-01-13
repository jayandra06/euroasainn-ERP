import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare class RoleController {
    listRoles(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    updateRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const roleController: RoleController;
//# sourceMappingURL=role.controller.d.ts.map