import mongoose, { Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
export declare enum PaymentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    SUCCESS = "success",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export declare enum PaymentType {
    SUBSCRIPTION = "subscription",
    ONE_TIME = "one_time",
    RENEWAL = "renewal"
}
export interface IPayment extends Document {
    organizationId: mongoose.Types.ObjectId;
    organizationType: OrganizationType;
    portalType: PortalType;
    userId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paymentType: PaymentType;
    status: PaymentStatus;
    paymentMethod?: string;
    transactionId?: string;
    paymentGateway?: string;
    gatewayResponse?: any;
    description?: string;
    subscriptionPeriod?: {
        startDate: Date;
        endDate: Date;
    };
    licenseId?: mongoose.Types.ObjectId;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=payment.model.d.ts.map