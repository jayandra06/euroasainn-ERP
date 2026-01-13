import { ICustomerVendorInvitation } from '../models/customer-vendor-invitation.model';
export declare class CustomerVendorInvitationService {
    /**
     * Generate a secure invitation token
     */
    private generateToken;
    /**
     * Create a new customer-vendor invitation
     */
    createInvitation(data: {
        customerOrganizationId: string;
        vendorEmail: string;
        vendorName: string;
        vendorFirstName?: string;
        vendorLastName?: string;
        vendorOrganizationId?: string;
    }): Promise<ICustomerVendorInvitation>;
    /**
     * Get invitation by token
     */
    getInvitationByToken(token: string): Promise<ICustomerVendorInvitation | null>;
    /**
     * Accept invitation
     */
    acceptInvitation(token: string): Promise<ICustomerVendorInvitation>;
    /**
     * Decline invitation
     */
    declineInvitation(token: string): Promise<ICustomerVendorInvitation>;
    /**
     * Get invitations for a customer organization
     */
    getCustomerInvitations(customerOrganizationId: string): Promise<ICustomerVendorInvitation[]>;
    /**
     * Check if vendor email exists in the system
     */
    checkVendorEmailExists(email: string): Promise<{
        exists: boolean;
        vendorOrganizationId?: string;
    }>;
}
export declare const customerVendorInvitationService: CustomerVendorInvitationService;
//# sourceMappingURL=customer-vendor-invitation.service.d.ts.map