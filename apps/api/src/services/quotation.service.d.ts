import { IQuotation } from '../models/quotation.model';
export declare class QuotationService {
    generateQuotationNumber(): string;
    createQuotation(organizationId: string, data: Partial<IQuotation>): Promise<import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getQuotations(organizationId: string, filters?: any): Promise<(import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get quotation by RFQ ID for a specific vendor
     * Returns the quotation if it exists, null otherwise
     */
    getQuotationByRFQIdForVendor(rfqId: string, vendorOrganizationId: string): Promise<{
        _id: import("mongoose").FlattenMaps<unknown>;
        quotationNumber: string;
        title: string;
        description: string | undefined;
        status: string;
        totalAmount: number;
        currency: string;
        submittedAt: Date;
        items: any;
        terms: any;
    } | null>;
    getQuotationById(quotationId: string, organizationId: string): Promise<import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateQuotation(quotationId: string, organizationId: string, data: Partial<IQuotation>): Promise<import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteQuotation(quotationId: string, organizationId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Create an admin quotation (special offer)
     * Admin quotations don't have organizationId, they're marked with isAdminOffer: true
     */
    createAdminQuotation(data: Partial<IQuotation>): Promise<import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get admin quotation by RFQ ID
     */
    getQuotationByRFQIdForAdmin(rfqId: string): Promise<{
        _id: import("mongoose").FlattenMaps<unknown>;
        quotationNumber: string;
        title: string;
        description: string | undefined;
        status: string;
        totalAmount: number;
        currency: string;
        submittedAt: Date;
        isAdminOffer: boolean | undefined;
        items: any;
        terms: any;
    } | null>;
    /**
     * Get all quotations for a specific RFQ (for customer portal)
     * Returns quotations from all vendors for the given RFQ, plus admin quotations
     */
    getQuotationsByRFQId(rfqId: string): Promise<{
        _id: any;
        quotationNumber: any;
        vendorOrganizationId: {
            _id: any;
            name: any;
        };
        isAdminOffer: any;
        status: any;
        submittedAt: any;
        items: any;
        terms: any;
        totalAmount: any;
        currency: any;
    }[]>;
    /**
     * Finalize an offer (customer selects a vendor quotation)
     * Updates quotation status to 'finalized' and RFQ status to 'ordered'
     * Sends email notification to vendor to submit banking details
     */
    finalizeOffer(quotationId: string, customerOrganizationId: string): Promise<import("mongoose").Document<unknown, {}, IQuotation, {}, {}> & IQuotation & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
export declare const quotationService: QuotationService;
//# sourceMappingURL=quotation.service.d.ts.map