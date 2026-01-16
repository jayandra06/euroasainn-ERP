import mongoose, { Document } from 'mongoose';
export interface IBankingDetails extends Document {
    quotationId: mongoose.Types.ObjectId;
    rfqId: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    accountType?: string;
    bankAddress?: string;
    bankCity?: string;
    bankCountry?: string;
    bankSwiftCode?: string;
    bankIBAN?: string;
    routingNumber?: string;
    branchName?: string;
    branchCode?: string;
    currency?: string;
    documents?: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
        uploadedAt: Date;
    }>;
    status: 'pending' | 'submitted' | 'verified';
    submittedAt?: Date;
    verifiedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BankingDetails: mongoose.Model<IBankingDetails, {}, {}, {}, mongoose.Document<unknown, {}, IBankingDetails, {}, {}> & IBankingDetails & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=banking-details.model.d.ts.map