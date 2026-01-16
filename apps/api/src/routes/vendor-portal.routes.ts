import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { casbinMiddleware } from '../middleware/casbin.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';

import { userController } from '../controllers/user.controller';
import { vendorPortalController } from '../controllers/vendor-portal.controller';
import { onboardingController } from '../controllers/onboarding.controller'; // Make sure this exists

const router = Router();

/* ======================================
   🔐 GLOBAL MIDDLEWARE FOR VENDOR PORTAL
====================================== */
router.use(authMiddleware);
router.use(requirePortal(PortalType.VENDOR));
<<<<<<< HEAD
=======

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
  return validateLicense(req as any, res, next);
});
>>>>>>> main

// Optional: enable when ready
// router.use(validateLicense);
// router.use(casbinMiddleware);

// Skip payment check for payment/license/onboarding related routes
router.use((req, res, next) => {
<<<<<<< HEAD
  if (
    req.path.startsWith('/payment') ||
    req.path.startsWith('/licenses') ||
    req.path.startsWith('/onboarding') ||
    req.path === '/license/pricing'
  ) {
    return next();
  }
  return paymentStatusMiddleware(req as any, res, next);
});

/* ===========================
   MULTER CONFIG FOR UPLOADS
=========================== */
=======
  // Allow access to payment-related routes, RFQ routes, quotation routes, banking details, and payment-proof routes without payment check
  const exemptPaths = ['/payment', '/licenses', '/rfq', '/quotation', '/banking-details', '/payment-proof'];
  const isExempt = exemptPaths.some(path => req.path === path || req.path.startsWith(`${path}/`));
  
  if (isExempt) {
    logger.debug(`[Vendor Portal] Exempting ${req.path} from payment validation`);
    return next();
  }
  // Apply payment middleware to all other routes
  logger.debug(`[Vendor Portal] Applying payment validation to ${req.path}`);
  return paymentStatusMiddleware(req as any, res, next);
});

router.post('/users/invite', async (req, res) => {
  try {
    req.body.portalType = PortalType.VENDOR;
    if (!(req as any).user?.organizationId && !req.body.organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }
    req.body.organizationId = req.body.organizationId || (req as any).user?.organizationId;
    await userController.inviteUser(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to invite user',
    });
  }
});

// Items routes
router.get('/items', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const items = await itemService.getItems(orgId, req.query);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const item = await itemService.createItem(orgId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Quotation routes
router.get('/quotation', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const quotations = await quotationService.getQuotations(orgId, req.query);
    res.json({ success: true, data: quotations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get quotation by RFQ ID for current vendor
router.get('/quotation/rfq/:rfqId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }
    const quotation = await quotationService.getQuotationByRFQIdForVendor(req.params.rfqId, orgId);
    res.json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quotation', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    
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
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Catalogue route (same as items)
router.get('/catalogue', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const items = await itemService.getItems(orgId, req.query);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload catalog file (CSV)
>>>>>>> main
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const extOk = ['.csv', '.xls', '.xlsx'].some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (allowed.includes(file.mimetype) || extOk) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, or XLSX files are allowed'));
    }
  },
});

// Multer config for image uploads (logos)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
    }
  },
});

/* ===========================
   VENDOR ONBOARDING / PROFILE ROUTES
=========================== */
// Get current logged-in vendor's onboarding/profile data
router.get('/onboarding/me', vendorPortalController.getCurrentVendorOnboarding.bind(vendorPortalController));

// Update current vendor's onboarding/profile (edit profile)
router.patch('/onboarding/me', vendorPortalController.updateCurrentVendorOnboarding.bind(vendorPortalController));

// Upload vendor company logo
router.post('/onboarding/logo', imageUpload.single('logo'), vendorPortalController.uploadLogo.bind(vendorPortalController));

// Optional: Get current onboarding status (approved/pending/rejected)
// router.get('/onboarding/status', vendorPortalController.getCurrentOnboardingStatus.bind(vendorPortalController));

/* ===========================
   USER ROUTES (VENDOR PORTAL USERS)
=========================== */
router.post('/users/invite', (req, res) => {
  req.body.portalType = PortalType.VENDOR;
  req.body.organizationId = req.body.organizationId || (req as any).user?.organizationId;

  if (!req.body.organizationId) {
    return res.status(400).json({
      success: false,
      error: 'organizationId is required',
    });
  }

  userController.inviteUser(req, res);
});

/* ===========================
   CATALOGUE ROUTES (Full CRUD + Bulk Upload)
=========================== */
// List / Search / Paginated catalog
router.get('/catalogue', vendorPortalController.getCatalogue.bind(vendorPortalController));

// Create single catalog item
router.post('/catalogue', vendorPortalController.createCatalogueItem.bind(vendorPortalController));

// Bulk upload (Excel/CSV)
router.post(
  '/catalogue/upload',
  upload.single('file'),
  vendorPortalController.uploadCatalog.bind(vendorPortalController)
);

// Update single catalog item
router.patch('/catalogue/:id', vendorPortalController.updateCatalogueItem.bind(vendorPortalController));

// Delete single catalog item
router.delete('/catalogue/:id', vendorPortalController.deleteCatalogueItem.bind(vendorPortalController));

/* ===========================
   ITEM / INVENTORY / QUOTATION / RFQ ROUTES
=========================== */
router.get('/items', vendorPortalController.getItems.bind(vendorPortalController));
router.post('/items', vendorPortalController.createItem.bind(vendorPortalController));

router.get('/quotations', vendorPortalController.getQuotations.bind(vendorPortalController));
router.post('/quotations', vendorPortalController.createQuotation.bind(vendorPortalController));

router.get('/inventory', vendorPortalController.getInventory.bind(vendorPortalController));

router.get('/rfqs', vendorPortalController.getRFQs.bind(vendorPortalController));
router.get('/rfqs/:id', vendorPortalController.getRFQById.bind(vendorPortalController));

/* ===========================
   BRAND / CATEGORY / MODEL ROUTES
=========================== */
router.get('/brands', vendorPortalController.getBrands.bind(vendorPortalController));
router.post('/brands', vendorPortalController.createBrand.bind(vendorPortalController));

router.get('/categories', vendorPortalController.getCategories.bind(vendorPortalController));
router.post('/categories', vendorPortalController.createCategory.bind(vendorPortalController));

router.get('/models', vendorPortalController.getModels.bind(vendorPortalController));
router.post('/models', vendorPortalController.createModel.bind(vendorPortalController));

/* ===========================
   LICENSE & PAYMENT ROUTES
=========================== */
router.get('/license/pricing', vendorPortalController.getLicensePricing.bind(vendorPortalController));
router.get('/licenses', vendorPortalController.getLicenses.bind(vendorPortalController));

<<<<<<< HEAD
/* ===========================
   EMPLOYEE ROUTES
=========================== */
router.get('/employees', vendorPortalController.getEmployees.bind(vendorPortalController));
router.get('/employees/onboarding-review', vendorPortalController.getEmployeesWithOnboardingStatus.bind(vendorPortalController));
router.post('/employees', vendorPortalController.createEmployee.bind(vendorPortalController));
router.post('/employees/invite', vendorPortalController.inviteEmployee.bind(vendorPortalController));
router.get('/employees/:id', vendorPortalController.getEmployeeById.bind(vendorPortalController));
router.put('/employees/:id', vendorPortalController.updateEmployee.bind(vendorPortalController));
router.delete('/employees/:id', vendorPortalController.deleteEmployee.bind(vendorPortalController));

/* ===========================
   EMPLOYEE ONBOARDING ROUTES
=========================== */
router.get('/employees/onboardings', vendorPortalController.getEmployeeOnboardings.bind(vendorPortalController));
router.get('/employees/onboardings/:id', vendorPortalController.getEmployeeOnboardingById.bind(vendorPortalController));
router.post('/employees/onboardings/:id/approve', vendorPortalController.approveEmployeeOnboarding.bind(vendorPortalController));
router.post('/employees/onboardings/:id/reject', vendorPortalController.rejectEmployeeOnboarding.bind(vendorPortalController));
router.delete('/employees/onboardings/:id', vendorPortalController.deleteEmployeeOnboarding.bind(vendorPortalController));
=======
// RFQ routes (vendor's RFQ inbox)
router.get('/rfq', async (req, res) => {
  try {
    const vendorOrgId = (req as any).user?.organizationId;
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
  } catch (error: any) {
    logger.error(`[Vendor RFQ Route] Error: ${error.message}`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rfq/:id', async (req, res) => {
  try {
    const vendorOrgId = (req as any).user?.organizationId;
    if (!vendorOrgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }
    const rfq = await rfqService.getRFQForVendorById(req.params.id, vendorOrgId);
    res.json({ success: true, data: rfq });
  } catch (error: any) {
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
    const orgId = (req as any).user?.organizationId;
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
    const bankingData: any = {
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
      const documents = (req.files as Express.Multer.File[]).map((file) => ({
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
    const bankingDetails = await bankingDetailsService.saveBankingDetails(
      quotationId,
      orgId,
      bankingData
    );

    // Get quotation and RFQ details for email
    const quotation = await Quotation.findById(quotationId)
      .populate('organizationId', 'name')
      .lean();
    const rfq = await RFQ.findById((quotation as any).rfqId)
      .populate('organizationId', 'name')
      .lean();

    if (quotation && rfq) {
      // Get customer admin users to send email
      const customerOrgId = (rfq as any).organizationId?._id || (rfq as any).organizationId;
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
            vendorOrganizationName: (quotation as any).organizationId?.name || 'Vendor',
            quotationNumber: (quotation as any).quotationNumber,
            rfqNumber: (rfq as any).rfqNumber || 'N/A',
            bankingDetails: bankingDetails as any,
            rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4300'}/rfqs/${(rfq as any)._id}`,
          });
          logger.info(`✅ Banking details email sent to ${customerUser.email}`);
        } catch (emailError: any) {
          logger.error(`❌ Failed to send banking details email: ${emailError.message}`);
        }
      }
    }

    res.json({
      success: true,
      data: bankingDetails,
      message: 'Banking details submitted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to save banking details',
    });
  }
});

router.get('/banking-details/quotation/:quotationId', async (req, res) => {
  try {
    const { bankingDetailsService } = await import('../services/banking-details.service');
    const bankingDetails = await bankingDetailsService.getBankingDetailsByQuotationId(
      req.params.quotationId
    );
    res.json({ success: true, data: bankingDetails });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Payment Proof Routes
router.get('/payment-proof/quotation/:quotationId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
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
    const quotationOrgId = (quotation as any).organizationId?._id || (quotation as any).organizationId;
    const isAdminOffer = (quotation as any).isAdminOffer === true;
    
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
      const ppQuotationId = (pp as any).quotationId?._id?.toString() || (pp as any).quotationId?.toString();
      logger.info(`  - Payment proof ID: ${(pp as any)._id}, quotationId: ${ppQuotationId}, status: ${(pp as any).status}`);
    }
    
    const paymentProof = await paymentProofService.getPaymentProofByQuotationId(req.params.quotationId);
    
    // Verify the payment proof belongs to this vendor
    if (paymentProof) {
      logger.info(`✅ Payment proof found: ${JSON.stringify({
        quotationId: paymentProof.quotationId,
        vendorOrgId: (paymentProof as any).vendorOrganizationId?._id || (paymentProof as any).vendorOrganizationId,
        status: (paymentProof as any).status,
        paymentAmount: (paymentProof as any).paymentAmount
      })}`);
      // Normalize vendorOrgId from payment proof (handle both populated and non-populated)
      const paymentProofVendorOrgId = (paymentProof as any).vendorOrganizationId?._id 
        ? (paymentProof as any).vendorOrganizationId._id.toString()
        : (paymentProof as any).vendorOrganizationId?.toString();
      
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
      } else {
        logger.info(`✅ Payment proof vendorOrgId matches: ${paymentProofVendorOrgId}`);
      }
    } else {
      logger.info(`⚠️ No payment proof found for quotation ${req.params.quotationId}, vendor orgId: ${orgId}`);
      // Return null data instead of 404 to allow frontend to handle gracefully
      return res.json({ success: true, data: null });
    }
    
    res.json({ success: true, data: paymentProof });
  } catch (error: any) {
    const { logger } = await import('../config/logger');
    logger.error(`Error fetching payment proof: ${error.message}`, error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// Submit vendor shipping details (for vendor-managed shipping)
router.post('/payment-proof/:quotationId/vendor-shipping', async (req, res) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;
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

    const paymentProof = await paymentProofService.submitVendorShippingDetails(
      req.params.quotationId,
      userId,
      {
        awbTrackingNumber,
        shippingContactName,
        shippingContactEmail,
        shippingContactPhone,
      }
    );

    // Get quotation and RFQ details for email
    const quotation = await Quotation.findById(req.params.quotationId)
      .populate('organizationId', 'name')
      .lean();
    const rfq = await RFQ.findById((paymentProof as any).rfqId)
      .populate('organizationId', 'name')
      .lean();

    if (quotation && rfq) {
      // Get customer admin users to send email
      const customerOrgId = (rfq as any).organizationId?._id || (rfq as any).organizationId;
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
            vendorOrganizationName: (quotation as any).organizationId?.name || 'Vendor',
            quotationNumber: (quotation as any).quotationNumber,
            rfqNumber: (rfq as any).rfqNumber || 'N/A',
            shippingDetails: {
              awbTrackingNumber,
              shippingContactName,
              shippingContactEmail,
              shippingContactPhone,
            },
            rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${(rfq as any)._id}`,
          });
          logger.info(`✅ Vendor shipping details email sent to ${customerUser.email}`);
        } catch (emailError: any) {
          logger.error(`❌ Failed to send vendor shipping details email: ${emailError.message}`);
        }
      }
    }

    res.json({
      success: true,
      data: paymentProof,
      message: 'Shipping details submitted successfully. Customer has been notified.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit shipping details',
    });
  }
});

// Submit vendor shipping details (for vendor-managed shipping)
router.post('/payment-proof/:quotationId/vendor-shipping', async (req, res) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;
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

    const paymentProof = await paymentProofService.submitVendorShippingDetails(
      req.params.quotationId,
      userId,
      {
        awbTrackingNumber,
        shippingContactName,
        shippingContactEmail,
        shippingContactPhone,
      }
    );

    // Get quotation and RFQ details for email
    const quotation = await Quotation.findById(req.params.quotationId)
      .populate('organizationId', 'name')
      .lean();
    const rfq = await RFQ.findById((paymentProof as any).rfqId)
      .populate('organizationId', 'name')
      .lean();

    if (quotation && rfq) {
      // Get customer admin users to send email
      const customerOrgId = (rfq as any).organizationId?._id || (rfq as any).organizationId;
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
            vendorOrganizationName: (quotation as any).organizationId?.name || 'Vendor',
            quotationNumber: (quotation as any).quotationNumber,
            rfqNumber: (rfq as any).rfqNumber || 'N/A',
            shippingDetails: {
              awbTrackingNumber,
              shippingContactName,
              shippingContactEmail,
              shippingContactPhone,
            },
            rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${(rfq as any)._id}`,
          });
          logger.info(`✅ Vendor shipping details email sent to ${customerUser.email}`);
        } catch (emailError: any) {
          logger.error(`❌ Failed to send vendor shipping details email: ${emailError.message}`);
        }
      }
    }

    res.json({
      success: true,
      data: paymentProof,
      message: 'Shipping details submitted successfully. Customer has been notified.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit shipping details',
    });
  }
});

// Approve payment and start packing
router.post('/payment-proof/:quotationId/approve', async (req, res) => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?._id;
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
    const rfq = await RFQ.findById((paymentProof as any).rfqId)
      .populate('organizationId', 'name')
      .lean();

    if (quotation && rfq) {
      // Get customer admin users to send email
      const customerOrgId = (rfq as any).organizationId?._id || (rfq as any).organizationId;
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
            vendorOrganizationName: (quotation as any).organizationId?.name || 'Vendor',
            quotationNumber: (quotation as any).quotationNumber,
            rfqNumber: (rfq as any).rfqNumber || 'N/A',
            rfqLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:4200'}/rfqs/${(rfq as any)._id}`,
          });
          logger.info(`✅ Payment approval email sent to ${customerUser.email}`);
        } catch (emailError: any) {
          logger.error(`❌ Failed to send payment approval email: ${emailError.message}`);
        }
      }
    }

    res.json({
      success: true,
      data: paymentProof,
      message: 'Payment approved successfully. Customer has been notified.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve payment',
    });
  }
});
>>>>>>> main

export default router;