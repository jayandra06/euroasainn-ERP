import { IPayment, PaymentStatus, PaymentType } from '../models/payment.model';
import mongoose from 'mongoose';
export declare class PaymentService {
    createPayment(data: {
        organizationId: string;
        userId: string;
        amount: number;
        currency?: string;
        paymentType?: PaymentType;
        description?: string;
        paymentMethod?: string;
        metadata?: Record<string, any>;
    }): Promise<{
        payment: mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        razorpayOrder: {
            id: string;
            amount: string | number;
            currency: string;
            key: string;
        };
    } | {
        payment: mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        razorpayOrder?: undefined;
    }>;
    updatePaymentStatus(paymentId: string, status: PaymentStatus, transactionId?: string, gatewayResponse?: any): Promise<mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    handleSuccessfulPayment(payment: IPayment): Promise<void>;
    sendPaymentStatusEmail(payment: IPayment, status: PaymentStatus): Promise<void>;
    getPaymentsByOrganization(organizationId: string): Promise<(mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getPaymentsByUser(userId: string): Promise<(mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getPaymentById(paymentId: string): Promise<(mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    checkOrganizationPaymentStatus(organizationId: string): Promise<{
        hasActivePayment: boolean;
        payment?: IPayment;
    }>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map