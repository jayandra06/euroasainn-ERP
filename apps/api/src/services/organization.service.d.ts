import mongoose from "mongoose";
import { IOrganization } from "../models/organization.model";
import { OrganizationType, PortalType } from "../../../../packages/shared/src/types/index.ts";
export declare class OrganizationService {
    createOrganization(data: {
        name: string;
        type: OrganizationType;
        portalType: PortalType;
        metadata?: Record<string, any>;
        invitedBy?: "admin" | "tech" | "customer";
        invitedByOrganizationId?: string;
    }): Promise<mongoose.Document<unknown, {}, IOrganization, {}, {}> & IOrganization & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getOrganizations(type?: OrganizationType, portalType?: PortalType, filters?: {
        isActive?: boolean;
        customerOrganizationId?: string;
        requesterPortalType?: PortalType;
    }): Promise<(mongoose.FlattenMaps<IOrganization> & Required<{
        _id: mongoose.FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    getOrganizationById(orgId: string): Promise<mongoose.Document<unknown, {}, IOrganization, {}, {}> & IOrganization & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateOrganization(orgId: string, data: Partial<IOrganization>): Promise<mongoose.Document<unknown, {}, IOrganization, {}, {}> & IOrganization & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    addCustomerToVendorVisibility(vendorOrganizationId: string, customerOrganizationId: string): Promise<mongoose.Document<unknown, {}, IOrganization, {}, {}> & IOrganization & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteOrganization(orgId: string): Promise<{
        success: boolean;
    }>;
}
export declare const organizationService: OrganizationService;
//# sourceMappingURL=organization.service.d.ts.map