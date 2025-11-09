import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { PortalType } from '@euroasiann/shared';

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
router.get('/organizations/:id', organizationController.getOrganizationById.bind(organizationController));
router.put('/organizations/:id', organizationController.updateOrganization.bind(organizationController));
router.delete('/organizations/:id', organizationController.deleteOrganization.bind(organizationController));

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
    const { userService } = await import('../services/user.service');
    const { PortalType } = await import('@euroasiann/shared');
    const { Organization } = await import('../models/organization.model');
    
    // Get users from customer and vendor portals with lastLogin info
    const customerUsers = await userService.getUsers(PortalType.CUSTOMER);
    const vendorUsers = await userService.getUsers(PortalType.VENDOR);
    
    // Combine and format login data
    const allUsers = [...customerUsers, ...vendorUsers];
    
    // Get organization names for users
    const logins = await Promise.all(
      allUsers
        .filter(user => user.lastLogin) // Only show users who have logged in
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

export default router;
