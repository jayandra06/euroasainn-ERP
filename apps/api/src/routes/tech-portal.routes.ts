import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';

import { userController } from '../controllers/user.controller';
import { organizationController } from '../controllers/organization.controller';
import { onboardingController } from '../controllers/onboarding.controller';
import { licenseController } from '../controllers/license.controller';

import { casbinMiddleware } from "../middleware/casbin.middleware";
import { PortalType } from '../../../../packages/shared/src/types/index.ts';

const router = Router();

// Secure TECH portal
router.use(authMiddleware);
router.use(requirePortal(PortalType.TECH));

/* ===========================
   USER ROUTES (TECH USERS)
=========================== */

// GET tech users
router.get(
  '/users',
  casbinMiddleware("tech_users", "view"),
  userController.getUsers.bind(userController)
);

// CREATE tech user
router.post(
  '/users',
  casbinMiddleware("tech_users", "create"),
  userController.createUser.bind(userController)
);

// INVITE user
router.post(
  '/users/invite',
  casbinMiddleware("tech_users", "create"),
  userController.inviteUser.bind(userController)
);

// GET single user
router.get(
  '/users/:id',
  casbinMiddleware("tech_users", "view"),
  userController.getUserById.bind(userController)
);

// UPDATE user
router.put(
  '/users/:id',
  casbinMiddleware("tech_users", "update"),
  userController.updateUser.bind(userController)
);

// DELETE user
router.delete(
  '/users/:id',
  casbinMiddleware("tech_users", "delete"),
  userController.deleteUser.bind(userController)
);

/* ===========================
   ORGANIZATION ROUTES
=========================== */

// VIEW ORGS
router.get(
  '/organizations',
  casbinMiddleware("organizations", "view"),
  organizationController.getOrganizations.bind(organizationController)
);

// CREATE ORG
router.post(
  '/organizations',
  // casbinMiddleware("organizations", "create"),
  organizationController.createOrganization.bind(organizationController)
);

// INVITE ORG ADMIN
router.post(
  '/organizations/invite',
  casbinMiddleware("organizations", "create"),
  organizationController.inviteOrganizationAdmin.bind(organizationController)
);

// VIEW SINGLE ORG
router.get(
  '/organizations/:id',
  casbinMiddleware("organizations", "view"),
  organizationController.getOrganizationById.bind(organizationController)
);

// UPDATE ORG
router.put(
  '/organizations/:id',
  casbinMiddleware("organizations", "update"),
  organizationController.updateOrganization.bind(organizationController)
);

// DELETE ORG
router.delete(
  '/organizations/:id',
  casbinMiddleware("organizations", "delete"),
  organizationController.deleteOrganization.bind(organizationController)
);

/* ===========================
   LICENSE ROUTES
=========================== */

router.get(
  '/licenses',
  casbinMiddleware("licenses", "view"),
  licenseController.getLicenses.bind(licenseController)
);

router.post(
  '/licenses',
  casbinMiddleware("licenses", "issue"),
  licenseController.createLicense.bind(licenseController)
);

router.get(
  "/licenses/:id",
  casbinMiddleware("licenses", "view"),
  licenseController.getLicenseById.bind(licenseController)
);

router.put(
  '/licenses/:id',
  casbinMiddleware("licenses", "revoke"),
  licenseController.updateLicense.bind(licenseController)
);

router.delete(
  '/licenses/:id',
  casbinMiddleware("licenses", "revoke"),
  licenseController.deleteLicense.bind(licenseController)
);

/* ===========================
   ONBOARDING ROUTES
=========================== */

router.get(
  '/customer-onboardings',
  casbinMiddleware("onboarding", "view"),
  onboardingController.getCustomerOnboardings.bind(onboardingController)
);

router.get(
  '/vendor-onboardings',
  casbinMiddleware("onboarding", "view"),
  onboardingController.getVendorOnboardings.bind(onboardingController)
);

router.get(
  '/customer-onboardings/:id',
  casbinMiddleware("onboarding", "view"),
  onboardingController.getCustomerOnboardingById.bind(onboardingController)
);

router.get(
  '/vendor-onboardings/:id',
  casbinMiddleware("onboarding", "view"),
  onboardingController.getVendorOnboardingById.bind(onboardingController)
);

router.post(
  '/customer-onboardings/:id/approve',
  casbinMiddleware("onboarding", "manage"),
  onboardingController.approveCustomerOnboarding.bind(onboardingController)
);

router.post(
  '/customer-onboardings/:id/reject',
  casbinMiddleware("onboarding", "manage"),
  onboardingController.rejectCustomerOnboarding.bind(onboardingController)
);

router.post(
  '/vendor-onboardings/:id/approve',
  casbinMiddleware("onboarding", "manage"),
  onboardingController.approveVendorOnboarding.bind(onboardingController)
);

router.post(
  '/vendor-onboardings/:id/reject',
  casbinMiddleware("onboarding", "manage"),
  onboardingController.rejectVendorOnboarding.bind(onboardingController)
);

export default router;
