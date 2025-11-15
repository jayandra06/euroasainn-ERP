import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';
import { itemService } from '../services/item.service';
import { quotationService } from '../services/quotation.service';
import { userController } from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.VENDOR));
router.use(validateLicense);

router.post('/users/invite', async (req, res) => {
  try {
    req.body.portalType = PortalType.VENDOR;
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

// Items routes
router.get('/items', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const items = await itemService.getItems(orgId, req.query);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const item = await itemService.createItem(orgId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Quotation routes
router.get('/quotation', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const quotations = await quotationService.getQuotations(orgId, req.query);
    res.json({ success: true, data: quotations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/quotation', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const quotation = await quotationService.createQuotation(orgId, req.body);
    res.status(201).json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Catalogue route (same as items)
router.get('/catalogue', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const items = await itemService.getItems(orgId, req.query);
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inventory route
router.get('/inventory', async (req, res) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const items = await itemService.getItems(orgId, req.query);
    // Transform items to inventory format
    const inventory = items.map((item: any) => ({
      itemId: item._id,
      name: item.name,
      sku: item.sku,
      stockQuantity: item.stockQuantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
    }));
    res.json({ success: true, data: inventory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
