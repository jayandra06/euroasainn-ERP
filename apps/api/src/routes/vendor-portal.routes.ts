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

// Optional: enable when ready
// router.use(validateLicense);
// router.use(casbinMiddleware);

// Skip payment check for payment/license/onboarding related routes
router.use((req, res, next) => {
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

export default router;