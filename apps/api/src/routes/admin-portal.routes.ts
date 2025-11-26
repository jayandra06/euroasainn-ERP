import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { userController } from '../controllers/user.controller';
import { onboardingController } from '../controllers/onboarding.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import { licenseService } from '../services/license.service';
import { License } from '../models/license.model';
import { Organization } from '../models/organization.model';
import { userService } from '../services/user.service';
import { rfqService } from '../services/rfq.service';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.ADMIN));

// Users routes (admin portal users)
router.get('/users', async (req, res) => {
  try {
    // Set portalType to ADMIN for admin portal users
    req.query.portalType = PortalType.ADMIN;
    await userController.getUsers(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get users',
    });
  }
});

router.post('/users', async (req, res) => {
  try {
    // Ensure portalType is set to ADMIN
    req.body.portalType = PortalType.ADMIN;
    await userController.createUser(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});

router.post('/users/invite', async (req, res) => {
  try {
    req.body.portalType = PortalType.ADMIN;
    await userController.inviteUser(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to invite user',
    });
  }
});

router.get('/users/:id', userController.getUserById.bind(userController));
router.put('/users/:id', userController.updateUser.bind(userController));
router.delete('/users/:id', userController.deleteUser.bind(userController));

// Organizations (unified endpoint)
router.get('/organizations', organizationController.getOrganizations.bind(organizationController));
router.post('/organizations', organizationController.createOrganization.bind(organizationController));
router.post('/organizations/invite', organizationController.inviteOrganizationAdmin.bind(organizationController));
router.get('/organizations/:id', organizationController.getOrganizationById.bind(organizationController));
router.put('/organizations/:id', organizationController.updateOrganization.bind(organizationController));
router.delete('/organizations/:id', organizationController.deleteOrganization.bind(organizationController));
router.get('/organizations/:id/invitations', organizationController.getOrganizationInvitations.bind(organizationController));
router.post('/organizations/:id/invitations/:invitationId/resend', organizationController.resendOrganizationInvitation.bind(organizationController));
router.post('/organizations/:id/invitations/:invitationId/revoke', organizationController.revokeOrganizationInvitation.bind(organizationController));

// Legacy endpoints (for backward compatibility)
router.get('/customer-orgs', organizationController.getOrganizations.bind(organizationController));
router.post('/customer-orgs', organizationController.createOrganization.bind(organizationController));
router.get('/vendor-orgs', organizationController.getOrganizations.bind(organizationController));
router.post('/vendor-orgs', organizationController.createOrganization.bind(organizationController));

// Licenses routes
router.get('/licenses', async (req, res) => {
  try {
    const { organizationId, status, licenseType } = req.query;
    const { licenseService } = await import('../services/license.service');
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

// Get organizations with licenses and onboarding status
router.get('/organizations-with-licenses', async (req, res) => {
  try {
    const { organizationService } = await import('../services/organization.service');
    const { licenseService } = await import('../services/license.service');
    const { onboardingService } = await import('../services/onboarding.service');
    const { OrganizationType } = await import('@euroasiann/shared');
    const { logger } = await import('../config/logger');
    
    // Get all organizations (customer and vendor)
    const organizations = await organizationService.getOrganizations();
    
    // Get all licenses
    const licenses = await licenseService.getLicenses();
    
    // Get all customer and vendor onboardings
    const customerOnboardings = await onboardingService.getCustomerOnboardings();
    const vendorOnboardings = await onboardingService.getVendorOnboardings();
    
    // Create a map of organizationId -> onboarding status
    // Only mark as completed if onboarding is approved (license should only exist for approved onboardings)
    const onboardingMap = new Map<string, boolean>();
    customerOnboardings.forEach((onboarding: any) => {
      if (onboarding.organizationId && onboarding.status === 'approved') {
        const orgId = onboarding.organizationId.toString();
        onboardingMap.set(orgId, true);
      }
    });
    vendorOnboardings.forEach((onboarding: any) => {
      if (onboarding.organizationId && onboarding.status === 'approved') {
        const orgId = onboarding.organizationId.toString();
        onboardingMap.set(orgId, true);
      }
    });
    
    // Merge organizations with licenses and onboarding status
    // Note: Licenses are now created when onboarding is approved, not automatically on completion
    
    const orgsWithLicenses = organizations.map((org: any) => {
      const orgId = org._id.toString();
      const license = licenses.find((l: any) => l.organizationId?.toString() === orgId);
      const onboardingCompleted = onboardingMap.has(orgId);
      
      return {
        _id: orgId,
        name: org.name,
        type: org.type,
        portalType: org.portalType,
        isActive: org.isActive,
        license: license
          ? {
              status: license.status,
              expiresAt: license.expiresAt,
              issuedAt: license.issuedAt || license.createdAt,
              usageLimits: license.usageLimits,
              currentUsage: license.currentUsage,
            }
          : undefined,
        onboardingCompleted,
        createdAt: org.createdAt,
      };
    });
    
    res.status(200).json({
      success: true,
      data: orgsWithLicenses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get organizations with licenses',
    });
  }
});

// Get logins from vendor and customer portals
router.get('/logins', async (req, res) => {
  try {
    // Get users from customer and vendor portals with lastLogin info
    const customerUsers = await userService.getUsers(PortalType.CUSTOMER);
    const vendorUsers = await userService.getUsers(PortalType.VENDOR);

    // Combine and format login data
    const allUsers = [...customerUsers, ...vendorUsers];

    // Get organization names for users
    const logins = await Promise.all(
      allUsers
        .filter((user) => user.lastLogin) // Only show users who have logged in
        .map(async (user) => {
          let organizationName = null;
          if (user.organizationId) {
            const org = await Organization.findById(user.organizationId);
            organizationName = org?.name || null;
          }

          return {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            portalType: user.portalType,
            role: user.role,
            organizationId: user.organizationId,
            organizationName,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
          };
        })
    );

    // Sort by lastLogin descending (most recent first)
    logins.sort((a, b) => {
      const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      data: logins,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get logins',
    });
  }
});

// Licenses routes (shared with Tech Portal)
router.get('/licenses', async (req, res) => {
  try {
    const { organizationId } = req.query;
    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
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

// Onboarding data routes (shared with Tech Portal)
router.get('/customer-onboardings', onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get('/vendor-onboardings', onboardingController.getVendorOnboardings.bind(onboardingController));
router.get('/customer-onboardings/:id', onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get('/vendor-onboardings/:id', onboardingController.getVendorOnboardingById.bind(onboardingController));
router.post('/customer-onboardings/:id/approve', onboardingController.approveCustomerOnboarding.bind(onboardingController));
router.post('/customer-onboardings/:id/reject', onboardingController.rejectCustomerOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/approve', onboardingController.approveVendorOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/reject', onboardingController.rejectVendorOnboarding.bind(onboardingController));

// Admin Users routes (for managing admin portal users)
router.get('/admin-users', async (req, res) => {
  try {
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

// Brands routes
router.get('/brands', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const brands = await brandService.getBrands(filters);
    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brands',
    });
  }
});

router.post('/brands', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    const userId = (req as any).user?.userId;
    const brand = await brandService.createBrand({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      isGlobal: true, // Admin-created brands are global
      status: 'active',
    });
    res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create brand',
    });
  }
});

router.put('/brands/:id', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update brand',
    });
  }
});

router.delete('/brands/:id', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    await brandService.deleteBrand(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete brand',
    });
  }
});

router.post('/brands/:id/approve', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    const brand = await brandService.approveBrand(req.params.id);
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve brand',
    });
  }
});

router.post('/brands/:id/reject', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    await brandService.rejectBrand(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Brand rejected successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject brand',
    });
  }
});

// Categories routes
router.get('/categories', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    const categories = await categoryService.getCategories(filters);
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get categories',
    });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    const userId = (req as any).user?.userId;
    const category = await categoryService.createCategory({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      isGlobal: true, // Admin-created categories are global
      status: 'active',
    });
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create category',
    });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update category',
    });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    await categoryService.deleteCategory(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete category',
    });
  }
});

router.post('/categories/:id/approve', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    const category = await categoryService.approveCategory(req.params.id);
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve category',
    });
  }
});

router.post('/categories/:id/reject', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    await categoryService.rejectCategory(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Category rejected successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject category',
    });
  }
});

// Models routes
router.get('/models', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    const filters: any = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.brandId) {
      filters.brandId = req.query.brandId;
    }
    const models = await modelService.getModels(filters);
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get models',
    });
  }
});

router.post('/models', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    const userId = (req as any).user?.userId;
    const model = await modelService.createModel({
      name: req.body.name,
      description: req.body.description,
      brandId: req.body.brandId,
      createdBy: userId,
      isGlobal: true, // Admin-created models are global
      status: 'active',
    });
    res.status(201).json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create model',
    });
  }
});

router.put('/models/:id', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    const model = await modelService.updateModel(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update model',
    });
  }
});

router.delete('/models/:id', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    await modelService.deleteModel(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Model deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete model',
    });
  }
});

router.post('/models/:id/approve', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    const model = await modelService.approveModel(req.params.id);
    res.status(200).json({
      success: true,
      data: model,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to approve model',
    });
  }
});

router.post('/models/:id/reject', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    await modelService.rejectModel(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Model rejected successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to reject model',
    });
  }
});

// RFQ routes
router.get('/rfq', async (req, res) => {
  try {
    // For admin, we need to get the admin organization ID
    // Admin portal users belong to the admin organization (Euroasiann)
    const requester = (req as any).user;
    // Admin portal users might not have organizationId, so we'll use a special admin org ID
    // Or we can get all RFQs sent by admin
    const rfqs = await rfqService.getRFQs(requester?.organizationId || 'admin', req.query);
    res.json({ success: true, data: rfqs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rfq', async (req, res) => {
  try {
    const requester = (req as any).user;
    const { recipientVendorIds, ...rfqData } = req.body;
    
    if (!recipientVendorIds || !Array.isArray(recipientVendorIds) || recipientVendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one vendor must be selected',
      });
    }

    // For admin, we use a special admin organization ID or the user's organizationId
    // In practice, admin RFQs are sent from "Euroasiann" organization
    const adminOrgId = requester?.organizationId || 'admin'; // You may need to create a special admin org
    
    const rfq = await rfqService.createRFQ(
      adminOrgId,
      rfqData,
      'admin', // Admin is sending the RFQ
      recipientVendorIds
    );
    res.status(201).json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get available vendors for RFQ creation (admin-invited only)
router.get('/rfq/vendors', async (req, res) => {
  try {
    const requester = (req as any).user;
    const adminOrgId = requester?.organizationId || 'admin';
    const vendors = await rfqService.getAvailableVendorsForRFQ(adminOrgId, PortalType.ADMIN);
    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
