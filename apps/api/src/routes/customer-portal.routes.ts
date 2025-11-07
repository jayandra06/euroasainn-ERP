import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';
import { rfqService } from '../services/rfq.service';
import { vesselService } from '../services/vessel.service';
import { employeeService } from '../services/employee.service';
import { businessUnitService } from '../services/business-unit.service';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.CUSTOMER));
router.use(validateLicense);

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
    const rfq = await rfqService.createRFQ(orgId, req.body);
    res.status(201).json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
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

export default router;
