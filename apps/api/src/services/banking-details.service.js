import { BankingDetails } from '../models/banking-details.model';
import { Quotation } from '../models/quotation.model';
export class BankingDetailsService {
    /**
     * Create or update banking details for a quotation
     */
    async saveBankingDetails(quotationId, organizationId, bankingData) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        // Verify quotation exists and belongs to the organization
        const quotation = await Quotation.findById(quotationId);
        if (!quotation) {
            throw new Error('Quotation not found');
        }
        if (quotation.organizationId?.toString() !== organizationId) {
            throw new Error('You do not have permission to add banking details for this quotation');
        }
        // Get RFQ ID from quotation
        const rfqId = quotation.rfqId?.toString();
        if (!rfqId) {
            throw new Error('RFQ ID not found in quotation');
        }
        // Check if banking details already exist
        let bankingDetails = await BankingDetails.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
            organizationId: new mongoose.Types.ObjectId(organizationId),
        });
        if (bankingDetails) {
            // Update existing
            Object.assign(bankingDetails, bankingData);
            bankingDetails.status = 'submitted';
            bankingDetails.submittedAt = new Date();
            await bankingDetails.save();
            logger.info(`✅ Banking details updated for quotation ${quotationId}`);
        }
        else {
            // Create new
            bankingDetails = new BankingDetails({
                quotationId: new mongoose.Types.ObjectId(quotationId),
                rfqId: new mongoose.Types.ObjectId(rfqId),
                organizationId: new mongoose.Types.ObjectId(organizationId),
                ...bankingData,
                status: 'submitted',
                submittedAt: new Date(),
            });
            await bankingDetails.save();
            logger.info(`✅ Banking details created for quotation ${quotationId}`);
        }
        return bankingDetails;
    }
    /**
     * Get banking details for a quotation
     */
    async getBankingDetailsByQuotationId(quotationId) {
        const mongoose = await import('mongoose');
        return await BankingDetails.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
        })
            .populate('organizationId', 'name')
            .lean();
    }
    /**
     * Get banking details for an RFQ (all quotations)
     */
    async getBankingDetailsByRFQId(rfqId) {
        const mongoose = await import('mongoose');
        return await BankingDetails.find({
            rfqId: new mongoose.Types.ObjectId(rfqId),
        })
            .populate('organizationId', 'name')
            .populate('quotationId', 'quotationNumber')
            .sort({ submittedAt: -1 })
            .lean();
    }
    /**
     * Get banking details for a vendor organization
     */
    async getBankingDetailsByOrganization(organizationId) {
        const mongoose = await import('mongoose');
        return await BankingDetails.find({
            organizationId: new mongoose.Types.ObjectId(organizationId),
        })
            .populate('quotationId', 'quotationNumber')
            .populate('rfqId', 'rfqNumber')
            .sort({ submittedAt: -1 })
            .lean();
    }
}
export const bankingDetailsService = new BankingDetailsService();
//# sourceMappingURL=banking-details.service.js.map