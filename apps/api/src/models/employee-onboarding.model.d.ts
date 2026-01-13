import mongoose, { Document } from 'mongoose';
export interface IEmployeeOnboarding extends Document {
    employeeId?: mongoose.Types.ObjectId;
    invitationToken: string;
    organizationId: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
    profilePhoto?: string;
    country: string;
    state: string;
    city: string;
    zipCode: string;
    addressLine1?: string;
    addressLine2?: string;
    accountNumber: string;
    ifscOrSwift: string;
    bankName: string;
    identityDocumentType?: string;
    passport?: string;
    nationalId?: string;
    drivingLicense?: string;
    pan?: string;
    ssn?: string;
    paymentIdentityType?: string;
    paymentIdentityDocument?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    nomineePhone?: string;
    nomineePhoneCountryCode?: string;
    status: 'submitted' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectionReason?: string;
    approvedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const EmployeeOnboarding: mongoose.Model<IEmployeeOnboarding, {}, {}, {}, mongoose.Document<unknown, {}, IEmployeeOnboarding, {}, {}> & IEmployeeOnboarding & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=employee-onboarding.model.d.ts.map