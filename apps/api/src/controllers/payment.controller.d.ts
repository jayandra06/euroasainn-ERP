import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class PaymentController {
    createPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updatePaymentStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPaymentsByOrganization(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPaymentsByUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPaymentById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    checkPaymentStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    handlePaymentWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    verifyPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map