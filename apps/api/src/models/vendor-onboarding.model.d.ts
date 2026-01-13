import mongoose, { Document } from 'mongoose';
export interface IVendorOnboarding extends Document {
    organizationId?: mongoose.Types.ObjectId;
    invitationToken?: string;
    companyName: string;
    contactPerson: string;
    email: string;
    mobileCountryCode: string;
    mobilePhone: string;
    deskCountryCode: string;
    deskPhone: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    taxId: string;
    accountName: string;
    bankName: string;
    iban: string;
    swift?: string;
    invoiceEmail: string;
    billingAddress1: string;
    billingAddress2?: string;
    billingCity: string;
    billingProvince: string;
    billingPostal: string;
    billingCountry: string;
    brands?: string[];
    categories?: string[];
    models?: string[];
    warehouseAddress: string;
    managingDirector: string;
    managingDirectorEmail: string;
    managingDirectorPhone: string;
    managingDirectorDeskPhone: string;
    port: string;
    salesManager: string;
    salesManagerEmail: string;
    salesManagerPhone: string;
    salesManagerDeskPhone: string;
    logisticService: string;
    status: 'pending' | 'completed' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const VendorOnboarding: mongoose.Model<IVendorOnboarding, {}, {}, {}, mongoose.Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=vendor-onboarding.model.d.ts.map