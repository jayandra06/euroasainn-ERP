import { Request, Response } from 'express';
export declare class OrganizationController {
    createOrganization(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getOrganizations(req: Request, res: Response): Promise<void>;
    getOrganizationInvitations(req: Request, res: Response): Promise<void>;
    resendOrganizationInvitation(req: Request, res: Response): Promise<void>;
    revokeOrganizationInvitation(req: Request, res: Response): Promise<void>;
    getOrganizationById(req: Request, res: Response): Promise<void>;
    updateOrganization(req: Request, res: Response): Promise<void>;
    deleteOrganization(req: Request, res: Response): Promise<void>;
    getOrganizationsWithLicenses(req: Request, res: Response): Promise<void>;
    inviteOrganizationAdmin(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const organizationController: OrganizationController;
//# sourceMappingURL=organization.controller.d.ts.map