import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePortal } from "../middleware/portal.middleware";
import { userController } from "../controllers/user.controller";
import { organizationController } from "../controllers/organization.controller";
import { onboardingController } from "../controllers/onboarding.controller";
import { licenseController } from "../controllers/license.controller";
import { casbinMiddleware } from "../middleware/casbin.middleware";
import { PortalType } from "../../../../packages/shared/src/types/index";
const router = Router();
// 🔐 Secure TECH portal
router.use(authMiddleware);
router.use(requirePortal(PortalType.TECH));
router.use(casbinMiddleware);
/* ===========================
   USER ROUTES (TECH USERS)
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
router.get("/organizations",organizationController.getOrganizations.bind(organizationController));
router.post("/organizations",organizationController.createOrganization.bind(organizationController));
router.post("/organizations/invite",organizationController.inviteOrganizationAdmin.bind(organizationController));
router.get("/organizations/:id",organizationController.getOrganizationById.bind(organizationController));
router.put("/organizations/:id",organizationController.updateOrganization.bind(organizationController));
router.delete("/organizations/:id",organizationController.deleteOrganization.bind(organizationController));
/* ===========================
   LICENSE ROUTES
=========================== */
router.get("/licenses",licenseController.getLicenses.bind(licenseController));
router.post("/licenses",licenseController.createLicense.bind(licenseController));
router.get("/licenses/:id",licenseController.getLicenseById.bind(licenseController));
router.put("/licenses/:id",licenseController.updateLicense.bind(licenseController));
router.delete("/licenses/:id",licenseController.deleteLicense.bind(licenseController));
/* ===========================
   ONBOARDING ROUTES
=========================== */
router.get("/customer-onboardings",onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get("/vendor-onboardings",onboardingController.getVendorOnboardings.bind(onboardingController));
router.get("/customer-onboardings/:id",onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get("/vendor-onboardings/:id",onboardingController.getVendorOnboardingById.bind(onboardingController));
router.post("/customer-onboardings/:id/approve",onboardingController.approveCustomerOnboarding.bind(onboardingController));
router.post("/customer-onboardings/:id/reject",onboardingController.rejectCustomerOnboarding.bind(onboardingController));
router.post("/vendor-onboardings/:id/approve",onboardingController.approveVendorOnboarding.bind(onboardingController));
router.post("/vendor-onboardings/:id/reject",onboardingController.rejectVendorOnboarding.bind(onboardingController));

export default router;
