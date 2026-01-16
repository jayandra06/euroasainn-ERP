import { ILicense } from '../models/license.model';
import { LicenseStatus, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import mongoose from 'mongoose';
export declare class LicenseService {
    generateLicenseKey(): string;
    createLicense(data: {
        organizationId: string;
        organizationType: OrganizationType;
        expiresAt: Date;
        usageLimits: {
            users?: number;
            vessels?: number;
            items?: number;
            employees?: number;
            businessUnits?: number;
        };
        pricing?: {
            monthlyPrice?: number;
            yearlyPrice?: number;
            currency?: string;
        };
    }): Promise<mongoose.Document<unknown, {}, ILicense, {}, {}> & ILicense & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getLicenses(organizationId?: string, filters?: any): Promise<(mongoose.FlattenMaps<ILicense> & Required<{
        _id: mongoose.FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    getLicenseByKey(licenseKey: string): Promise<mongoose.Document<unknown, {}, ILicense, {}, {}> & ILicense & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    validateLicense(organizationId: string): Promise<ILicense>;
    checkUsageLimit(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits'): Promise<boolean>;
    incrementUsage(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits', amount?: number): Promise<void>;
    decrementUsage(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits', amount?: number): Promise<void>;
    updateLicenseStatus(licenseId: string, status: LicenseStatus): Promise<mongoose.Document<unknown, {}, ILicense, {}, {}> & ILicense & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
export declare const licenseService: LicenseService;
//# sourceMappingURL=license.service.d.ts.map