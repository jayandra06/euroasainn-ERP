import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { rfqService } from '../services/rfq.service';
import { vesselService } from '../services/vessel.service';
import { employeeService } from '../services/employee.service';
import { businessUnitService } from '../services/business-unit.service';
import { userController } from '../controllers/user.controller';
import { licenseService } from '../services/license.service';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { modelService } from '../services/model.service';
import { rolePayrollStructureService } from '../services/role-payroll-structure.service';

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

// Users routes
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

    // Set portalType to CUSTOMER for customer portal users
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

router.get('/employees/onboarding-review', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    const filters: { status?: string } = {};
    if (req.query.status && req.query.status !== 'all') {
      filters.status = req.query.status as string;
    }

    const employees = await employeeService.getEmployeesWithOnboardingStatus(orgId, filters);
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

router.post('/employees/invite', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    const result = await employeeService.inviteEmployee(orgId, req.body);
    res.status(201).json({
      success: true,
      data: {
        employee: result.employee,
        emailSent: result.emailSent,
        invitationLink: result.invitationLink,
      },
      message: result.emailSent
        ? 'Employee invited successfully! Onboarding email sent with invitation link.'
        : 'Employee created successfully, but email could not be sent.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/employees/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employee = await employeeService.getEmployeeById(req.params.id, orgId);
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const employee = await employeeService.updateEmployee(req.params.id, orgId, req.body);
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Employee Onboarding Review Routes (must come before /employees/:id to avoid route conflicts)
router.get('/employees/onboardings', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    const filters: { status?: string } = {};
    if (req.query.status) {
      filters.status = req.query.status as string;
    }

    const onboardings = await employeeService.getEmployeeOnboardings(orgId, filters);
    res.json({ success: true, data: onboardings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/employees/onboardings/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    const onboarding = await employeeService.getEmployeeOnboardingById(req.params.id, orgId);
    res.json({ success: true, data: onboarding });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/employees/onboardings/:id/approve', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const userId = (req as any).user?.userId || (req as any).user?._id;
    const onboardingId = req.params.id;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found. Please ensure you are authenticated.',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found. Please ensure you are authenticated.',
      });
    }

    if (!onboardingId) {
      return res.status(400).json({
        success: false,
        error: 'Onboarding ID is required',
      });
    }

    const { remarks } = req.body;
    const result = await employeeService.approveEmployeeOnboarding(onboardingId, orgId, userId, remarks);
    res.json({ success: true, data: result, message: result.message });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to approve onboarding' });
  }
});

router.post('/employees/onboardings/:id/reject', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const userId = (req as any).user?.userId || (req as any).user?._id;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found',
      });
    }

    const { rejectionReason } = req.body;
    const result = await employeeService.rejectEmployeeOnboarding(req.params.id, orgId, userId, rejectionReason);
    res.json({ success: true, data: result, message: result.message });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/employees/onboardings/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    const result = await employeeService.deleteEmployeeOnboarding(req.params.id, orgId);
    res.json({ success: true, data: result, message: result.message });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Employee routes (must come after onboarding routes to avoid conflicts)
router.delete('/employees/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    await employeeService.deleteEmployee(req.params.id, orgId);
    res.json({ success: true, message: 'Employee deleted successfully' });
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

// Get single business unit
router.get('/business-units/:id', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const unit = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    res.json({ success: true, data: unit });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Get vessels assigned to a business unit
router.get('/business-units/:id/vessels', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const { Vessel } = await import('../models/vessel.model');
    
    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    const vessels = await Vessel.find({
      organizationId: orgId,
      businessUnitId: req.params.id,
    });
    res.json({ success: true, data: vessels });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign vessel to business unit
router.post('/business-units/:id/vessels/:vesselId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const { Vessel } = await import('../models/vessel.model');
    
    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    // Verify vessel belongs to organization
    const vessel = await Vessel.findOne({
      _id: req.params.vesselId,
      organizationId: orgId,
    });
    if (!vessel) {
      return res.status(404).json({ success: false, error: 'Vessel not found' });
    }

    // Check if vessel is already assigned to another BU
    if (vessel.businessUnitId && vessel.businessUnitId.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Vessel is already assigned to another business unit',
      });
    }

    vessel.businessUnitId = req.params.id as any;
    await vessel.save();
    res.json({ success: true, data: vessel });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unassign vessel from business unit
router.delete('/business-units/:id/vessels/:vesselId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const { Vessel } = await import('../models/vessel.model');
    
    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    // Verify vessel belongs to organization and is assigned to this BU
    const vessel = await Vessel.findOne({
      _id: req.params.vesselId,
      organizationId: orgId,
      businessUnitId: req.params.id,
    });
    if (!vessel) {
      return res.status(404).json({ success: false, error: 'Vessel not found or not assigned to this BU' });
    }

    vessel.businessUnitId = undefined;
    await vessel.save();
    res.json({ success: true, message: 'Vessel unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get staff assigned to a business unit
router.get('/business-units/:id/staff', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    
    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    const employees = await employeeService.getEmployees(orgId, { businessUnitId: req.params.id });
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign staff to business unit (create employee from user)
router.post('/business-units/:id/staff', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    // Get user details
    const { userService } = await import('../services/user.service');
    const { PortalType } = await import('../../../../packages/shared/src/types/index.ts');
    const users = await userService.getUsers(PortalType.CUSTOMER, orgId);
    const user = users.find((u: any) => u._id.toString() === userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if employee already exists for this user and BU
    const { Employee } = await import('../models/employee.model');
    const existingEmployeeInThisBU = await Employee.findOne({
      organizationId: orgId,
      businessUnitId: req.params.id,
      email: user.email,
    });

    if (existingEmployeeInThisBU) {
      return res.status(400).json({
        success: false,
        error: 'Staff member is already assigned to this business unit',
      });
    }

    // Check if employee exists in another BU - if so, update it instead of creating duplicate
    const existingEmployeeInOtherBU = await Employee.findOne({
      organizationId: orgId,
      email: user.email,
      businessUnitId: { $ne: req.params.id },
    });

    if (existingEmployeeInOtherBU) {
      // Update existing employee to assign to this BU
      existingEmployeeInOtherBU.businessUnitId = req.params.id as any;
      await existingEmployeeInOtherBU.save();
      return res.status(200).json({ success: true, data: existingEmployeeInOtherBU });
    }

    // Create employee record
    const employee = await employeeService.createEmployee(orgId, {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      businessUnitId: req.params.id as any,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unassign staff from business unit
router.delete('/business-units/:id/staff/:employeeId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    
    // Verify BU belongs to organization
    const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
    if (!bu) {
      return res.status(404).json({ success: false, error: 'Business unit not found' });
    }

    // Verify employee belongs to organization and is assigned to this BU
    const employee = await employeeService.getEmployeeById(req.params.employeeId, orgId);
    if (!employee || employee.businessUnitId?.toString() !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Employee not found or not assigned to this BU' });
    }

    // Remove business unit assignment
    await employeeService.updateEmployee(req.params.employeeId, orgId, { businessUnitId: undefined });
    res.json({ success: true, message: 'Staff unassigned successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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

// Get vendor users from organizations invited by this customer
router.get('/vendors/users', async (req, res) => {
  try {
    const { userService } = await import('../services/user.service');
    const { organizationService } = await import('../services/organization.service');
    const { OrganizationType, PortalType } = await import('../../../../packages/shared/src/types/index.ts');
    const { Organization } = await import('../models/organization.model');
    const requester = (req as any).user;
    
    if (!requester?.organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Customer organization ID is required',
      });
    }

    // Get vendor organizations invited by this customer
    const vendorOrgs = await organizationService.getOrganizations(
      OrganizationType.VENDOR,
      PortalType.VENDOR,
      {
        customerOrganizationId: requester.organizationId,
        requesterPortalType: PortalType.CUSTOMER,
      }
    );

    // Get all vendor user IDs from these organizations
    const vendorOrgIds = vendorOrgs.map((org: any) => org._id.toString());

    if (vendorOrgIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Get vendor users from these organizations
    const filters: any = {};
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const allVendorUsers = await userService.getUsers(PortalType.VENDOR, undefined, filters);
    
    // Filter to only users from organizations invited by this customer
    const vendorUsers = allVendorUsers.filter((user: any) => 
      user.organizationId && vendorOrgIds.includes(user.organizationId.toString())
    );

    // Get organization names and onboarding status for each vendor user
    const { VendorOnboarding } = await import('../models/vendor-onboarding.model');
    const vendorsWithOrgInfo = await Promise.all(
      vendorUsers.map(async (user: any) => {
        let organizationName = null;
        let onboardingStatus = 'pending'; // Default to pending if no onboarding found
        
        if (user.organizationId) {
          const org = await Organization.findById(user.organizationId);
          organizationName = org?.name || null;
          
          // Check onboarding status for this vendor organization
          const onboarding = await VendorOnboarding.findOne({ 
            organizationId: user.organizationId 
          }).sort({ createdAt: -1 }); // Get the most recent onboarding
          
          if (onboarding) {
            onboardingStatus = onboarding.status; // 'pending', 'completed', 'approved', 'rejected'
          }
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
          onboardingStatus, // Add onboarding status
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
      error: error.message || 'Failed to get vendor users',
    });
  }
});

// Brands routes - Get active brands and create new ones (pending approval)
router.get('/brands', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required',
      });
    }
    // Get active brands (global + organization-specific)
    // Skip populate for faster loading (customer portal only needs name/ID)
    const brands = await brandService.getBrands({
      status: 'active',
      organizationId: orgId,
      includeGlobal: true,
      skipPopulate: true,
    });
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
    const userId = (req as any).user?.userId;
    const orgId = (req as any).user?.organizationId;
    const brand = await brandService.createBrand({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Customer-created brands are organization-specific
      status: 'pending', // Need admin approval
    });
    res.status(201).json({
      success: true,
      data: brand,
      message: 'Brand created successfully. It will appear after admin approval.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create brand',
    });
  }
});

// Categories routes - Get active categories and create new ones (pending approval)
router.get('/categories', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    // Get active categories (global + organization-specific)
    // Skip populate for faster loading (customer portal only needs name/ID)
    const categories = await categoryService.getCategories({
      status: 'active',
      organizationId: orgId,
      includeGlobal: true,
      skipPopulate: true,
    });
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
    const userId = (req as any).user?.userId;
    const orgId = (req as any).user?.organizationId;
    const category = await categoryService.createCategory({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Customer-created categories are organization-specific
      status: 'pending', // Need admin approval
    });
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully. It will appear after admin approval.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create category',
    });
  }
});

// Models routes - Get active models and create new ones (pending approval)
router.get('/models', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const brandId = req.query.brandId as string;
    // Get active models (global + organization-specific)
    // Skip populate for faster loading (customer portal only needs name/ID)
    const models = await modelService.getModels({
      status: 'active',
      organizationId: orgId,
      brandId: brandId,
      includeGlobal: true,
      skipPopulate: true,
    });
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
    const userId = (req as any).user?.userId;
    const orgId = (req as any).user?.organizationId;
    const model = await modelService.createModel({
      name: req.body.name,
      description: req.body.description,
      brandId: req.body.brandId,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Customer-created models are organization-specific
      status: 'pending', // Need admin approval
    });
    res.status(201).json({
      success: true,
      data: model,
      message: 'Model created successfully. It will appear after admin approval.',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create model',
    });
  }
});

// Role Payroll Structure routes
router.get('/role-payroll-structures', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const structures = await rolePayrollStructureService.getPayrollStructures(orgId);
    res.json({ success: true, data: structures });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/role-payroll-structures/:roleId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const structure = await rolePayrollStructureService.getPayrollStructureByRole(orgId, req.params.roleId);
    res.json({ success: true, data: structure });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/role-payroll-structures', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const { roleId, payrollStructure } = req.body;
    if (!roleId) {
      return res.status(400).json({ success: false, error: 'Role ID is required' });
    }
    const structure = await rolePayrollStructureService.createOrUpdatePayrollStructure(
      orgId,
      roleId,
      payrollStructure
    );
    res.status(201).json({ success: true, data: structure });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/role-payroll-structures/:roleId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const { payrollStructure } = req.body;
    const structure = await rolePayrollStructureService.createOrUpdatePayrollStructure(
      orgId,
      req.params.roleId,
      payrollStructure
    );
    res.json({ success: true, data: structure });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/role-payroll-structures/:roleId', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    await rolePayrollStructureService.deletePayrollStructure(orgId, req.params.roleId);
    res.json({ success: true, message: 'Payroll structure deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/role-payroll-structures/:roleId/toggle-status', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Organization ID is required' });
    }
    const { isActive } = req.body;
    const structure = await rolePayrollStructureService.togglePayrollStructureStatus(
      orgId,
      req.params.roleId,
      isActive
    );
    res.json({ success: true, data: structure });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
