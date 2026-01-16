import { Request, Response } from "express";
export declare class LicenseController {
    getLicenses(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createLicense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getLicenseById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateLicense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteLicense(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export declare const licenseController: LicenseController;
//# sourceMappingURL=license.controller.d.ts.map