import mongoose, { Document } from 'mongoose';
import { LicenseStatus, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
export interface ILicense extends Document {
    licenseKey: string;
    organizationId: mongoose.Types.ObjectId;
    organizationType: OrganizationType;
    status: LicenseStatus;
    expiresAt: Date;
    issuedAt: Date;
    usageLimits: {
        users?: number;
        vessels?: number;
        items?: number;
        employees?: number;
        businessUnits?: number;
    };
    currentUsage: {
        users?: number;
        vessels?: number;
        items?: number;
        employees?: number;
        businessUnits?: number;
    };
    pricing?: {
        monthlyPrice: number;
        yearlyPrice: number;
        currency: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const License: mongoose.Model<ILicense, {}, {}, {}, mongoose.Document<unknown, {}, ILicense, {}, {}> & ILicense & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=license.model.d.ts.map