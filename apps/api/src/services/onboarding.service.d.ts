import { ICustomerOnboarding } from '../models/customer-onboarding.model';
import { IVendorOnboarding } from '../models/vendor-onboarding.model';
export declare class OnboardingService {
    getInvitationByToken(token: string): Promise<import("mongoose").Document<unknown, {}, import("../models/invitation-token.model").IInvitationToken, {}, {}> & import("../models/invitation-token.model").IInvitationToken & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    submitCustomerOnboarding(data: Partial<ICustomerOnboarding>, token: string): Promise<import("mongoose").Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    submitVendorOnboarding(data: Partial<IVendorOnboarding>, token: string): Promise<import("mongoose").Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getCustomerOnboardings(filters?: {
        organizationId?: string;
        status?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getVendorOnboardings(filters?: {
        organizationId?: string;
        status?: string;
    }): Promise<(import("mongoose").Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getCustomerOnboardingById(id: string): Promise<import("mongoose").Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getVendorOnboardingById(id: string): Promise<import("mongoose").Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    approveCustomerOnboarding(id: string): Promise<import("mongoose").Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    rejectCustomerOnboarding(id: string, rejectionReason?: string): Promise<import("mongoose").Document<unknown, {}, ICustomerOnboarding, {}, {}> & ICustomerOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    approveVendorOnboarding(id: string): Promise<import("mongoose").Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    rejectVendorOnboarding(id: string, rejectionReason?: string): Promise<import("mongoose").Document<unknown, {}, IVendorOnboarding, {}, {}> & IVendorOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
export declare const onboardingService: OnboardingService;
//# sourceMappingURL=onboarding.service.d.ts.map