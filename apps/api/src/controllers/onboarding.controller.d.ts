import { Request, Response } from 'express';
export declare class OnboardingController {
    getInvitationByToken(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    submitCustomerOnboarding(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    submitVendorOnboarding(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCustomerOnboardings(req: Request, res: Response): Promise<void>;
    getVendorOnboardings(req: Request, res: Response): Promise<void>;
    getCustomerOnboardingById(req: Request, res: Response): Promise<void>;
    getVendorOnboardingById(req: Request, res: Response): Promise<void>;
    approveCustomerOnboarding(req: Request, res: Response): Promise<void>;
    rejectCustomerOnboarding(req: Request, res: Response): Promise<void>;
    approveVendorOnboarding(req: Request, res: Response): Promise<void>;
    rejectVendorOnboarding(req: Request, res: Response): Promise<void>;
}
export declare const onboardingController: OnboardingController;
//# sourceMappingURL=onboarding.controller.d.ts.map