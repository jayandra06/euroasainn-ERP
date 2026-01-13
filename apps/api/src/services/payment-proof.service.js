import { PaymentProof } from '../models/payment-proof.model';
import { Quotation } from '../models/quotation.model';
import { RFQ } from '../models/rfq.model';
export class PaymentProofService {
    /**
     * Create payment proof submission
     */
    async submitPaymentProof(quotationId, customerOrganizationId, paymentData) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        // Verify quotation exists
        const quotation = await Quotation.findById(quotationId)
            .populate('organizationId', 'name');
        if (!quotation) {
            throw new Error('Quotation not found');
        }
        // Get RFQ to verify customer ownership
        const rfqId = quotation.rfqId?.toString();
        if (!rfqId) {
            throw new Error('RFQ ID not found in quotation');
        }
        const rfq = await RFQ.findById(rfqId);
        if (!rfq) {
            throw new Error('RFQ not found');
        }
        // Verify the RFQ belongs to the customer organization
        const rfqOrgId = rfq.organizationId?._id
            ? rfq.organizationId._id.toString()
            : rfq.organizationId?.toString();
        const customerOrgIdStr = customerOrganizationId.toString();
        if (rfqOrgId !== customerOrgIdStr) {
            throw new Error('You do not have permission to submit payment for this quotation');
        }
        // Get vendor organization ID (for admin quotations, use the dummy admin org ID)
        // Normalize to ObjectId - handle both populated and non-populated cases
        let vendorOrgId;
        if (quotation.organizationId?._id) {
            vendorOrgId = quotation.organizationId._id;
        }
        else if (quotation.organizationId) {
            vendorOrgId = typeof quotation.organizationId === 'string'
                ? new mongoose.Types.ObjectId(quotation.organizationId)
                : quotation.organizationId;
        }
        else {
            throw new Error('Vendor organization not found');
        }
        // Check if this is an admin quotation (special offer)
        const isAdminOffer = quotation.isAdminOffer === true;
        // Log for debugging
        logger.info(`💾 Saving payment proof for quotation ${quotationId}, vendorOrgId: ${vendorOrgId.toString()}, isAdminOffer: ${isAdminOffer}`);
        // Check if payment proof already exists
        const quotationObjectId = new mongoose.Types.ObjectId(quotationId);
        logger.info(`💾 Saving payment proof - quotationId: ${quotationId}, quotationObjectId: ${quotationObjectId.toString()}, vendorOrgId: ${vendorOrgId.toString()}`);
        let paymentProof = await PaymentProof.findOne({
            quotationId: quotationObjectId,
            customerOrganizationId: new mongoose.Types.ObjectId(customerOrganizationId),
        });
        if (paymentProof) {
            // Update existing - ensure vendorOrganizationId is set correctly
            Object.assign(paymentProof, paymentData);
            paymentProof.vendorOrganizationId = vendorOrgId; // Ensure it's set correctly
            paymentProof.status = 'submitted';
            paymentProof.submittedAt = new Date();
            await paymentProof.save();
            logger.info(`✅ Payment proof updated for quotation ${quotationId}, stored quotationId: ${paymentProof.quotationId.toString()}, vendorOrgId: ${vendorOrgId.toString()}`);
        }
        else {
            // Create new
            paymentProof = new PaymentProof({
                quotationId: quotationObjectId,
                rfqId: new mongoose.Types.ObjectId(rfqId),
                customerOrganizationId: new mongoose.Types.ObjectId(customerOrganizationId),
                vendorOrganizationId: vendorOrgId,
                ...paymentData,
                status: 'submitted',
                submittedAt: new Date(),
            });
            await paymentProof.save();
            logger.info(`✅ Payment proof created for quotation ${quotationId}, stored quotationId: ${paymentProof.quotationId.toString()}, vendorOrgId: ${vendorOrgId.toString()}, _id: ${paymentProof._id.toString()}`);
        }
        return paymentProof;
    }
    /**
     * Get payment proof for a quotation
     */
    async getPaymentProofByQuotationId(quotationId) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        logger.info(`🔍 Searching for payment proof with quotationId: ${quotationId}`);
        // Try to find payment proof - also search without ObjectId conversion in case of string mismatch
        let paymentProof = await PaymentProof.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
        })
            .populate('customerOrganizationId', 'name')
            .populate('vendorOrganizationId', 'name')
            .lean();
        // If not found, try searching as string (in case quotationId is stored as string)
        if (!paymentProof) {
            logger.info(`⚠️ Payment proof not found with ObjectId, trying string search...`);
            paymentProof = await PaymentProof.findOne({
                quotationId: quotationId,
            })
                .populate('customerOrganizationId', 'name')
                .populate('vendorOrganizationId', 'name')
                .lean();
        }
        // If still not found, try a more flexible search
        if (!paymentProof) {
            logger.info(`⚠️ Payment proof not found with exact match, trying flexible search...`);
            const allPaymentProofs = await PaymentProof.find({})
                .populate('customerOrganizationId', 'name')
                .populate('vendorOrganizationId', 'name')
                .lean();
            logger.info(`📊 Total payment proofs in DB: ${allPaymentProofs.length}`);
            for (const pp of allPaymentProofs) {
                const ppQuotationId = pp.quotationId?._id?.toString() || pp.quotationId?.toString();
                logger.info(`  - Payment proof quotationId: ${ppQuotationId}, matches: ${ppQuotationId === quotationId}`);
                if (ppQuotationId === quotationId) {
                    paymentProof = pp;
                    logger.info(`✅ Found payment proof via flexible search!`);
                    break;
                }
            }
        }
        if (paymentProof) {
            // Normalize vendorOrgId (handle both populated and non-populated)
            const vendorOrgId = paymentProof.vendorOrganizationId?._id
                ? paymentProof.vendorOrganizationId._id.toString()
                : paymentProof.vendorOrganizationId?.toString();
            logger.info(`✅ Found payment proof for quotation ${quotationId}, vendorOrgId: ${vendorOrgId}, status: ${paymentProof.status}, paymentAmount: ${paymentProof.paymentAmount}`);
        }
        else {
            logger.warn(`❌ No payment proof found for quotation ${quotationId} after all search attempts`);
        }
        return paymentProof;
    }
    /**
     * Get payment proof for an RFQ (all quotations)
     */
    async getPaymentProofByRFQId(rfqId) {
        const mongoose = await import('mongoose');
        return await PaymentProof.find({
            rfqId: new mongoose.Types.ObjectId(rfqId),
        })
            .populate('customerOrganizationId', 'name')
            .populate('vendorOrganizationId', 'name')
            .populate('quotationId', 'quotationNumber')
            .sort({ submittedAt: -1 })
            .lean();
    }
    /**
     * Get payment proof for a vendor organization
     */
    async getPaymentProofByVendorOrganization(organizationId) {
        const mongoose = await import('mongoose');
        return await PaymentProof.find({
            vendorOrganizationId: new mongoose.Types.ObjectId(organizationId),
        })
            .populate('quotationId', 'quotationNumber')
            .populate('rfqId', 'rfqNumber')
            .populate('customerOrganizationId', 'name')
            .sort({ submittedAt: -1 })
            .lean();
    }
    /**
     * Approve payment and start packing (vendor action)
     */
    async approvePayment(quotationId, vendorUserId) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        const paymentProof = await PaymentProof.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
        });
        if (!paymentProof) {
            throw new Error('Payment proof not found');
        }
        if (paymentProof.status === 'approved') {
            throw new Error('Payment has already been approved');
        }
        paymentProof.status = 'approved';
        paymentProof.approvedAt = new Date();
        paymentProof.approvedBy = new mongoose.Types.ObjectId(vendorUserId);
        await paymentProof.save();
        logger.info(`✅ Payment approved for quotation ${quotationId} by user ${vendorUserId}`);
        return paymentProof;
    }
    /**
     * Select shipping option (customer action)
     */
    async selectShippingOption(quotationId, shippingOption, shippingDetails) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        const paymentProof = await PaymentProof.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
        });
        if (!paymentProof) {
            throw new Error('Payment proof not found');
        }
        if (paymentProof.status !== 'approved') {
            throw new Error('Payment must be approved before selecting shipping option');
        }
        paymentProof.shippingOption = shippingOption;
        paymentProof.shippingSelectedAt = new Date();
        // Store shipping details for self-managed shipping
        if (shippingOption === 'self' && shippingDetails) {
            paymentProof.awbTrackingNumber = shippingDetails.awbTrackingNumber;
            paymentProof.shippingContactName = shippingDetails.shippingContactName;
            paymentProof.shippingContactEmail = shippingDetails.shippingContactEmail;
            paymentProof.shippingContactPhone = shippingDetails.shippingContactPhone;
        }
        else {
            // Clear self-managed shipping details if switching to vendor-managed
            paymentProof.awbTrackingNumber = undefined;
            paymentProof.shippingContactName = undefined;
            paymentProof.shippingContactEmail = undefined;
            paymentProof.shippingContactPhone = undefined;
        }
        await paymentProof.save();
        logger.info(`✅ Shipping option "${shippingOption}" selected for quotation ${quotationId}`);
        return paymentProof;
    }
    /**
     * Submit vendor shipping details (for vendor-managed shipping)
     */
    async submitVendorShippingDetails(quotationId, vendorUserId, shippingDetails) {
        const mongoose = await import('mongoose');
        const { logger } = await import('../config/logger');
        const paymentProof = await PaymentProof.findOne({
            quotationId: new mongoose.Types.ObjectId(quotationId),
        });
        if (!paymentProof) {
            throw new Error('Payment proof not found');
        }
        if (paymentProof.shippingOption !== 'vendor-managed') {
            throw new Error('This quotation is not set for vendor-managed shipping');
        }
        if (paymentProof.status !== 'approved') {
            throw new Error('Payment must be approved before submitting shipping details');
        }
        // Update vendor shipping details
        paymentProof.vendorAWBTrackingNumber = shippingDetails.awbTrackingNumber;
        paymentProof.vendorShippingContactName = shippingDetails.shippingContactName;
        paymentProof.vendorShippingContactEmail = shippingDetails.shippingContactEmail;
        paymentProof.vendorShippingContactPhone = shippingDetails.shippingContactPhone;
        paymentProof.vendorShippingSubmittedAt = new Date();
        paymentProof.vendorShippingSubmittedBy = new mongoose.Types.ObjectId(vendorUserId);
        await paymentProof.save();
        logger.info(`✅ Vendor shipping details submitted for quotation ${quotationId} by user ${vendorUserId}`);
        return paymentProof;
    }
}
export const paymentProofService = new PaymentProofService();
//# sourceMappingURL=payment-proof.service.js.map