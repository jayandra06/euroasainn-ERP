import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePortal } from "../middleware/portal.middleware";
// import { casbinMiddleware } from "../middleware/casbin.middleware";
import { userController } from "../controllers/user.controller";
import { organizationController } from "../controllers/organization.controller";
import { onboardingController } from "../controllers/onboarding.controller";
import { licenseController } from "../controllers/license.controller";
import { PortalType } from "../../../../packages/shared/src/types/index";
const router = Router();
/* ======================================
   🔐 GLOBAL MIDDLEWARE FOR TECH PORTAL
====================================== */
// 1️⃣ Auth
router.use(authMiddleware);
// 2️⃣ Portal guard
router.use(requirePortal(PortalType.ADMIN));
// 3️⃣ Casbin (GLOBAL for this router)
//router.use(casbinMiddleware);
/* ===========================
   USER ROUTES
=========================== */
router.get("/users", userController.getUsers.bind(userController));
router.post("/users", userController.createUser.bind(userController));
router.post("/users/invite", userController.inviteUser.bind(userController));
router.get("/users/:id", userController.getUserById.bind(userController));
router.put("/users/:id", userController.updateUser.bind(userController));
router.delete("/users/:id", userController.deleteUser.bind(userController));
/* ===========================
   ORGANIZATION ROUTES
=========================== */
router.get("/organizations", organizationController.getOrganizations.bind(organizationController));
router.get("/organizations-with-licenses", organizationController.getOrganizationsWithLicenses.bind(organizationController));
router.post("/organizations", organizationController.createOrganization.bind(organizationController));
router.post("/organizations/invite", organizationController.inviteOrganizationAdmin.bind(organizationController));
router.get("/organizations/:id", organizationController.getOrganizationById.bind(organizationController));
router.put("/organizations/:id", organizationController.updateOrganization.bind(organizationController));
router.delete("/organizations/:id", organizationController.deleteOrganization.bind(organizationController));
/* ===========================
   LICENSE ROUTES
=========================== */
router.get("/licenses", licenseController.getLicenses.bind(licenseController));
router.post("/licenses", licenseController.createLicense.bind(licenseController));
router.get("/licenses/:id", licenseController.getLicenseById.bind(licenseController));
router.put("/licenses/:id", licenseController.updateLicense.bind(licenseController));
router.delete("/licenses/:id", licenseController.deleteLicense.bind(licenseController));
/* ===========================
   ONBOARDING ROUTES
=========================== */
router.get("/customer-onboardings", onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get("/vendor-onboardings", onboardingController.getVendorOnboardings.bind(onboardingController));
router.get("/customer-onboardings/:id", onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get("/vendor-onboardings/:id", onboardingController.getVendorOnboardingById.bind(onboardingController));
router.post("/customer-onboardings/:id/approve", onboardingController.approveCustomerOnboarding.bind(onboardingController));
router.post("/customer-onboardings/:id/reject", onboardingController.rejectCustomerOnboarding.bind(onboardingController));
router.post("/vendor-onboardings/:id/approve", onboardingController.approveVendorOnboarding.bind(onboardingController));
router.post("/vendor-onboardings/:id/reject", onboardingController.rejectVendorOnboarding.bind(onboardingController));
/* ===========================
   RFQ ROUTES
=========================== */
router.get("/rfq", async (req, res) => {
    try {
        const { rfqService } = await import("../services/rfq.service");
        const { logger } = await import("../config/logger");
        logger.info(`[Admin RFQ Route] Fetching RFQs with filters: ${JSON.stringify(req.query)}`);
        const rfqs = await rfqService.getAllRFQs(req.query);
        logger.info(`[Admin RFQ Route] Found ${rfqs.length} RFQs`);
        res.json({ success: true, data: rfqs });
    }
    catch (error) {
        const { logger } = await import("../config/logger");
        logger.error(`[Admin RFQ Route] Error: ${error.message}`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get("/rfq/:id", async (req, res) => {
    try {
        const { rfqService } = await import("../services/rfq.service");
        const rfq = await rfqService.getRFQById(req.params.id);
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
/* ===========================
   QUOTATION ROUTES (Admin can offer quotes)
=========================== */
router.get("/quotation/rfq/:rfqId", async (req, res) => {
    try {
        const { quotationService } = await import("../services/quotation.service");
        // Admin quotations don't have organizationId, so we check by rfqId and isAdminOffer
        const quotation = await quotationService.getQuotationByRFQIdForAdmin(req.params.rfqId);
        res.json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post("/quotation", async (req, res) => {
    try {
        const { quotationService } = await import("../services/quotation.service");
        // Admin quotations are marked with isAdminOffer: true
        const quotationData = {
            ...req.body,
            isAdminOffer: true,
        };
        const quotation = await quotationService.createAdminQuotation(quotationData);
        res.status(201).json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Payment Proof Routes for Admin Portal
router.get('/payment-proof/quotation/:quotationId', async (req, res) => {
    try {
        const { paymentProofService } = await import('../services/payment-proof.service');
        const paymentProof = await paymentProofService.getPaymentProofByQuotationId(req.params.quotationId);
        res.json({ success: true, data: paymentProof });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
// Approve payment and start packing (admin action)
router.post('/payment-proof/:quotationId/approve', async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { User } = await import('../models/user.model');
        const { logger } = await import('../config/logger');
        // Approve payment (admin action)
        const paymentProof = await paymentProofService.approvePayment(req.params.quotationId, userId);
        // Get quotation and RFQ details for email
        const quotation = await Quotation.findById(req.params.quotationId)
            .populate('organizationId', 'name')
            .lean();
        const rfq = await RFQ.findById(paymentProof.rfqId)
            .populate('organizationId', 'name')
            .lean();
        if (quotation && rfq) {
            // Get customer admin users to send email
            const customerOrgId = rfq.organizationId?._id || rfq.organizationId;
            const customerUsers = await User.find({
                organizationId: customerOrgId,
                role: 'customer_admin',
            }).limit(5);
            // Send email to customer admins
            for (const customerUser of customerUsers) {
                try {
                    await emailService.sendPaymentApprovalEmail({
                        to: customerUser.email,
                        firstName: customerUser.firstName || 'Customer',
                        lastName: customerUser.lastName || 'Admin',
                        vendorOrganizationName: 'Euroasiann Admin (Special Offer)',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Payment approval email sent to ${customerUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send payment approval email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: paymentProof,
            message: 'Payment approved successfully. Customer has been notified.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to approve payment',
        });
    }
});
export default router;
//# sourceMappingURL=admin-portal.routes.js.map