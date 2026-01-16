import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare class AssignRoleController {
    listUsers(req: AuthRequest, res: Response): Promise<void>;
    listRoles(req: AuthRequest, res: Response): Promise<void>;
    assignRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    removeRole(req: AuthRequest, res: Response): Promise<void>;
}
export declare const assignRoleController: AssignRoleController;
//# sourceMappingURL=assign-role.controller.d.ts.map