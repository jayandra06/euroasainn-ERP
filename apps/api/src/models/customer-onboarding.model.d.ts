import mongoose, { Document } from 'mongoose';
export interface ICustomerOnboarding extends Document {
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
    vessels: number;
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
    status: 'pending' | 'completed' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CustomerOnboarding: mongoose.Model<ICustomerOnboarding, {}, {}, {}, mongoose.Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=customer-onboarding.model.d.ts.map