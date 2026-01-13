import mongoose, { Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';
export interface IInvitationToken extends Document {
    token: string;
    email: string;
    organizationId?: mongoose.Types.ObjectId;
    organizationType: OrganizationType;
    portalType: PortalType;
    role: string;
    expiresAt: Date;
    used: boolean;
    usedAt?: Date;
    status: InvitationStatus;
    revokedAt?: Date;
    resendCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const InvitationToken: mongoose.Model<IInvitationToken, {}, {}, {}, mongoose.Document<unknown, {}, IInvitationToken, {}, {}> & IInvitationToken & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=invitation-token.model.d.ts.map