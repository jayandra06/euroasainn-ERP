import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare class UserController {
    createUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    inviteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map