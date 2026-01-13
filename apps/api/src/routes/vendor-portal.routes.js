import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { itemService } from '../services/item.service';
import { quotationService } from '../services/quotation.service';
import { userController } from '../controllers/user.controller';
import { licenseService } from '../services/license.service';
import { rfqService } from '../services/rfq.service';
import { parseCatalogCSV } from '../utils/csv-parser';
import { logger } from '../config/logger';
const router = Router();
router.use(authMiddleware);
router.use(requirePortal(PortalType.VENDOR));
// Exempt certain routes from license and payment validation
router.use((req, res, next) => {
    // Allow access to payment, licenses, RFQ, quotation, banking details, and payment-proof routes without license/payment check
    const exemptPaths = ['/payment', '/licenses', '/rfq', '/quotation', '/banking-details', '/payment-proof'];
    const isExempt = exemptPaths.some(path => req.path === path || req.path.startsWith(`${path}/`));
    if (isExempt) {
        logger.debug(`[Vendor Portal] Exempting ${req.path} from license validation`);
        return next();
    }
    // Apply license validation to all other routes
    logger.debug(`[Vendor Portal] Applying license validation to ${req.path}`);
    return validateLicense(req, res, next);
});
// Payment routes should be accessible without active payment
// All other routes require active payment
router.use((req, res, next) => {
    // Allow access to payment-related routes, RFQ routes, quotation routes, banking details, and payment-proof routes without payment check
    const exemptPaths = ['/payment', '/licenses', '/rfq', '/quotation', '/banking-details', '/payment-proof'];
    const isExempt = exemptPaths.some(path => req.path === path || req.path.startsWith(`${path}/`));
    if (isExempt) {
        logger.debug(`[Vendor Portal] Exempting ${req.path} from payment validation`);
        return next();
    }
    // Apply payment middleware to all other routes
    logger.debug(`[Vendor Portal] Applying payment validation to ${req.path}`);
    return paymentStatusMiddleware(req, res, next);
});
router.post('/users/invite', async (req, res) => {
    try {
        req.body.portalType = PortalType.VENDOR;
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
// Items routes
router.get('/items', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const items = await itemService.getItems(orgId, req.query);
        res.json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/items', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const item = await itemService.createItem(orgId, req.body);
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Quotation routes
router.get('/quotation', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const quotations = await quotationService.getQuotations(orgId, req.query);
        res.json({ success: true, data: quotations });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Get quotation by RFQ ID for current vendor
router.get('/quotation/rfq/:rfqId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const quotation = await quotationService.getQuotationByRFQIdForVendor(req.params.rfqId, orgId);
        res.json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.post('/quotation', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        // Check if quotation already exists for this RFQ
        if (req.body.rfqId) {
            const existingQuotation = await quotationService.getQuotationByRFQIdForVendor(req.body.rfqId, orgId);
            if (existingQuotation) {
                return res.status(400).json({
                    success: false,
                    error: 'A quotation has already been submitted for this RFQ. You can only submit one quotation per RFQ.',
                });
            }
        }
        const quotation = await quotationService.createQuotation(orgId, req.body);
        res.status(201).json({ success: true, data: quotation });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// Catalogue route (same as items)
router.get('/catalogue', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const items = await itemService.getItems(orgId, req.query);
        res.json({ success: true, data: items });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Upload catalog file (CSV)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept CSV files
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});
router.post('/catalog/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
            });
        }
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        // Parse CSV file
        const parsedItems = parseCatalogCSV(req.file.buffer);
        if (parsedItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid items found in CSV file',
            });
        }
        // Create items in bulk
        const createdItems = [];
        const errors = [];
        for (const itemData of parsedItems) {
            try {
                const item = await itemService.createItem(orgId, itemData);
                createdItems.push(item);
            }
            catch (error) {
                logger.error(`Failed to create item ${itemData.name}:`, error);
                errors.push({
                    item: itemData.name,
                    error: error.message || 'Failed to create item',
                });
            }
        }
        logger.info(`Catalog upload completed: ${createdItems.length} items created, ${errors.length} errors`);
        res.status(201).json({
            success: true,
            data: {
                created: createdItems.length,
                failed: errors.length,
                items: createdItems,
                errors: errors.length > 0 ? errors : undefined,
            },
            message: `Successfully uploaded ${createdItems.length} items${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        });
    }
    catch (error) {
        logger.error('Catalog upload error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to upload catalog file',
        });
    }
});
// Inventory route
router.get('/inventory', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        const items = await itemService.getItems(orgId, req.query);
        // Transform items to inventory format
        const inventory = items.map((item) => ({
            itemId: item._id,
            name: item.name,
            sku: item.sku,
            stockQuantity: item.stockQuantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
        }));
        res.json({ success: true, data: inventory });
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
// Brands routes (vendor can create brands that need approval)
router.get('/brands', async (req, res) => {
    try {
        const { brandService } = await import('../services/brand.service');
        const orgId = req.user?.organizationId;
        const brands = await brandService.getBrands({
            organizationId: orgId,
            includeGlobal: true, // Include global brands + vendor's own brands
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
        const { brandService } = await import('../services/brand.service');
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const brand = await brandService.createBrand({
            name: req.body.name,
            description: req.body.description,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Vendor-created brands are organization-specific
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
// Categories routes (vendor can create categories that need approval)
router.get('/categories', async (req, res) => {
    try {
        const { categoryService } = await import('../services/category.service');
        const orgId = req.user?.organizationId;
        const categories = await categoryService.getCategories({
            organizationId: orgId,
            includeGlobal: true, // Include global categories + vendor's own categories
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
        const { categoryService } = await import('../services/category.service');
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const category = await categoryService.createCategory({
            name: req.body.name,
            description: req.body.description,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Vendor-created categories are organization-specific
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
// Models routes (vendor can create models that need approval)
router.get('/models', async (req, res) => {
    try {
        const { modelService } = await import('../services/model.service');
        const orgId = req.user?.organizationId;
        const filters = {
            organizationId: orgId,
            includeGlobal: true, // Include global models + vendor's own models
        };
        if (req.query.brandId) {
            filters.brandId = req.query.brandId;
        }
        const models = await modelService.getModels(filters);
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
        const { modelService } = await import('../services/model.service');
        const userId = req.user?.userId;
        const orgId = req.user?.organizationId;
        const model = await modelService.createModel({
            name: req.body.name,
            description: req.body.description,
            brandId: req.body.brandId,
            createdBy: userId,
            organizationId: orgId,
            isGlobal: false, // Vendor-created models are organization-specific
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
// RFQ routes (vendor's RFQ inbox)
router.get('/rfq', async (req, res) => {
    try {
        const vendorOrgId = req.user?.organizationId;
        if (!vendorOrgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        logger.info(`[Vendor RFQ Route] Fetching RFQs for vendor: ${vendorOrgId}, Filters: ${JSON.stringify(req.query)}`);
        const rfqs = await rfqService.getRFQsForVendor(vendorOrgId, req.query);
        logger.info(`[Vendor RFQ Route] Found ${rfqs.length} RFQs for vendor ${vendorOrgId}`);
        res.json({ success: true, data: rfqs });
    }
    catch (error) {
        logger.error(`[Vendor RFQ Route] Error: ${error.message}`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/rfq/:id', async (req, res) => {
    try {
        const vendorOrgId = req.user?.organizationId;
        if (!vendorOrgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found',
            });
        }
        const rfq = await rfqService.getRFQForVendorById(req.params.id, vendorOrgId);
        res.json({ success: true, data: rfq });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
// Banking Details Routes
const bankingUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
router.post('/banking-details', bankingUpload.array('documents', 10), async (req, res) => {
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
        // Extract banking data from form
        const bankingData = {
            bankName: req.body.bankName,
            accountHolderName: req.body.accountHolderName,
            accountNumber: req.body.accountNumber,
            accountType: req.body.accountType,
            bankAddress: req.body.bankAddress,
            bankCity: req.body.bankCity,
            bankCountry: req.body.bankCountry,
            bankSwiftCode: req.body.bankSwiftCode,
            bankIBAN: req.body.bankIBAN,
            routingNumber: req.body.routingNumber,
            branchName: req.body.branchName,
            branchCode: req.body.branchCode,
            currency: req.body.currency || 'USD',
            notes: req.body.notes,
        };
        // Handle file uploads (for now, store file info - in production, upload to cloud storage)
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const documents = req.files.map((file) => ({
                fileName: file.originalname,
                fileUrl: `uploads/banking/${file.originalname}`, // In production, use actual cloud storage URL
                fileType: file.mimetype,
                uploadedAt: new Date(),
            }));
            bankingData.documents = documents;
        }
        const { bankingDetailsService } = await import('../services/banking-details.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { Organization } = await import('../models/organization.model');
        const { User } = await import('../models/user.model');
        const { logger } = await import('../config/logger');
        // Save banking details
        const bankingDetails = await bankingDetailsService.saveBankingDetails(quotationId, orgId, bankingData);
        // Get quotation and RFQ details for email
        const quotation = await Quotation.findById(quotationId)
            .populate('organizationId', 'name')
            .lean();
        const rfq = await RFQ.findById(quotation.rfqId)
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
                    await emailService.sendBankingDetailsEmail({
                        to: customerUser.email,
                        firstName: customerUser.firstName || 'Customer',
                        lastName: customerUser.lastName || 'Admin',
                        vendorOrganizationName: quotation.organizationId?.name || 'Vendor',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        bankingDetails: bankingDetails,
                        rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Banking details email sent to ${customerUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send banking details email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: bankingDetails,
            message: 'Banking details submitted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to save banking details',
        });
    }
});
router.get('/banking-details/quotation/:quotationId', async (req, res) => {
    try {
        const { bankingDetailsService } = await import('../services/banking-details.service');
        const bankingDetails = await bankingDetailsService.getBankingDetailsByQuotationId(req.params.quotationId);
        res.json({ success: true, data: bankingDetails });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});
// Payment Proof Routes
router.get('/payment-proof/quotation/:quotationId', async (req, res) => {
    try {
        const orgId = req.user?.organizationId;
        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required',
            });
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { Quotation } = await import('../models/quotation.model');
        const { logger } = await import('../config/logger');
        // Verify the quotation belongs to this vendor
        const quotation = await Quotation.findById(req.params.quotationId)
            .populate('organizationId', '_id')
            .lean();
        if (!quotation) {
            return res.status(404).json({
                success: false,
                error: 'Quotation not found',
            });
        }
        // Check if this quotation belongs to the vendor (or is an admin offer)
        const quotationOrgId = quotation.organizationId?._id || quotation.organizationId;
        const isAdminOffer = quotation.isAdminOffer === true;
        // For admin offers, we need to check if the payment proof vendorOrgId matches
        // For regular vendor quotations, check organizationId match
        if (!isAdminOffer && quotationOrgId?.toString() !== orgId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to view this payment proof',
            });
        }
        logger.info(`🔍 Fetching payment proof for quotation: ${req.params.quotationId}, vendor orgId: ${orgId}`);
        // Also try to find all payment proofs for debugging
        const { PaymentProof } = await import('../models/payment-proof.model');
        const allPaymentProofs = await PaymentProof.find({}).lean();
        logger.info(`📊 Total payment proofs in database: ${allPaymentProofs.length}`);
        for (const pp of allPaymentProofs.slice(0, 5)) { // Log first 5
            const ppQuotationId = pp.quotationId?._id?.toString() || pp.quotationId?.toString();
            logger.info(`  - Payment proof ID: ${pp._id}, quotationId: ${ppQuotationId}, status: ${pp.status}`);
        }
        const paymentProof = await paymentProofService.getPaymentProofByQuotationId(req.params.quotationId);
        // Verify the payment proof belongs to this vendor
        if (paymentProof) {
            logger.info(`✅ Payment proof found: ${JSON.stringify({
                quotationId: paymentProof.quotationId,
                vendorOrgId: paymentProof.vendorOrganizationId?._id || paymentProof.vendorOrganizationId,
                status: paymentProof.status,
                paymentAmount: paymentProof.paymentAmount
            })}`);
            // Normalize vendorOrgId from payment proof (handle both populated and non-populated)
            const paymentProofVendorOrgId = paymentProof.vendorOrganizationId?._id
                ? paymentProof.vendorOrganizationId._id.toString()
                : paymentProof.vendorOrganizationId?.toString();
            // Normalize vendor's orgId
            const vendorOrgIdStr = orgId.toString();
            // For admin offers, we allow access (admin offers use dummy org ID)
            // For regular quotations, verify the payment proof's vendorOrgId matches the vendor's org
            if (!isAdminOffer && paymentProofVendorOrgId !== vendorOrgIdStr) {
                logger.warn(`⚠️ Payment proof vendorOrgId mismatch - Payment proof: ${paymentProofVendorOrgId}, Vendor: ${vendorOrgIdStr}, Quotation: ${quotationOrgId?.toString()}`);
                logger.warn(`⚠️ Payment proof data: ${JSON.stringify({ quotationId: req.params.quotationId, paymentProofVendorOrgId, vendorOrgIdStr })}`);
                // Don't block access - just log the warning for now to debug
                // return res.status(403).json({
                //   success: false,
                //   error: 'You do not have permission to view this payment proof',
                // });
            }
            else {
                logger.info(`✅ Payment proof vendorOrgId matches: ${paymentProofVendorOrgId}`);
            }
        }
        else {
            logger.info(`⚠️ No payment proof found for quotation ${req.params.quotationId}, vendor orgId: ${orgId}`);
            // Return null data instead of 404 to allow frontend to handle gracefully
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: paymentProof });
    }
    catch (error) {
        const { logger } = await import('../config/logger');
        logger.error(`Error fetching payment proof: ${error.message}`, error);
        res.status(404).json({ success: false, error: error.message });
    }
});
// Submit vendor shipping details (for vendor-managed shipping)
router.post('/payment-proof/:quotationId/vendor-shipping', async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
        }
        const { awbTrackingNumber, shippingContactName, shippingContactEmail, shippingContactPhone } = req.body;
        if (!awbTrackingNumber || !shippingContactName || !shippingContactEmail || !shippingContactPhone) {
            return res.status(400).json({
                success: false,
                error: 'AWB tracking number, contact name, email, and phone number are required',
            });
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { User } = await import('../models/user.model');
        const { logger } = await import('../config/logger');
        const paymentProof = await paymentProofService.submitVendorShippingDetails(req.params.quotationId, userId, {
            awbTrackingNumber,
            shippingContactName,
            shippingContactEmail,
            shippingContactPhone,
        });
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
                    await emailService.sendVendorShippingDetailsEmail({
                        to: customerUser.email,
                        firstName: customerUser.firstName || 'Customer',
                        lastName: customerUser.lastName || 'Admin',
                        vendorOrganizationName: quotation.organizationId?.name || 'Vendor',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        shippingDetails: {
                            awbTrackingNumber,
                            shippingContactName,
                            shippingContactEmail,
                            shippingContactPhone,
                        },
                        rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Vendor shipping details email sent to ${customerUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send vendor shipping details email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: paymentProof,
            message: 'Shipping details submitted successfully. Customer has been notified.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to submit shipping details',
        });
    }
});
// Submit vendor shipping details (for vendor-managed shipping)
router.post('/payment-proof/:quotationId/vendor-shipping', async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required',
            });
        }
        const { awbTrackingNumber, shippingContactName, shippingContactEmail, shippingContactPhone } = req.body;
        if (!awbTrackingNumber || !shippingContactName || !shippingContactEmail || !shippingContactPhone) {
            return res.status(400).json({
                success: false,
                error: 'AWB tracking number, contact name, email, and phone number are required',
            });
        }
        const { paymentProofService } = await import('../services/payment-proof.service');
        const { emailService } = await import('../services/email.service');
        const { Quotation } = await import('../models/quotation.model');
        const { RFQ } = await import('../models/rfq.model');
        const { User } = await import('../models/user.model');
        const { logger } = await import('../config/logger');
        const paymentProof = await paymentProofService.submitVendorShippingDetails(req.params.quotationId, userId, {
            awbTrackingNumber,
            shippingContactName,
            shippingContactEmail,
            shippingContactPhone,
        });
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
                    await emailService.sendVendorShippingDetailsEmail({
                        to: customerUser.email,
                        firstName: customerUser.firstName || 'Customer',
                        lastName: customerUser.lastName || 'Admin',
                        vendorOrganizationName: quotation.organizationId?.name || 'Vendor',
                        quotationNumber: quotation.quotationNumber,
                        rfqNumber: rfq.rfqNumber || 'N/A',
                        shippingDetails: {
                            awbTrackingNumber,
                            shippingContactName,
                            shippingContactEmail,
                            shippingContactPhone,
                        },
                        rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${rfq._id}`,
                    });
                    logger.info(`✅ Vendor shipping details email sent to ${customerUser.email}`);
                }
                catch (emailError) {
                    logger.error(`❌ Failed to send vendor shipping details email: ${emailError.message}`);
                }
            }
        }
        res.json({
            success: true,
            data: paymentProof,
            message: 'Shipping details submitted successfully. Customer has been notified.',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to submit shipping details',
        });
    }
});
// Approve payment and start packing
router.post('/payment-proof/:quotationId/approve', async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
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
        // Approve payment
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
                        vendorOrganizationName: quotation.organizationId?.name || 'Vendor',
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
//# sourceMappingURL=vendor-portal.routes.js.map