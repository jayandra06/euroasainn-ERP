import mongoose, { Document } from 'mongoose';
export interface IRFQ extends Document {
    organizationId: mongoose.Types.ObjectId;
    rfqNumber: string;
    title: string;
    description?: string;
    status: string;
    dueDate?: Date;
    vesselId?: mongoose.Types.ObjectId;
    brand?: string;
    model?: string;
    category?: string;
    categories?: string[];
    supplyPort?: string;
    senderType: 'admin' | 'customer';
    senderId: mongoose.Types.ObjectId;
    recipientVendorIds: mongoose.Types.ObjectId[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RFQ: mongoose.Model<IRFQ, {}, {}, {}, mongoose.Document<unknown, {}, IRFQ, {}, {}> & IRFQ & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=rfq.model.d.ts.map