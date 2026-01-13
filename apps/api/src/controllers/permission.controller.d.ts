import { Request, Response } from "express";
declare class PermissionController {
    getPermissions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const permissionController: PermissionController;
export {};
//# sourceMappingURL=permission.controller.d.ts.map