import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';
import { rfqService } from '../services/rfq.service';
import { vesselService } from '../services/vessel.service';
import { employeeService } from '../services/employee.service';
import { businessUnitService } from '../services/business-unit.service';
import { userController } from '../controllers/user.controller';
import { licenseService } from '../services/license.service';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.CUSTOMER));
router.use(validateLicense);

// Payment routes should be accessible without active payment
// All other routes require active payment
router.use((req, res, next) => {
  // Allow access to payment-related routes without payment check
  if (req.path.startsWith('/payment') || req.path === '/licenses') {
    return next();
  }
  // Apply payment middleware to all other routes
  return paymentStatusMiddleware(req as any, res, next);
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

// RFQ routes
router.get('/rfq', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const rfqs = await rfqService.getRFQs(orgId, req.query);
    res.json({ success: true, data: rfqs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rfq', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const { recipientVendorIds, ...rfqData } = req.body;
    
    if (!recipientVendorIds || !Array.isArray(recipientVendorIds) || recipientVendorIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one vendor must be selected',
      });
    }

    const rfq = await rfqService.createRFQ(
      orgId,
      rfqData,
      'customer', // Customer is sending the RFQ
      recipientVendorIds
    );
    res.status(201).json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get available vendors for RFQ creation (customer-invited only)
router.get('/rfq/vendors', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const vendors = await rfqService.getAvailableVendorsForRFQ(orgId, PortalType.CUSTOMER);
    res.json({ success: true, data: vendors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rfq/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const rfq = await rfqService.getRFQById(req.params.id, orgId);
    res.json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/rfq/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const rfq = await rfqService.updateRFQ(req.params.id, orgId, req.body);
    res.json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/rfq/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    await rfqService.deleteRFQ(req.params.id, orgId);
    res.json({ success: true, message: 'RFQ deleted' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Vessel routes
router.get('/vessels', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const vessels = await vesselService.getVessels(orgId);
    res.json({ success: true, data: vessels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/vessels', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const vessel = await vesselService.createVessel(orgId, req.body);
    res.status(201).json({ success: true, data: vessel });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Employee routes
router.get('/employees', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employees = await employeeService.getEmployees(orgId, req.query);
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employee = await employeeService.createEmployee(orgId, req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Business Unit routes
router.get('/business-units', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const units = await businessUnitService.getBusinessUnits(orgId, req.query);
    res.json({ success: true, data: units });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/business-units', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const unit = await businessUnitService.createBusinessUnit(orgId, req.body);
    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// License routes - Get licenses for user's organization
// Get license pricing for organization
router.get('/license/pricing', async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const { User } = await import('../models/user.model');
    const user = await User.findById(userId);
    if (!user || !user.organizationId) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    const licenses = await licenseService.getLicenses(user.organizationId.toString());
    const activeLicense = licenses.find((l: any) => l.status === 'active' && new Date(l.expiresAt) > new Date());

    if (!activeLicense || !activeLicense.pricing) {
      return res.status(404).json({
        success: false,
        error: 'No active license with pricing found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        monthlyPrice: activeLicense.pricing.monthlyPrice,
        yearlyPrice: activeLicense.pricing.yearlyPrice,
        currency: activeLicense.pricing.currency,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get license pricing',
    });
  }
});

router.get('/licenses', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }
    const licenses = await licenseService.getLicenses(orgId);
    res.json({ success: true, data: licenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vendor invitation routes (customers can invite vendors)
router.get('/vendors', async (req, res) => {
  try {
    const { organizationService } = await import('../services/organization.service');
    const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index.ts');
    const requester = (req as any).user;
    
    const filters: any = {
      requesterPortalType: PortalType.CUSTOMER,
    };
    
    if (requester?.organizationId) {
      filters.customerOrganizationId = requester.organizationId;
    }

    const vendors = await organizationService.getOrganizations(
      OrganizationType.VENDOR,
      PortalType.VENDOR,
      filters
    );
    
    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get vendors',
    });
  }
});

router.post('/vendors/invite', async (req, res) => {
  try {
    const { organizationController } = await import('../controllers/organization.controller');
    const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index.ts');
    
    // Ensure it's a vendor organization
    req.body.type = OrganizationType.VENDOR;
    req.body.portalType = PortalType.VENDOR;
    
    // Call the organization controller to create/invite vendor
    await organizationController.createOrganization(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to invite vendor',
    });
  }
});

export default router;
