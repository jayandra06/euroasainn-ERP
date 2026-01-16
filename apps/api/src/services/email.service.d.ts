interface SendInvitationEmailParams {
    to: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    organizationType: 'customer' | 'vendor';
    invitationLink: string;
    portalLink: string;
    temporaryPassword?: string;
    invitedByCustomerName?: string;
}
export declare class EmailService {
    sendInvitationEmail({ to, firstName, lastName, organizationName, organizationType, invitationLink, portalLink: _portalLink, temporaryPassword: _temporaryPassword, invitedByCustomerName, }: SendInvitationEmailParams): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendWelcomeEmail({ to, firstName, lastName, portalLink, temporaryPassword, organizationType, isExternalVendor, }: {
        to: string;
        firstName: string;
        lastName: string;
        portalLink: string;
        temporaryPassword: string;
        organizationType?: 'customer' | 'vendor';
        isExternalVendor?: boolean;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendUserInvitationEmail({ to, firstName, lastName, portalType, portalLink, temporaryPassword, }: {
        to: string;
        firstName: string;
        lastName: string;
        portalType: string;
        portalLink: string;
        temporaryPassword: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendEmployeeInvitationEmail({ to, firstName, lastName, organizationName, onboardingLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        organizationName: string;
        onboardingLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendPaymentSuccessEmail({ to, firstName, lastName, organizationName, amount, currency, portalLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        organizationName: string;
        amount: number;
        currency: string;
        portalLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendPaymentFailedEmail({ to, firstName, lastName, organizationName, amount, currency, }: {
        to: string;
        firstName: string;
        lastName: string;
        organizationName: string;
        amount: number;
        currency: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendPaymentProcessingEmail({ to, firstName, lastName, organizationName, amount, currency, }: {
        to: string;
        firstName: string;
        lastName: string;
        organizationName: string;
        amount: number;
        currency: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendExistingVendorInvitationEmail({ to, firstName, lastName, customerOrganizationName, acceptLink, declineLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        customerOrganizationName: string;
        acceptLink: string;
        declineLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send RFQ notification email to vendors
     */
    sendRFQNotificationEmail({ to, firstName, lastName, customerOrganizationName, rfqNumber, rfqTitle, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        customerOrganizationName: string;
        rfqNumber: string;
        rfqTitle: string;
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    sendQuotationNotificationEmail({ to, firstName, lastName, vendorOrganizationName, quotationNumber, rfqNumber, quotationLink, quotationDetails, }: {
        to: string;
        firstName: string;
        lastName: string;
        vendorOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        quotationLink: string;
        quotationDetails: {
            items: any[];
            terms: any;
            totalAmount: number;
            currency: string;
        };
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send email to vendor when their quotation is finalized
     * Instructs vendor to log in and submit banking details
     */
    sendQuotationFinalizedEmail({ to, firstName, lastName, vendorOrganizationName: _vendorOrganizationName, quotationNumber, rfqNumber, customerOrganizationName, quotationLink, totalAmount, currency, }: {
        to: string;
        firstName: string;
        lastName: string;
        vendorOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        customerOrganizationName: string;
        quotationLink: string;
        totalAmount: number;
        currency: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send banking details email to customer (PDF format)
     */
    sendBankingDetailsEmail({ to, firstName, lastName, vendorOrganizationName, quotationNumber, rfqNumber, bankingDetails, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        vendorOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        bankingDetails: any;
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send payment proof email to vendor
     */
    sendPaymentProofEmail({ to, firstName, lastName, customerOrganizationName, quotationNumber, rfqNumber, paymentProof, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        customerOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        paymentProof: any;
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send payment approval email to customer with shipping options
     */
    sendPaymentApprovalEmail({ to, firstName, lastName, vendorOrganizationName, quotationNumber, rfqNumber, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        vendorOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send shipping decision email to vendor
     */
    sendShippingDecisionEmail({ to, firstName, lastName, customerOrganizationName, quotationNumber, rfqNumber, shippingOption, shippingDetails, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        customerOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        shippingOption: 'self' | 'vendor-managed';
        shippingDetails?: {
            awbTrackingNumber: string;
            shippingContactName: string;
            shippingContactEmail: string;
            shippingContactPhone: string;
        };
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
    /**
     * Send vendor shipping details email to customer
     */
    sendVendorShippingDetailsEmail({ to, firstName, lastName, vendorOrganizationName, quotationNumber, rfqNumber, shippingDetails, rfqLink, }: {
        to: string;
        firstName: string;
        lastName: string;
        vendorOrganizationName: string;
        quotationNumber: string;
        rfqNumber: string;
        shippingDetails: {
            awbTrackingNumber: string;
            shippingContactName: string;
            shippingContactEmail: string;
            shippingContactPhone: string;
        };
        rfqLink: string;
    }): Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map