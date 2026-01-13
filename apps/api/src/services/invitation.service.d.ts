import mongoose from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
export declare class InvitationService {
    createInvitationToken(data: {
        email: string;
        organizationId?: string;
        organizationType: OrganizationType;
        portalType: PortalType;
        role: string;
        organizationName?: string;
        resendCount?: number;
    }): Promise<{
        invitationId: any;
        token: string;
        invitationLink: string;
        portalLink: string;
        expiresAt: Date;
    }>;
    sendInvitationEmail(data: {
        email: string;
        firstName: string;
        lastName: string;
        organizationName: string;
        organizationType: OrganizationType;
        invitationLink: string;
        portalLink: string;
        temporaryPassword?: string;
        invitedByCustomerName?: string;
    }): Promise<boolean>;
    getInvitationByToken(token: string): Promise<mongoose.Document<unknown, {}, import("../models/invitation-token.model").IInvitationToken, {}, {}> & import("../models/invitation-token.model").IInvitationToken & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getOrganizationInvitations(organizationId: string, includeAllStatuses?: boolean): Promise<(mongoose.Document<unknown, {}, import("../models/invitation-token.model").IInvitationToken, {}, {}> & import("../models/invitation-token.model").IInvitationToken & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    revokeInvitation(invitationId: string, organizationId?: string): Promise<mongoose.Document<unknown, {}, import("../models/invitation-token.model").IInvitationToken, {}, {}> & import("../models/invitation-token.model").IInvitationToken & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    resendInvitation(invitationId: string, organizationId?: string): Promise<{
        invitation: (mongoose.Document<unknown, {}, import("../models/invitation-token.model").IInvitationToken, {}, {}> & import("../models/invitation-token.model").IInvitationToken & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
        temporaryPassword: string;
    }>;
}
export declare const invitationService: InvitationService;
//# sourceMappingURL=invitation.service.d.ts.map