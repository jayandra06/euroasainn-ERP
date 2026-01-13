import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { casbinMiddleware } from '../middleware/casbin.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { userController } from '../controllers/user.controller';
import { customerPortalController } from '../controllers/customer-portal.controller';
import multer from 'multer';

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV or Excel (.xlsx/.xls) allowed.'));
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

const router = Router();

/* ======================================
   🔐 GLOBAL MIDDLEWARE FOR CUSTOMER PORTAL
====================================== */
// 1️⃣ Auth
router.use(authMiddleware);
// 2️⃣ Portal guard
router.use(requirePortal(PortalType.CUSTOMER));
// 3️⃣ License validation (DISABLED FOR NOW)
// router.use(validateLicense);
// 4️⃣ Casbin (GLOBAL for this router)
// router.use(casbinMiddleware);

// Payment routes should be accessible without active payment
// All other routes require active payment
// router.use((req, res, next) => {
//   // Allow access to payment-related routes without payment check
//   if (req.path.startsWith('/payment') || req.path === '/licenses') {
//     return next();
//   }
//   // Apply payment middleware to all other routes
//   return paymentStatusMiddleware(req as any, res, next);
// });

/* ===========================
   USER ROUTES
=========================== */
router.get('/users', async (req, res) => {
  try {
    const requester = (req as any).user;
    const organizationId = requester?.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
    }

    req.query.portalType = PortalType.CUSTOMER;
    req.query.organizationId = organizationId;
    await userController.getUsers(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users',
    });
  }
});

router.post('/users/invite', async (req, res) => {
  try {
    req.body.portalType = PortalType.CUSTOMER;
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

/* ===========================
   RFQ ROUTES
=========================== */
router.get('/rfq', customerPortalController.getRFQs.bind(customerPortalController));
router.post('/rfq', customerPortalController.createRFQ.bind(customerPortalController));
router.post('/rfq/bulk-upload', upload.single('file'), customerPortalController.bulkUploadRFQs.bind(customerPortalController));
router.get('/rfq/vendors', customerPortalController.getAvailableVendorsForRFQ.bind(customerPortalController));
router.get('/rfq/:id', customerPortalController.getRFQById.bind(customerPortalController));
router.put('/rfq/:id', customerPortalController.updateRFQ.bind(customerPortalController));
router.delete('/rfq/:id', customerPortalController.deleteRFQ.bind(customerPortalController));

/* ===========================
   VESSEL ROUTES
=========================== */
router.get('/vessels', customerPortalController.getVessels.bind(customerPortalController));
router.post('/vessels', customerPortalController.createVessel.bind(customerPortalController));

/* ===========================
   EMPLOYEE ROUTES
=========================== */
router.get('/employees', customerPortalController.getEmployees.bind(customerPortalController));
router.get('/employees/onboarding-review', customerPortalController.getEmployeesWithOnboardingStatus.bind(customerPortalController));
router.post('/employees', customerPortalController.createEmployee.bind(customerPortalController));
router.post('/employees/invite', customerPortalController.inviteEmployee.bind(customerPortalController));
router.get('/employees/:id', customerPortalController.getEmployeeById.bind(customerPortalController));
router.put('/employees/:id', customerPortalController.updateEmployee.bind(customerPortalController));
router.delete('/employees/:id', customerPortalController.deleteEmployee.bind(customerPortalController));

/* ===========================
   EMPLOYEE ONBOARDING ROUTES
=========================== */
router.get('/employees/onboardings', customerPortalController.getEmployeeOnboardings.bind(customerPortalController));
router.get('/employees/onboardings/:id', customerPortalController.getEmployeeOnboardingById.bind(customerPortalController));
router.post('/employees/onboardings/:id/approve', customerPortalController.approveEmployeeOnboarding.bind(customerPortalController));
router.post('/employees/onboardings/:id/reject', customerPortalController.rejectEmployeeOnboarding.bind(customerPortalController));
router.delete('/employees/onboardings/:id', customerPortalController.deleteEmployeeOnboarding.bind(customerPortalController));

/* ===========================
   BUSINESS UNIT ROUTES
=========================== */
router.get('/business-units', customerPortalController.getBusinessUnits.bind(customerPortalController));
router.post('/business-units', customerPortalController.createBusinessUnit.bind(customerPortalController));
router.get('/business-units/:id', customerPortalController.getBusinessUnitById.bind(customerPortalController));
router.get('/business-units/:id/vessels', customerPortalController.getBusinessUnitVessels.bind(customerPortalController));
router.post('/business-units/:id/vessels/:vesselId', customerPortalController.assignVesselToBusinessUnit.bind(customerPortalController));
router.delete('/business-units/:id/vessels/:vesselId', customerPortalController.unassignVesselFromBusinessUnit.bind(customerPortalController));
router.get('/business-units/:id/staff', customerPortalController.getBusinessUnitStaff.bind(customerPortalController));
router.post('/business-units/:id/staff', customerPortalController.assignStaffToBusinessUnit.bind(customerPortalController));
router.delete('/business-units/:id/staff/:employeeId', customerPortalController.unassignStaffFromBusinessUnit.bind(customerPortalController));

/* ===========================
   LICENSE ROUTES
=========================== */
router.get('/license/pricing', customerPortalController.getLicensePricing.bind(customerPortalController));
router.get('/licenses', customerPortalController.getLicenses.bind(customerPortalController));

/* ===========================
   VENDOR ROUTES
=========================== */
router.get('/vendors', customerPortalController.getVendors.bind(customerPortalController));
router.post('/vendors/invite', customerPortalController.inviteVendor.bind(customerPortalController));
router.get('/vendors/users', customerPortalController.getVendorUsers.bind(customerPortalController));

/* ===========================
   BRAND ROUTES
=========================== */
router.get('/brands', customerPortalController.getBrands.bind(customerPortalController));
router.post('/brands', customerPortalController.createBrand.bind(customerPortalController));

/* ===========================
   CATEGORY ROUTES
=========================== */
router.get('/categories', customerPortalController.getCategories.bind(customerPortalController));
router.post('/categories', customerPortalController.createCategory.bind(customerPortalController));

/* ===========================
   MODEL ROUTES
=========================== */
router.get('/models', customerPortalController.getModels.bind(customerPortalController));
router.post('/models', customerPortalController.createModel.bind(customerPortalController));

/* ===========================
   ROLE PAYROLL STRUCTURE ROUTES
=========================== */
router.get('/role-payroll-structures', customerPortalController.getRolePayrollStructures.bind(customerPortalController));
router.get('/role-payroll-structures/:roleId', customerPortalController.getRolePayrollStructureByRole.bind(customerPortalController));
router.post('/role-payroll-structures', customerPortalController.createOrUpdateRolePayrollStructure.bind(customerPortalController));
router.put('/role-payroll-structures/:roleId', customerPortalController.updateRolePayrollStructure.bind(customerPortalController));
router.delete('/role-payroll-structures/:roleId', customerPortalController.deleteRolePayrollStructure.bind(customerPortalController));
router.patch('/role-payroll-structures/:roleId/toggle-status', customerPortalController.toggleRolePayrollStructureStatus.bind(customerPortalController));

/* ===========================
   CUSTOMER PROFILE / ONBOARDING ROUTES
=========================== */
router.get('/onboarding/me', customerPortalController.getCurrentCustomerOnboarding.bind(customerPortalController));
router.patch('/onboarding/me', customerPortalController.updateCurrentCustomerOnboarding.bind(customerPortalController));

// Upload customer company logo
router.post('/onboarding/logo', imageUpload.single('logo'), customerPortalController.uploadLogo.bind(customerPortalController));

export default router;
