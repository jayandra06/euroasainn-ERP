import mongoose, { Document } from 'mongoose';
export interface IPaymentProof extends Document {
    rfqId: mongoose.Types.ObjectId;
    quotationId: mongoose.Types.ObjectId;
    customerOrganizationId: mongoose.Types.ObjectId;
    vendorOrganizationId: mongoose.Types.ObjectId;
    paymentAmount: number;
    currency: string;
    paymentDate: Date;
    paymentMethod?: string;
    transactionReference?: string;
    proofDocuments: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
        uploadedAt: Date;
    }>;
    status: 'pending' | 'submitted' | 'verified' | 'approved';
    submittedAt: Date;
    verifiedAt?: Date;
    approvedAt?: Date;
    approvedBy?: mongoose.Types.ObjectId;
    shippingOption?: 'self' | 'vendor-managed';
    shippingSelectedAt?: Date;
    awbTrackingNumber?: string;
    shippingContactName?: string;
    shippingContactEmail?: string;
    shippingContactPhone?: string;
    vendorAWBTrackingNumber?: string;
    vendorShippingContactName?: string;
    vendorShippingContactEmail?: string;
    vendorShippingContactPhone?: string;
    vendorShippingSubmittedAt?: Date;
    vendorShippingSubmittedBy?: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PaymentProof: mongoose.Model<IPaymentProof, {}, {}, {}, mongoose.Document<unknown, {}, IPaymentProof, {}, {}> & IPaymentProof & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=payment-proof.model.d.ts.map