import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { userController } from '../controllers/user.controller';
import { organizationController } from '../controllers/organization.controller';
import { onboardingController } from '../controllers/onboarding.controller';
import { licenseService } from '../services/license.service';
import { License } from '../models/license.model';
import { Organization } from '../models/organization.model';
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index.ts';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.TECH));

// Users routes
router.get('/users', userController.getUsers.bind(userController));
router.post('/users', userController.createUser.bind(userController));
router.post('/users/invite', userController.inviteUser.bind(userController));
router.get('/users/:id', userController.getUserById.bind(userController));
router.put('/users/:id', userController.updateUser.bind(userController));
router.delete('/users/:id', userController.deleteUser.bind(userController));

// Admin Users routes
router.get('/admin-users', async (req, res) => {
  try {
    const { userService } = await import('../services/user.service');
    const users = await userService.getUsers(PortalType.ADMIN);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get admin users',
    });
  }
});

router.post('/admin-users', async (req, res) => {
  try {
    req.body.portalType = PortalType.ADMIN;
    await userController.createUser(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create admin user',
    });
  }
});

// Organizations routes
router.get('/organizations', organizationController.getOrganizations.bind(organizationController));
router.post('/organizations', organizationController.createOrganization.bind(organizationController));
router.post('/organizations/invite', organizationController.inviteOrganizationAdmin.bind(organizationController));
router.get('/organizations/:id', organizationController.getOrganizationById.bind(organizationController));
router.put('/organizations/:id', organizationController.updateOrganization.bind(organizationController));
router.delete('/organizations/:id', organizationController.deleteOrganization.bind(organizationController));
router.get('/organizations/:id/invitations', organizationController.getOrganizationInvitations.bind(organizationController));
router.post('/organizations/:id/invitations/:invitationId/resend', organizationController.resendOrganizationInvitation.bind(organizationController));
router.post('/organizations/:id/invitations/:invitationId/revoke', organizationController.revokeOrganizationInvitation.bind(organizationController));

// Licenses routes
router.get('/licenses', async (req, res) => {
  try {
    const { organizationId, status, licenseType } = req.query;
    const filters: any = {};
    if (status) {
      filters.status = status;
    }
    if (licenseType) {
      filters.licenseType = licenseType;
    }
    const licenses = await licenseService.getLicenses(organizationId as string, filters);
    res.status(200).json({
      success: true,
      data: licenses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get licenses',
    });
  }
});

router.post('/licenses', async (req, res) => {
  try {
    const { organizationId, expiresAt, usageLimits, pricing } = req.body;

    if (!organizationId || !expiresAt || !usageLimits) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Determine organization type
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    const license = await licenseService.createLicense({
      organizationId,
      organizationType: organization.type as OrganizationType,
      expiresAt: new Date(expiresAt),
      usageLimits,
      pricing: pricing || {
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'INR',
      },
    });

    res.status(201).json({
      success: true,
      data: license,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create license',
    });
  }
});

router.get('/licenses/:id', async (req, res) => {
  try {
    const license = await License.findById(req.params.id).populate('organizationId');
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'License not found',
      });
    }
    res.status(200).json({
      success: true,
      data: license,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get license',
    });
  }
});

router.put('/licenses/:id', async (req, res) => {
  try {
    const { status, expiresAt, usageLimits } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'License not found',
      });
    }

    if (status) {
      await licenseService.updateLicenseStatus(req.params.id, status as any);
    }

    if (expiresAt) {
      license.expiresAt = new Date(expiresAt);
    }

    if (usageLimits) {
      license.usageLimits = { ...license.usageLimits, ...usageLimits };
    }

    await license.save();

    res.status(200).json({
      success: true,
      data: license,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update license',
    });
  }
});

router.delete('/licenses/:id', async (req, res) => {
  try {
    const license = await License.findById(req.params.id);
    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'License not found',
      });
    }

    await Organization.findByIdAndUpdate(license.organizationId, {
      $unset: { licenseKey: 1 },
    });

    await License.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'License deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete license',
    });
  }
});

// Onboarding data routes (shared with Admin Portal)
router.get('/customer-onboardings', onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get('/vendor-onboardings', onboardingController.getVendorOnboardings.bind(onboardingController));
router.get('/customer-onboardings/:id', onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get('/vendor-onboardings/:id', onboardingController.getVendorOnboardingById.bind(onboardingController));
router.post('/customer-onboardings/:id/approve', onboardingController.approveCustomerOnboarding.bind(onboardingController));
router.post('/customer-onboardings/:id/reject', onboardingController.rejectCustomerOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/approve', onboardingController.approveVendorOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/reject', onboardingController.rejectVendorOnboarding.bind(onboardingController));

export default router;
