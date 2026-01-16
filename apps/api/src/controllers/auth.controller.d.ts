import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
export declare class AuthController {
    login(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refresh(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: AuthRequest, res: Response): Promise<void>;
    getMe(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    changePassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updatePreferences(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateSecurityQuestion(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map