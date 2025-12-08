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
    // Admin portal should see ALL RFQs (from both admin and customers)
    const rfqs = await rfqService.getAllRFQs(req.query);
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

// Get all vendor users with organization information
router.get('/vendors', async (req, res) => {
  try {
    const filters: any = {};
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const vendorUsers = await userService.getUsers(PortalType.VENDOR, undefined, filters);

    // Get organization names for each vendor user
    const vendorsWithOrgInfo = await Promise.all(
      vendorUsers.map(async (user: any) => {
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
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone,
          organizationId: user.organizationId,
          organizationName,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: vendorsWithOrgInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendors',
    });
  }
});

// Get all customer organizations with onboarding information
router.get('/customers', async (req, res) => {
  try {
    const { CustomerOnboarding } = await import('../models/customer-onboarding.model');
    const { vesselService } = await import('../services/vessel.service');
    
    // Get all customer organizations
    const customerOrgs = await Organization.find({ type: OrganizationType.CUSTOMER }).sort({ createdAt: -1 });
    
    // Get all customer onboardings
    const onboardings = await CustomerOnboarding.find({}).sort({ createdAt: -1 });
    
    // Create a map of organizationId -> onboarding
    const onboardingMap = new Map();
    onboardings.forEach((onboarding: any) => {
      if (onboarding.organizationId) {
        const orgId = onboarding.organizationId.toString();
        onboardingMap.set(orgId, onboarding);
      }
    });
    
    // Combine organizations with onboarding data and vessel count
    const customersWithDetails = await Promise.all(
      customerOrgs.map(async (org: any) => {
        const orgId = org._id.toString();
        const onboarding = onboardingMap.get(orgId);
        
        // Get vessel count for this organization
        let vesselCount = 0;
        try {
          const vessels = await vesselService.getVessels(orgId);
          vesselCount = vessels.length;
        } catch (error) {
          // If vessel service fails, use onboarding data
          vesselCount = onboarding?.vessels || 0;
        }
        
        // Build phone number from onboarding data
        const phoneNumber = onboarding 
          ? `${onboarding.mobileCountryCode || ''} ${onboarding.mobilePhone || ''}`.trim()
          : '';
        
        return {
          _id: org._id,
          companyName: org.name,
          email: onboarding?.email || '',
          phoneNumber: phoneNumber,
          primaryContact: onboarding?.contactPerson || '',
          numberOfVessels: vesselCount,
          isActive: org.isActive,
          status: onboarding?.status || (org.isActive ? 'approved' : 'pending'),
          createdAt: org.createdAt,
        };
      })
    );
    
    // Filter by status if provided
    let filteredCustomers = customersWithDetails;
    if (req.query.status === 'accepted' || req.query.status === 'approved') {
      filteredCustomers = customersWithDetails.filter(c => (c.status === 'approved' || c.status === 'completed') && c.isActive);
    } else if (req.query.status === 'pending') {
      filteredCustomers = customersWithDetails.filter(c => c.status === 'pending' || (!c.isActive && c.status !== 'approved'));
    }
    
    res.status(200).json({
      success: true,
      data: filteredCustomers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get customers',
    });
  }
});

// Get vessels for a customer organization
router.get('/organizations/:id/vessels', async (req, res) => {
  try {
    const { vesselService } = await import('../services/vessel.service');
    const organizationId = req.params.id;
    
    // Verify organization exists and is a customer organization
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }
    
    if (org.type !== OrganizationType.CUSTOMER) {
      return res.status(400).json({
        success: false,
        error: 'Organization is not a customer organization',
      });
    }
    
    const vessels = await vesselService.getVessels(organizationId);
    res.status(200).json({
      success: true,
      data: vessels,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vessels',
    });
  }
});

// Get business units for a customer organization
router.get('/organizations/:id/business-units', async (req, res) => {
  try {
    const { businessUnitService } = await import('../services/business-unit.service');
    const organizationId = req.params.id;
    
    // Verify organization exists and is a customer organization
    const org = await Organization.findById(organizationId);
    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }
    
    if (org.type !== OrganizationType.CUSTOMER) {
      return res.status(400).json({
        success: false,
        error: 'Organization is not a customer organization',
      });
    }
    
    const businessUnits = await businessUnitService.getBusinessUnits(organizationId);
    res.status(200).json({
      success: true,
      data: businessUnits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get business units',
    });
  }
});

// Settings routes
router.get('/settings/:type', async (req, res) => {
  try {
    const { Settings } = await import('../models/settings.model');
    const settings = await Settings.findOne({ type: req.params.type });
    
    if (!settings) {
      // Return default values if settings don't exist
      const defaults: Record<string, any> = {
        'branding': {
          platformName: 'Enterprise ERP',
          logoUrl: '',
          primaryColor: '#5C6268',
        },
        'regional': {
          defaultTimezone: 'UTC',
          defaultCurrency: 'USD',
        },
        'email-templates': {
          welcomeEmail: 'Welcome to {platform_name}...',
          invoiceEmail: 'Your invoice for {month}...',
        },
        'sms-templates': {
          verificationSMS: 'Your verification code is {code}',
          alertSMS: 'Important alert: {message}',
        },
      };
      
      return res.status(200).json({
        success: true,
        data: {
          type: req.params.type,
          data: defaults[req.params.type] || {},
        },
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get settings',
    });
  }
});

router.put('/settings/:type', async (req, res) => {
  try {
    const { Settings } = await import('../models/settings.model');
    const userId = (req as any).user?.userId;
    
    const settings = await Settings.findOneAndUpdate(
      { type: req.params.type },
      {
        data: req.body.data || req.body,
        updatedBy: userId,
      },
      {
        upsert: true,
        new: true,
      }
    );
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings saved successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to save settings',
    });
  }
});

// Export routes
router.get('/export/licenses', async (req, res) => {
  try {
    const { licenseService } = await import('../services/license.service');
    const { organizationService } = await import('../services/organization.service');
    
    const licenses = await licenseService.getLicenses();
    const organizations = await organizationService.getOrganizations();
    
    // Create CSV
    const headers = ['Organization Name', 'Type', 'License Status', 'Expires At', 'Issued At', 'Users Limit', 'Users Used', 'Vessels Limit', 'Vessels Used', 'Items Limit', 'Items Used'];
    const rows = licenses.map((license: any) => {
      const org = organizations.find((o: any) => o._id.toString() === license.organizationId?.toString());
      return [
        org?.name || 'N/A',
        org?.type || 'N/A',
        license.status || 'N/A',
        license.expiresAt ? new Date(license.expiresAt).toISOString().split('T')[0] : 'N/A',
        license.issuedAt ? new Date(license.issuedAt).toISOString().split('T')[0] : 'N/A',
        license.usageLimits?.users || 0,
        license.currentUsage?.users || 0,
        license.usageLimits?.vessels || 0,
        license.currentUsage?.vessels || 0,
        license.usageLimits?.items || 0,
        license.currentUsage?.items || 0,
      ];
    });
    
    const csv = [headers.join(','), ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="licenses-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export licenses',
    });
  }
});

router.get('/export/organizations', async (req, res) => {
  try {
    const { organizationService } = await import('../services/organization.service');
    const organizations = await organizationService.getOrganizations();
    
    // Create CSV
    const headers = ['Name', 'Type', 'Portal Type', 'Is Active', 'Created At'];
    const rows = organizations.map((org: any) => [
      org.name || 'N/A',
      org.type || 'N/A',
      org.portalType || 'N/A',
      org.isActive ? 'Yes' : 'No',
      org.createdAt ? new Date(org.createdAt).toISOString().split('T')[0] : 'N/A',
    ]);
    
    const csv = [headers.join(','), ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="organizations-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export organizations',
    });
  }
});

router.get('/export/onboarding', async (req, res) => {
  try {
    const { onboardingService } = await import('../services/onboarding.service');
    const customerOnboardings = await onboardingService.getCustomerOnboardings();
    const vendorOnboardings = await onboardingService.getVendorOnboardings();
    
    // Create CSV
    const headers = ['Type', 'Organization Name', 'Status', 'Submitted At', 'Approved At', 'Rejected At'];
    const rows = [
      ...customerOnboardings.map((onboarding: any) => [
        'Customer',
        onboarding.organizationName || 'N/A',
        onboarding.status || 'N/A',
        onboarding.submittedAt ? new Date(onboarding.submittedAt).toISOString().split('T')[0] : 'N/A',
        onboarding.approvedAt ? new Date(onboarding.approvedAt).toISOString().split('T')[0] : 'N/A',
        onboarding.rejectedAt ? new Date(onboarding.rejectedAt).toISOString().split('T')[0] : 'N/A',
      ]),
      ...vendorOnboardings.map((onboarding: any) => [
        'Vendor',
        onboarding.organizationName || 'N/A',
        onboarding.status || 'N/A',
        onboarding.submittedAt ? new Date(onboarding.submittedAt).toISOString().split('T')[0] : 'N/A',
        onboarding.approvedAt ? new Date(onboarding.approvedAt).toISOString().split('T')[0] : 'N/A',
        onboarding.rejectedAt ? new Date(onboarding.rejectedAt).toISOString().split('T')[0] : 'N/A',
      ]),
    ];
    
    const csv = [headers.join(','), ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="onboarding-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export onboarding data',
    });
  }
});

export default router;
