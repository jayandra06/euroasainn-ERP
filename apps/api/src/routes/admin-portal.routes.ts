import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePortal } from "../middleware/portal.middleware";
import { userController } from "../controllers/user.controller";
import { organizationController } from "../controllers/organization.controller";
import { onboardingController } from "../controllers/onboarding.controller";
import { licenseController } from "../controllers/license.controller";
import { adminPortalController } from "../controllers/admin-portal.controller";
import { casbinMiddleware } from "../middleware/casbin.middleware";
import { PortalType } from "../../../../packages/shared/src/types/index";

import multer from "multer"; // ← ADD THIS

// Multer configuration for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV, Excel (.xlsx/.xls), or JSON allowed."));
    }
  },
});

const router = Router();

// Secure TECH portal
router.use(authMiddleware);
router.use(requirePortal(PortalType.ADMIN));
// router.use(casbinMiddleware);

/* ===========================
   USER ROUTES (TECH USERS)
=========================== */
router.get("/users", userController.getUsers.bind(userController));
router.post("/users", userController.createUser.bind(userController));
router.post("/users/invite", userController.inviteUser.bind(userController));
router.get("/users/:id", userController.getUserById.bind(userController));
router.put("/users/:id", userController.updateUser.bind(userController));
router.patch("/users/:id", userController.updateUser.bind(userController));
router.delete("/users/:id", userController.deleteUser.bind(userController));

// BULK UPLOAD ROUTE WITH MULTER
router.post(
  "/users/bulk-upload",
  upload.single("file"), // THIS IS REQUIRED
  userController.bulkUploadUsers.bind(userController)
);

/* ===========================
   ORGANIZATION ROUTES
=========================== */
router.get("/organizations", organizationController.getOrganizations.bind(organizationController));
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
   BRAND ROUTES
=========================== */
router.get("/brands", adminPortalController.getBrands.bind(adminPortalController));
router.post("/brands", adminPortalController.createBrand.bind(adminPortalController));
router.put("/brands/:id", adminPortalController.updateBrand.bind(adminPortalController));
router.post("/brands/:id/approve", adminPortalController.approveBrand.bind(adminPortalController));
router.post("/brands/:id/reject", adminPortalController.rejectBrand.bind(adminPortalController));
router.delete("/brands/:id", adminPortalController.deleteBrand.bind(adminPortalController));

/* ===========================
   CATEGORY ROUTES
=========================== */
router.get("/categories", adminPortalController.getCategories.bind(adminPortalController));
router.post("/categories", adminPortalController.createCategory.bind(adminPortalController));
router.put("/categories/:id", adminPortalController.updateCategory.bind(adminPortalController));
router.post("/categories/:id/approve", adminPortalController.approveCategory.bind(adminPortalController));
router.post("/categories/:id/reject", adminPortalController.rejectCategory.bind(adminPortalController));
router.delete("/categories/:id", adminPortalController.deleteCategory.bind(adminPortalController));

/* ===========================
   MODEL ROUTES
=========================== */
router.get("/models", adminPortalController.getModels.bind(adminPortalController));
router.post("/models", adminPortalController.createModel.bind(adminPortalController));
router.put("/models/:id", adminPortalController.updateModel.bind(adminPortalController));
router.post("/models/:id/approve", adminPortalController.approveModel.bind(adminPortalController));
router.post("/models/:id/reject", adminPortalController.rejectModel.bind(adminPortalController));
router.delete("/models/:id", adminPortalController.deleteModel.bind(adminPortalController));

/* ===========================
   PRODUCT HIERARCHY ROUTES
=========================== */
router.get("/product-hierarchy", adminPortalController.getHierarchy.bind(adminPortalController));
router.post("/product-hierarchy/subcategories", adminPortalController.createSubCategory.bind(adminPortalController));
router.put("/product-hierarchy/subcategories/:id", adminPortalController.updateSubCategory.bind(adminPortalController));
router.delete("/product-hierarchy/subcategories/:id", adminPortalController.deleteSubCategory.bind(adminPortalController));
router.post("/product-hierarchy/parts", adminPortalController.createPart.bind(adminPortalController));
router.put("/product-hierarchy/parts/:id", adminPortalController.updatePart.bind(adminPortalController));
router.delete("/product-hierarchy/parts/:id", adminPortalController.deletePart.bind(adminPortalController));

export default router;