import { IBankingDetails } from '../models/banking-details.model';
export declare class BankingDetailsService {
    /**
     * Create or update banking details for a quotation
     */
    saveBankingDetails(quotationId: string, organizationId: string, bankingData: Partial<IBankingDetails>): Promise<import("mongoose").Document<unknown, {}, IBankingDetails, {}, {}> & IBankingDetails & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    /**
     * Get banking details for a quotation
     */
    getBankingDetailsByQuotationId(quotationId: string): Promise<(import("mongoose").FlattenMaps<IBankingDetails> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get banking details for an RFQ (all quotations)
     */
    getBankingDetailsByRFQId(rfqId: string): Promise<(import("mongoose").FlattenMaps<IBankingDetails> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get banking details for a vendor organization
     */
    getBankingDetailsByOrganization(organizationId: string): Promise<(import("mongoose").FlattenMaps<IBankingDetails> & Required<{
        _id: import("mongoose").FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
}
export declare const bankingDetailsService: BankingDetailsService;
//# sourceMappingURL=banking-details.service.d.ts.map