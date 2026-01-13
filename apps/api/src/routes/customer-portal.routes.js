import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { logger } from '../config/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
// import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { rfqService } from '../services/rfq.service';
import { vesselService } from '../services/vessel.service';
import { employeeService } from '../services/employee.service';
import { businessUnitService } from '../services/business-unit.service';
import { userController } from '../controllers/user.controller';
import { licenseService } from '../services/license.service';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { modelService } from '../services/model.service';
import { rolePayrollStructureService } from '../services/role-payroll-structure.service';
const router = Router();
// Multer setup for file uploads
const paymentUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
router.use(authMiddleware);
router.use(requirePortal(PortalType.CUSTOMER));
// License validation removed - all routes accessible without license validation
// Payment middleware removed - all routes accessible without payment check
// Users routes
router.get('/users', async (req, res) => {
    try {
        const requester = req.user;
        const organizationId = requester?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required',
            });
        }
        // Set portalType to CUSTOMER for customer portal users
        req.query.portalType = PortalType.CUSTOMER;
        req.query.organizationId = organizationId;
        await userController.getUsers(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get users',
        });
    }
});
router.post('/users/invite', async (req, res) => {
    try {
        req.body.portalType = PortalType.CUSTOMER;
        if (!req.user?.organizationId && !req.body.organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId is required',
            });
        }
        req.body.organizationId = req.body.organizationId || req.user?.organizationId;
        await userController.inviteUser(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to invite user',
        });
    }
});
// RFQ routes
router.get('/rfq', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const rfqs = await rfqService.getRFQs(orgId, req.query);
        res.json({ success: true, data: rfqs });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/rfq', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const { recipientVendorIds, ...rfqData } = req.body;
        if (!recipientVendorIds || !Array.isArray(recipientVendorIds) || recipientVendorIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one vendor must be selected',
            });
        }
        const rfq = await rfqService.createRFQ(orgId, rfqData, 'customer', // Customer is sending the RFQ
        recipientVendorIds);
        res.status(201).json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Get available vendors for RFQ creation (customer-invited only)
router.get('/rfq/vendors', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const vendors = await rfqService.getAvailableVendorsForRFQ(orgId, PortalType.CUSTOMER);
        res.json({ success: true, data: vendors });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/rfq/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const rfq = await rfqService.getRFQById(req.params.id, orgId);
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
// Get vendor quotations for a specific RFQ
router.get('/rfq/:id/quotations', async (req, res) => {
    try {
        const { quotationService } = await import('../services/quotation.service');
        const quotations = await quotationService.getQuotationsByRFQId(req.params.id);
        res.json({ success: true, data: quotations });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get banking details for an RFQ
router.get('/rfq/:id/banking-details', async (req, res) => {
    try {
        const { bankingDetailsService } = await import('../services/banking-details.service');
        const bankingDetails = await bankingDetailsService.getBankingDetailsByRFQId(req.params.id);
        res.json({ success: true, data: bankingDetails });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Submit payment proof
router.post('/payment-proof', paymentUpload.array('proofDocuments', 10), async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required',
            });
        }
        const quotationId = req.body.quotationId;
        if (!quotationId) {
            return res.status(400).json({
                success: false,
                error: 'Quotation ID is required',
            });
        }
        // Extract payment data from form
        const paymentData = {
            paymentAmount: parseFloat(req.body.paymentAmount) || 0,
            currency: req.body.currency || 'USD',
            paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
            paymentMethod: req.body.paymentMethod,
            transactionReference: req.body.transactionReference,
            notes: req.body.notes,
        };
        // Handle file uploads
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const documents = req.files.map((file) => ({
                fileName: file.originalname,
                fileUrl: `uploads/payment-proof/${file.originalname}`, // In production, use actual cloud storage URL
                fileType: file.mimetype,
                uploadedAt: new Date(),
            }));
            paymentData.proofDocuments = documents;
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { User } = await import('../models/user.model');
        // Save payment proof
        const paymentProof = await paymentProofService.submitPaymentProof(quotationId, orgId, paymentData);
        // Get quotation and RFQ details for email
        const quotation = await Quotation.findById(quotationId)
            .populate('organizationId', 'name')
            .lean();
        const rfq = await RFQ.findById(quotation.rfqId)
            .populate('organizationId', 'name')
            .lean();
        if (quotation && rfq) {
            // Get vendor admin users to send email
            const vendorOrgId = quotation.organizationId?._id || quotation.organizationId;
            const vendorUsers = await User.find({
                organizationId: vendorOrgId,
                role: 'vendor_admin',
            }).limit(5);
            // Send email to vendor admins
            for (const vendorUser of vendorUsers) {
                try {
                    await emailService.sendPaymentProofEmail({
                        to: vendorUser.email,
                        firstName: vendorUser.firstName || 'Vendor',
                        lastName: vendorUser.lastName || 'Admin',
                        customerOrganizationName: rfq.organizationId?.name || 'Customer',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        paymentProof: paymentProof,
                        rfqLink: `${process.env.VENDOR_PORTAL_URL || 'http://localhost:4400'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Payment proof email sent to ${vendorUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send payment proof email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: paymentProof,
            message: 'Payment proof submitted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to submit payment proof',
        });
    }
});
// Get payment proof for an RFQ
router.get('/rfq/:id/payment-proof', async (req, res) => {
    try {
        const { paymentProofService } = await import('../services/payment-proof.service');
        const paymentProof = await paymentProofService.getPaymentProofByRFQId(req.params.id);
        res.json({ success: true, data: paymentProof });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get payment proof for a quotation
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
// Select shipping option
router.post('/payment-proof/:quotationId/shipping', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required',
            });
        }
        const { shippingOption, awbTrackingNumber, shippingContactName, shippingContactEmail, shippingContactPhone } = req.body;
        if (!shippingOption || !['self', 'vendor-managed'].includes(shippingOption)) {
            return res.status(400).json({
                success: false,
                error: 'Valid shipping option is required (self or vendor-managed)',
            });
        }
        // Validate self-managed shipping details
        if (shippingOption === 'self') {
            if (!awbTrackingNumber || !shippingContactName || !shippingContactEmail || !shippingContactPhone) {
                return res.status(400).json({
                    success: false,
                    error: 'AWB tracking number, contact name, email, and phone number are required for self-managed shipping',
                });
            }
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { User } = await import('../models/user.model');
        const { logger } = await import('../config/logger');
        const shippingDetails = shippingOption === 'self' ? {
            awbTrackingNumber,
            shippingContactName,
            shippingContactEmail,
            shippingContactPhone,
        } : undefined;
        const paymentProof = await paymentProofService.selectShippingOption(req.params.quotationId, shippingOption, shippingDetails);
        // Get quotation and RFQ details for email
        const quotation = await Quotation.findById(req.params.quotationId)
            .populate('organizationId', 'name')
            .lean();
        const rfq = await RFQ.findById(paymentProof.rfqId)
            .populate('organizationId', 'name')
            .lean();
        if (quotation && rfq) {
            // Get vendor admin users to send email
            const vendorOrgId = quotation.organizationId?._id || quotation.organizationId;
            const vendorUsers = await User.find({
                organizationId: vendorOrgId,
                role: 'vendor_admin',
            }).limit(5);
            // Send email to vendor admins
            for (const vendorUser of vendorUsers) {
                try {
                    await emailService.sendShippingDecisionEmail({
                        to: vendorUser.email,
                        firstName: vendorUser.firstName || 'Vendor',
                        lastName: vendorUser.lastName || 'Admin',
                        customerOrganizationName: rfq.organizationId?.name || 'Customer',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        shippingOption,
                        shippingDetails: shippingOption === 'self' ? {
                            awbTrackingNumber,
                            shippingContactName,
                            shippingContactEmail,
                            shippingContactPhone,
                        } : undefined,
                        rfqLink: `${process.env.VENDOR_PORTAL_URL || 'http://localhost:4400'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Shipping decision email sent to ${vendorUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send shipping decision email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: paymentProof,
            message: `Shipping option "${shippingOption}" selected successfully. Vendor has been notified.`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to select shipping option',
        });
    }
});
// Finalize an offer (select a vendor quotation)
router.post('/quotations/:id/finalize', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const { quotationService } = await import('../services/quotation.service');
        const quotation = await quotationService.finalizeOffer(req.params.id, orgId);
        res.json({ success: true, data: quotation, message: 'Offer finalized successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/rfq/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const rfq = await rfqService.updateRFQ(req.params.id, orgId, req.body);
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.delete('/rfq/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        await rfqService.deleteRFQ(req.params.id, orgId);
        res.json({ success: true, message: 'RFQ deleted' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Vessel routes
router.get('/vessels', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const vessels = await vesselService.getVessels(orgId);
        res.json({ success: true, data: vessels });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/vessels', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const vessel = await vesselService.createVessel(orgId, req.body);
        res.status(201).json({ success: true, data: vessel });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Employee routes
router.get('/employees', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const employees = await employeeService.getEmployees(orgId, req.query);
        res.json({ success: true, data: employees });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/employees/onboarding-review', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const filters = {};
        if (req.query.status && req.query.status !== 'all') {
            filters.status = req.query.status;
        }
        const { logger } = await import('../config/logger');
        logger.info(`Fetching employees with onboarding status for orgId: ${orgId}, filters: ${JSON.stringify(filters)}`);
        const employees = await employeeService.getEmployeesWithOnboardingStatus(orgId, filters);
        logger.info(`Successfully fetched ${employees.length} employees with onboarding status`);
        res.json({ success: true, data: employees });
    }
    catch (error) {
        const { logger } = await import('../config/logger');
        logger.error('Error in /employees/onboarding-review:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch employees with onboarding status'
        });
    }
});
router.post('/employees', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const employee = await employeeService.createEmployee(orgId, req.body);
        res.status(201).json({ success: true, data: employee });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/employees/invite', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const result = await employeeService.inviteEmployee(orgId, req.body);
        res.status(201).json({
            success: true,
            data: {
                employee: result.employee,
                emailSent: result.emailSent,
                invitationLink: result.invitationLink,
            },
            message: result.emailSent
                ? 'Employee invited successfully! Onboarding email sent with invitation link.'
                : 'Employee created successfully, but email could not be sent.',
        });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.get('/employees/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const employee = await employeeService.getEmployeeById(req.params.id, orgId);
        res.json({ success: true, data: employee });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
router.put('/employees/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const employee = await employeeService.updateEmployee(req.params.id, orgId, req.body);
        res.json({ success: true, data: employee });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Employee Onboarding Review Routes (must come before /employees/:id to avoid route conflicts)
router.get('/employees/onboardings', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const filters = {};
        if (req.query.status) {
            filters.status = req.query.status;
        }
        const onboardings = await employeeService.getEmployeeOnboardings(orgId, filters);
        res.json({ success: true, data: onboardings });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/employees/onboardings/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const onboarding = await employeeService.getEmployeeOnboardingById(req.params.id, orgId);
        res.json({ success: true, data: onboarding });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
router.post('/employees/onboardings/:id/approve', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId || req.user?._id;
        const onboardingId = req.params.id;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found. Please ensure you are authenticated.',
            });
        }
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID not found. Please ensure you are authenticated.',
            });
        }
        if (!onboardingId) {
            return res.status(400).json({
                success: false,
                error: 'Onboarding ID is required',
            });
        }
        const { remarks } = req.body;
        const result = await employeeService.approveEmployeeOnboarding(onboardingId, orgId, userId, remarks);
        res.json({ success: true, data: result, message: result.message });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message || 'Failed to approve onboarding' });
    }
});
router.post('/employees/onboardings/:id/reject', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const userId = req.user?.userId || req.user?._id;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID not found',
            });
        }
        const { rejectionReason } = req.body;
        const result = await employeeService.rejectEmployeeOnboarding(req.params.id, orgId, userId, rejectionReason);
        res.json({ success: true, data: result, message: result.message });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.delete('/employees/onboardings/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const result = await employeeService.deleteEmployeeOnboarding(req.params.id, orgId);
        res.json({ success: true, data: result, message: result.message });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Employee routes (must come after onboarding routes to avoid conflicts)
router.delete('/employees/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        await employeeService.deleteEmployee(req.params.id, orgId);
        res.json({ success: true, message: 'Employee deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Business Unit routes
router.get('/business-units', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const units = await businessUnitService.getBusinessUnits(orgId, req.query);
        res.json({ success: true, data: units });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/business-units', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const unit = await businessUnitService.createBusinessUnit(orgId, req.body);
        res.status(201).json({ success: true, data: unit });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Get single business unit
router.get('/business-units/:id', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const unit = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        res.json({ success: true, data: unit });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
// Get vessels assigned to a business unit
router.get('/business-units/:id/vessels', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const { Vessel } = await import('../models/vessel.model');
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        const vessels = await Vessel.find({
            organizationId: orgId,
            businessUnitId: req.params.id,
        });
        res.json({ success: true, data: vessels });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Assign vessel to business unit
router.post('/business-units/:id/vessels/:vesselId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const { Vessel } = await import('../models/vessel.model');
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        // Verify vessel belongs to organization
        const vessel = await Vessel.findOne({
            _id: req.params.vesselId,
            organizationId: orgId,
        });
        if (!vessel) {
            return res.status(404).json({ success: false, error: 'Vessel not found' });
        }
        // Check if vessel is already assigned to another BU
        if (vessel.businessUnitId && vessel.businessUnitId.toString() !== req.params.id) {
            return res.status(400).json({
                success: false,
                error: 'Vessel is already assigned to another business unit',
            });
        }
        vessel.businessUnitId = req.params.id;
        await vessel.save();
        res.json({ success: true, data: vessel });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Unassign vessel from business unit
router.delete('/business-units/:id/vessels/:vesselId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const { Vessel } = await import('../models/vessel.model');
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        // Verify vessel belongs to organization and is assigned to this BU
        const vessel = await Vessel.findOne({
            _id: req.params.vesselId,
            organizationId: orgId,
            businessUnitId: req.params.id,
        });
        if (!vessel) {
            return res.status(404).json({ success: false, error: 'Vessel not found or not assigned to this BU' });
        }
        vessel.businessUnitId = undefined;
        await vessel.save();
        res.json({ success: true, message: 'Vessel unassigned successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get staff assigned to a business unit
router.get('/business-units/:id/staff', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        const employees = await employeeService.getEmployees(orgId, { businessUnitId: req.params.id });
        res.json({ success: true, data: employees });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Assign staff to business unit (create employee from user)
router.post('/business-units/:id/staff', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId is required' });
        }
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        // Get user details
        const { userService } = await import('../services/user.service');
        const { PortalType } = await import('../../../../packages/shared/src/types/index');
        const users = await userService.getUsers(PortalType.CUSTOMER, orgId);
        const user = users.find((u) => u._id.toString() === userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Check if employee already exists for this user and BU
        const { Employee } = await import('../models/employee.model');
        const existingEmployeeInThisBU = await Employee.findOne({
            organizationId: orgId,
            businessUnitId: req.params.id,
            email: user.email,
        });
        if (existingEmployeeInThisBU) {
            return res.status(400).json({
                success: false,
                error: 'Staff member is already assigned to this business unit',
            });
        }
        // Check if employee exists in another BU - if so, update it instead of creating duplicate
        const existingEmployeeInOtherBU = await Employee.findOne({
            organizationId: orgId,
            email: user.email,
            businessUnitId: { $ne: req.params.id },
        });
        if (existingEmployeeInOtherBU) {
            // Update existing employee to assign to this BU
            existingEmployeeInOtherBU.businessUnitId = req.params.id;
            await existingEmployeeInOtherBU.save();
            return res.status(200).json({ success: true, data: existingEmployeeInOtherBU });
        }
        // Create employee record
        const employee = await employeeService.createEmployee(orgId, {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            businessUnitId: req.params.id,
        });
        res.status(201).json({ success: true, data: employee });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Unassign staff from business unit
router.delete('/business-units/:id/staff/:employeeId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        // Verify BU belongs to organization
        const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
        if (!bu) {
            return res.status(404).json({ success: false, error: 'Business unit not found' });
        }
        // Verify employee belongs to organization and is assigned to this BU
        const employee = await employeeService.getEmployeeById(req.params.employeeId, orgId);
        if (!employee || employee.businessUnitId?.toString() !== req.params.id) {
            return res.status(404).json({ success: false, error: 'Employee not found or not assigned to this BU' });
        }
        // Remove business unit assignment
        await employeeService.updateEmployee(req.params.employeeId, orgId, { businessUnitId: undefined });
        res.json({ success: true, message: 'Staff unassigned successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// License routes - Get licenses for user's organization
// Get license pricing for organization
router.get('/license/pricing', async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        const { User } = await import('../models/user.model');
        const user = await User.findById(userId);
        if (!user || !user.organizationId) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found',
            });
        }
        const licenses = await licenseService.getLicenses(user.organizationId.toString());
        const activeLicense = licenses.find((l) => l.status === 'active' && new Date(l.expiresAt) > new Date());
        if (!activeLicense || !activeLicense.pricing) {
            return res.status(404).json({
                success: false,
                error: 'No active license with pricing found',
            });
        }
        res.status(200).json({
            success: true,
            data: {
                monthlyPrice: activeLicense.pricing.monthlyPrice,
                yearlyPrice: activeLicense.pricing.yearlyPrice,
                currency: activeLicense.pricing.currency,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get license pricing',
        });
    }
});
router.get('/licenses', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const licenses = await licenseService.getLicenses(orgId);
        res.json({ success: true, data: licenses });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Vendor invitation routes (customers can invite vendors)
router.get('/vendors', async (req, res) => {
    try {
        const { organizationService } = await import('../services/organization.service');
        const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index');
        const requester = req.user;
        const filters = {
            requesterPortalType: PortalType.CUSTOMER,
        };
        if (requester?.organizationId) {
            filters.customerOrganizationId = requester.organizationId;
        }
        const vendors = await organizationService.getOrganizations(OrganizationType.VENDOR, PortalType.VENDOR, filters);
        res.status(200).json({
            success: true,
            data: vendors,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get vendors',
        });
    }
});
router.post('/vendors/invite', async (req, res) => {
    try {
        const { organizationController } = await import('../controllers/organization.controller');
        const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index');
        // Ensure it's a vendor organization
        req.body.type = OrganizationType.VENDOR;
        req.body.portalType = PortalType.VENDOR;
        // Call the organization controller to create/invite vendor
        await organizationController.createOrganization(req, res);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to invite vendor',
        });
    }
});
// Get vendor users from organizations invited by this customer
router.get('/vendors/users', async (req, res) => {
    try {
        console.log('📥 /vendors/users endpoint called');
        logger.info('📥 /vendors/users endpoint called');
        const requester = req.user;
        console.log('Requester:', { hasRequester: !!requester, organizationId: requester?.organizationId });
        if (!requester?.organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Customer organization ID is required',
            });
        }
        const { userService } = await import('../services/user.service');
        const { organizationService } = await import('../services/organization.service');
        const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index');
        const { Organization } = await import('../models/organization.model');
        console.log('✅ Imports successful');
        logger.info('✅ Imports successful, requester:', {
            hasRequester: !!requester,
            organizationId: requester?.organizationId
        });
        // Get vendor organizations invited by this customer
        logger.info('🔍 Fetching vendor organizations...');
        const vendorOrgs = await organizationService.getOrganizations(OrganizationType.VENDOR, PortalType.VENDOR, {
            customerOrganizationId: requester.organizationId,
            requesterPortalType: PortalType.CUSTOMER,
        });
        logger.info(`✅ Found ${vendorOrgs.length} vendor organizations`);
        // Get all vendor user IDs from these organizations
        const vendorOrgIds = vendorOrgs.map((org) => org._id?.toString()).filter(Boolean);
        // Get vendor users from these organizations
        const filters = {};
        if (req.query.isActive !== undefined) {
            filters.isActive = req.query.isActive === 'true';
        }
        logger.info('🔍 Fetching vendor users...');
        // Query User directly since we need to filter by multiple organization IDs
        // userService.getUsers requires a single organizationId, so we query directly
        const { User } = await import('../models/user.model');
        const userQuery = {
            portalType: PortalType.VENDOR,
        };
        // Only add organizationId filter if we have vendor organizations
        if (vendorOrgIds.length > 0) {
            userQuery.organizationId = { $in: vendorOrgIds.map((id) => new mongoose.Types.ObjectId(id)) };
        }
        else {
            // If no vendor organizations exist yet, return empty array (pending invitations will be added below)
            userQuery.organizationId = { $in: [] }; // This will return no results
        }
        if (filters.isActive !== undefined) {
            userQuery.isActive = filters.isActive;
        }
        const vendorUsers = await User.find(userQuery).select('-password').lean();
        logger.info(`✅ Found ${vendorUsers.length} vendor users from invited organizations`);
        // Also get pending customer-vendor invitations (vendors invited but not yet in system)
        const customerOrgId = new mongoose.Types.ObjectId(requester.organizationId);
        let pendingInvitations = [];
        try {
            const { CustomerVendorInvitation } = await import('../models/customer-vendor-invitation.model');
            pendingInvitations = await CustomerVendorInvitation.find({
                customerOrganizationId: customerOrgId,
                status: 'pending',
            }).lean();
        }
        catch (invitationError) {
            logger.error('Error fetching pending invitations:', {
                error: invitationError.message,
                stack: invitationError.stack,
                customerOrgId: requester.organizationId,
            });
            // Continue without pending invitations rather than failing completely
        }
        // Create vendor entries for pending invitations (even if user doesn't exist yet)
        const pendingVendorEntries = pendingInvitations
            .filter((invitation) => invitation && invitation._id && invitation.vendorEmail)
            .map((invitation) => ({
            _id: invitation._id.toString(),
            email: invitation.vendorEmail,
            firstName: invitation.vendorFirstName || '',
            lastName: invitation.vendorLastName || '',
            fullName: `${invitation.vendorFirstName || ''} ${invitation.vendorLastName || ''}`.trim() || invitation.vendorName || 'N/A',
            phone: null,
            organizationId: invitation.vendorOrganizationId?.toString() || null,
            organizationName: invitation.vendorName || 'N/A',
            role: null,
            isActive: false,
            onboardingStatus: null,
            invitationStatus: 'pending',
            lastLogin: null,
            createdAt: invitation.createdAt || new Date(),
        }));
        // Combine vendor users and pending invitations
        const allVendors = [...vendorUsers, ...pendingVendorEntries];
        // Get organization names, onboarding status, and invitation status for each vendor user
        logger.info(`🔍 Processing ${allVendors.length} vendors with org info...`);
        let vendorsWithOrgInfo = [];
        try {
            const { VendorOnboarding } = await import('../models/vendor-onboarding.model');
            vendorsWithOrgInfo = await Promise.all(allVendors.map(async (user) => {
                try {
                    let organizationName = user.organizationName || null;
                    let onboardingStatus = user.onboardingStatus || 'pending'; // Default to pending if no onboarding found
                    let invitationStatus = user.invitationStatus || null; // Customer-vendor invitation status
                    if (user.organizationId) {
                        try {
                            // Convert to ObjectId if it's a string
                            const orgId = typeof user.organizationId === 'string'
                                ? new mongoose.Types.ObjectId(user.organizationId)
                                : user.organizationId;
                            const org = await Organization.findById(orgId);
                            organizationName = org?.name || organizationName;
                            // Check onboarding status for this vendor organization
                            const onboarding = await VendorOnboarding.findOne({
                                organizationId: orgId
                            }).sort({ createdAt: -1 }); // Get the most recent onboarding
                            if (onboarding) {
                                onboardingStatus = onboarding.status; // 'pending', 'completed', 'approved', 'rejected'
                            }
                        }
                        catch (orgError) {
                            // Log but don't fail - continue with other vendors
                            logger.warn(`Error fetching org info for ${user.organizationId}:`, orgError.message);
                        }
                    }
                    // Check customer-vendor invitation status (if not already set from pending invitations)
                    if (!invitationStatus && user.email) {
                        try {
                            const { CustomerVendorInvitation } = await import('../models/customer-vendor-invitation.model');
                            const customerOrgIdForCheck = new mongoose.Types.ObjectId(requester.organizationId);
                            const invitation = await CustomerVendorInvitation.findOne({
                                customerOrganizationId: customerOrgIdForCheck,
                                vendorEmail: user.email.toLowerCase().trim(),
                            }).sort({ createdAt: -1 }).lean();
                            if (invitation) {
                                invitationStatus = invitation.status; // 'pending', 'accepted', 'declined'
                            }
                        }
                        catch (invCheckError) {
                            // Log but don't fail - continue without invitation status
                            logger.warn(`Error checking invitation status for ${user.email}:`, invCheckError.message);
                        }
                    }
                    return {
                        _id: user._id || 'unknown',
                        email: user.email || 'unknown@example.com',
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
                        phone: user.phone || null,
                        organizationId: user.organizationId || null,
                        organizationName: organizationName || 'N/A',
                        role: user.role || null,
                        isActive: user.isActive || false,
                        onboardingStatus, // Add onboarding status
                        invitationStatus, // Add invitation status
                        lastLogin: user.lastLogin || null,
                        createdAt: user.createdAt || new Date(),
                    };
                }
                catch (userError) {
                    logger.error(`Error processing vendor user ${user._id}:`, userError.message);
                    // Return a minimal user object to prevent complete failure
                    return {
                        _id: user._id || 'unknown',
                        email: user.email || 'unknown@example.com',
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
                        phone: user.phone || null,
                        organizationId: user.organizationId || null,
                        organizationName: user.organizationName || 'N/A',
                        role: user.role || null,
                        isActive: user.isActive || false,
                        onboardingStatus: 'pending',
                        invitationStatus: user.invitationStatus || null,
                        lastLogin: user.lastLogin || null,
                        createdAt: user.createdAt || new Date(),
                    };
                }
            }));
            logger.info(`✅ Successfully processed ${vendorsWithOrgInfo.length} vendors`);
        }
        catch (processError) {
            logger.error('Error processing vendors with org info:', {
                error: processError.message,
                stack: processError.stack,
            });
            // Fallback: return vendors without additional processing
            vendorsWithOrgInfo = allVendors.map((user) => ({
                _id: user._id || 'unknown',
                email: user.email || 'unknown@example.com',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
                phone: user.phone || null,
                organizationId: user.organizationId || null,
                organizationName: user.organizationName || 'N/A',
                role: user.role || null,
                isActive: user.isActive || false,
                onboardingStatus: user.onboardingStatus || 'pending',
                invitationStatus: user.invitationStatus || null,
                lastLogin: user.lastLogin || null,
                createdAt: user.createdAt || new Date(),
            }));
        }
        logger.info(`📤 Returning ${vendorsWithOrgInfo.length} vendors to client`);
        res.status(200).json({
            success: true,
            data: vendorsWithOrgInfo,
        });
    }
    catch (error) {
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            requesterOrgId: req.user?.organizationId,
        };
        logger.error('❌ Error in /vendors/users endpoint:', errorDetails);
        console.error('Full error object:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get vendor users',
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        });
    }
});
// Brands routes - Get active brands and create new ones (pending approval)
router.get('/brands', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required',
            });
        }
        // Get active brands (global + organization-specific)
        // Skip populate for faster loading (customer portal only needs name/ID)
        const brands = await brandService.getBrands({
            status: 'active',
            organizationId: orgId,
            includeGlobal: true,
            skipPopulate: true,
        });
        res.status(200).json({
            success: true,
            data: brands,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get brands',
        });
    }
});
router.post('/brands', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const brand = await brandService.createBrand({
            name: req.body.name,
            description: req.body.description,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Customer-created brands are organization-specific
            status: 'pending', // Need admin approval
        });
        res.status(201).json({
            success: true,
            data: brand,
            message: 'Brand created successfully. It will appear after admin approval.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create brand',
        });
    }
});
// Categories routes - Get active categories and create new ones (pending approval)
router.get('/categories', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        // Get active categories (global + organization-specific)
        // Skip populate for faster loading (customer portal only needs name/ID)
        const categories = await categoryService.getCategories({
            status: 'active',
            organizationId: orgId,
            includeGlobal: true,
            skipPopulate: true,
        });
        res.status(200).json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get categories',
        });
    }
});
router.post('/categories', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const category = await categoryService.createCategory({
            name: req.body.name,
            description: req.body.description,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Customer-created categories are organization-specific
            status: 'pending', // Need admin approval
        });
        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully. It will appear after admin approval.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create category',
        });
    }
});
// Models routes - Get active models and create new ones (pending approval)
router.get('/models', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const brandId = req.query.brandId;
        // Get active models (global + organization-specific)
        // Skip populate for faster loading (customer portal only needs name/ID)
        const models = await modelService.getModels({
            status: 'active',
            organizationId: orgId,
            brandId: brandId,
            includeGlobal: true,
            skipPopulate: true,
        });
        res.status(200).json({
            success: true,
            data: models,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get models',
        });
    }
});
router.post('/models', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const model = await modelService.createModel({
            name: req.body.name,
            description: req.body.description,
            brandId: req.body.brandId,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Customer-created models are organization-specific
            status: 'pending', // Need admin approval
        });
        res.status(201).json({
            success: true,
            data: model,
            message: 'Model created successfully. It will appear after admin approval.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create model',
        });
    }
});
// Role Payroll Structure routes
router.get('/role-payroll-structures', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const structures = await rolePayrollStructureService.getPayrollStructures(orgId);
        res.json({ success: true, data: structures });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/role-payroll-structures/:roleId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const structure = await rolePayrollStructureService.getPayrollStructureByRole(orgId, req.params.roleId);
        res.json({ success: true, data: structure });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
router.post('/role-payroll-structures', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const { roleId, payrollStructure } = req.body;
        if (!roleId) {
            return res.status(400).json({ success: false, error: 'Role ID is required' });
        }
        const structure = await rolePayrollStructureService.createOrUpdatePayrollStructure(orgId, roleId, payrollStructure);
        res.status(201).json({ success: true, data: structure });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/role-payroll-structures/:roleId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const { payrollStructure } = req.body;
        const structure = await rolePayrollStructureService.createOrUpdatePayrollStructure(orgId, req.params.roleId, payrollStructure);
        res.json({ success: true, data: structure });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.delete('/role-payroll-structures/:roleId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        await rolePayrollStructureService.deletePayrollStructure(orgId, req.params.roleId);
        res.json({ success: true, message: 'Payroll structure deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.patch('/role-payroll-structures/:roleId/toggle-status', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({ success: false, error: 'Organization ID is required' });
        }
        const { isActive } = req.body;
        const structure = await rolePayrollStructureService.togglePayrollStructureStatus(orgId, req.params.roleId, isActive);
        res.json({ success: true, data: structure });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
export default router;
//# sourceMappingURL=customer-portal.routes.js.map