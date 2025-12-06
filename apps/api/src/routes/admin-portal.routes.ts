import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import { licenseService } from '../services/license.service';
import { License } from '../models/license.model';
import { Organization } from '../models/organization.model';
import { userService } from '../services/user.service';
import { casbinMiddleware } from "../middleware/casbin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.ADMIN));

/* ============================================================
   ADMIN USERS
============================================================ */

router.get(
  '/users',
  casbinMiddleware("admin_users", "view"),
  async (req, res) => {
    try {
      req.query.portalType = PortalType.ADMIN;
      await userController.getUsers(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post(
  '/users',
  casbinMiddleware("admin_users", "create"),
  async (req, res) => {
    try {
      req.body.portalType = PortalType.ADMIN;
      await userController.createUser(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post(
  '/users/invite',
  casbinMiddleware("admin_users", "create"),
  async (req, res) => {
    try {
      req.body.portalType = PortalType.ADMIN;
      await userController.inviteUser(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get(
  '/users/:id',
  casbinMiddleware("admin_users", "view"),
  userController.getUserById.bind(userController)
);

router.put(
  '/users/:id',
  casbinMiddleware("admin_users", "update"),
  userController.updateUser.bind(userController)
);

router.delete(
  '/users/:id',
  casbinMiddleware("admin_users", "disable"),
  userController.deleteUser.bind(userController)
);

/* ============================================================
   ORGANIZATIONS (ADMIN MANAGES CUSTOMER + VENDOR)
============================================================ */

router.get(
  '/organizations',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.getOrganizations.bind(organizationController)
);

router.post(
  '/organizations',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.createOrganization.bind(organizationController)
);

router.post(
  '/organizations/invite',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.inviteOrganizationAdmin.bind(organizationController)
);

router.get(
  '/organizations/:id',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.getOrganizationById.bind(organizationController)
);

router.put(
  '/organizations/:id',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.updateOrganization.bind(organizationController)
);

router.delete(
  '/organizations/:id',
  casbinMiddleware("customer_orgs", "manage"),
  organizationController.deleteOrganization.bind(organizationController)
);

/* Vendor Orgs */
router.get(
  '/vendor-orgs',
  casbinMiddleware("vendor_orgs", "manage"),
  organizationController.getOrganizations.bind(organizationController)
);

router.post(
  '/vendor-orgs',
  casbinMiddleware("vendor_orgs", "manage"),
  organizationController.createOrganization.bind(organizationController)
);

/* ============================================================
   LICENSES
============================================================ */

router.get(
  '/licenses',
  casbinMiddleware("licenses", "view"),
  async (req, res) => {
    try {
      const { organizationId, status, licenseType } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (licenseType) filters.licenseType = licenseType;

      const licenses = await licenseService.getLicenses(organizationId as string, filters);

      res.status(200).json({ success: true, data: licenses });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post(
  '/licenses',
  casbinMiddleware("licenses", "issue"),
  async (req, res) => {
    try {
      const { organizationId, expiresAt, usageLimits } = req.body;
      if (!organizationId || !expiresAt || !usageLimits) {
        return res.status(400).json({ success: false, error: 'Missing fields' });
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const license = await licenseService.createLicense({
        organizationId,
        organizationType: organization.type as OrganizationType,
        expiresAt: new Date(expiresAt),
        usageLimits
      });

      res.status(201).json({ success: true, data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

router.put(
  '/licenses/:id',
  casbinMiddleware("licenses", "revoke"),
  async (req, res) => {
    try {
      const { status, expiresAt, usageLimits } = req.body;
      const license = await License.findById(req.params.id);

      if (!license) {
        return res.status(404).json({ success: false, error: 'License not found' });
      }

      if (status) await licenseService.updateLicenseStatus(req.params.id, status as any);
      if (expiresAt) license.expiresAt = new Date(expiresAt);
      if (usageLimits) license.usageLimits = { ...license.usageLimits, ...usageLimits };

      await license.save();

      res.status(200).json({ success: true, data: license });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

router.delete(
  '/licenses/:id',
  casbinMiddleware("licenses", "revoke"),
  async (req, res) => {
    try {
      const license = await License.findById(req.params.id);
      if (!license) return res.status(404).json({ success: false, error: 'License not found' });

      await Organization.findByIdAndUpdate(license.organizationId, { $unset: { licenseKey: 1 } });
      await License.findByIdAndDelete(req.params.id);

      res.status(200).json({ success: true, message: 'License deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
