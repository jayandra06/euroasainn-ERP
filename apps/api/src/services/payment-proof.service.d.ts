import { IPaymentProof } from '../models/payment-proof.model';
export declare class PaymentProofService {
    /**
     * Create payment proof submission
     */
    submitPaymentProof(quotationId: string, customerOrganizationId: string, paymentData: Partial<IPaymentProof>): Promise<import("mongoose").Document<unknown, {}, IPaymentProof, {}, {}> & IPaymentProof & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get payment proof for a quotation
     */
    getPaymentProofByQuotationId(quotationId: string): Promise<(import("mongoose").FlattenMaps<IPaymentProof> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get payment proof for an RFQ (all quotations)
     */
    getPaymentProofByRFQId(rfqId: string): Promise<(import("mongoose").FlattenMaps<IPaymentProof> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get payment proof for a vendor organization
     */
    getPaymentProofByVendorOrganization(organizationId: string): Promise<(import("mongoose").FlattenMaps<IPaymentProof> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    /**
     * Approve payment and start packing (vendor action)
     */
    approvePayment(quotationId: string, vendorUserId: string): Promise<import("mongoose").Document<unknown, {}, IPaymentProof, {}, {}> & IPaymentProof & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Select shipping option (customer action)
     */
    selectShippingOption(quotationId: string, shippingOption: 'self' | 'vendor-managed', shippingDetails?: {
        awbTrackingNumber?: string;
        shippingContactName?: string;
        shippingContactEmail?: string;
        shippingContactPhone?: string;
    }): Promise<import("mongoose").Document<unknown, {}, IPaymentProof, {}, {}> & IPaymentProof & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Submit vendor shipping details (for vendor-managed shipping)
     */
    submitVendorShippingDetails(quotationId: string, vendorUserId: string, shippingDetails: {
        awbTrackingNumber: string;
        shippingContactName: string;
        shippingContactEmail: string;
        shippingContactPhone: string;
    }): Promise<import("mongoose").Document<unknown, {}, IPaymentProof, {}, {}> & IPaymentProof & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
export declare const paymentProofService: PaymentProofService;
//# sourceMappingURL=payment-proof.service.d.ts.map