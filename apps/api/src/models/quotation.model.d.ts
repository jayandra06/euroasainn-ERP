import mongoose, { Document } from 'mongoose';
export interface IQuotation extends Document {
    organizationId: mongoose.Types.ObjectId;
    quotationNumber: string;
    rfqId?: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: string;
    totalAmount: number;
    currency: string;
    validUntil?: Date;
    isAdminOffer?: boolean;
    items: Array<{
        itemId: mongoose.Types.ObjectId;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Quotation: mongoose.Model<IQuotation, {}, {}, {}, mongoose.Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=quotation.model.d.ts.map