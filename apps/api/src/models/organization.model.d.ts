import mongoose, { Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
export interface IOrganization extends Document {
    name: string;
    type: OrganizationType;
    portalType: PortalType;
    isActive: boolean;
    licenseKey?: string;
    invitedBy?: 'admin' | 'tech' | 'customer';
    invitedByOrganizationId?: mongoose.Types.ObjectId;
    isAdminInvited?: boolean;
    visibleToCustomerIds?: mongoose.Types.ObjectId[];
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Organization: mongoose.Model<IOrganization, {}, {}, {}, mongoose.Document<unknown, {}, IOrganization, {}, {}> & IOrganization & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=organization.model.d.ts.map