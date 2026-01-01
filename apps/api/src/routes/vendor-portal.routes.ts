import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { validateLicense } from '../middleware/license.middleware';
import { paymentStatusMiddleware } from '../middleware/payment.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { itemService } from '../services/item.service';
import { quotationService } from '../services/quotation.service';
import { userController } from '../controllers/user.controller';
import { licenseService } from '../services/license.service';
import { rfqService } from '../services/rfq.service';
import { parseCatalogCSV } from '../utils/csv-parser';
import { logger } from '../config/logger';

const router = Router();

router.use(authMiddleware);
router.use(requirePortal(PortalType.VENDOR));
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

// Upload catalog file (CSV)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.post('/catalog/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const orgId = (req as any).user?.organizationId;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }

    // Parse CSV file
    const parsedItems = parseCatalogCSV(req.file.buffer);

    if (parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid items found in CSV file',
      });
    }

    // Create items in bulk
    const createdItems = [];
    const errors = [];

    for (const itemData of parsedItems) {
      try {
        const item = await itemService.createItem(orgId, itemData);
        createdItems.push(item);
      } catch (error: any) {
        logger.error(`Failed to create item ${itemData.name}:`, error);
        errors.push({
          item: itemData.name,
          error: error.message || 'Failed to create item',
        });
      }
    }

    logger.info(`Catalog upload completed: ${createdItems.length} items created, ${errors.length} errors`);

    res.status(201).json({
      success: true,
      data: {
        created: createdItems.length,
        failed: errors.length,
        items: createdItems,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `Successfully uploaded ${createdItems.length} items${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    });
  } catch (error: any) {
    logger.error('Catalog upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to upload catalog file',
    });
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

// Brands routes (vendor can create brands that need approval)
router.get('/brands', async (req, res) => {
  try {
    const { brandService } = await import('../services/brand.service');
    const orgId = (req as any).user?.organizationId;
    const brands = await brandService.getBrands({
      organizationId: orgId,
      includeGlobal: true, // Include global brands + vendor's own brands
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
    const { brandService } = await import('../services/brand.service');
    const userId = (req as any).user?.userId;
    const orgId = (req as any).user?.organizationId;
    const brand = await brandService.createBrand({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Vendor-created brands are organization-specific
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

// Categories routes (vendor can create categories that need approval)
router.get('/categories', async (req, res) => {
  try {
    const { categoryService } = await import('../services/category.service');
    const orgId = (req as any).user?.organizationId;
    const categories = await categoryService.getCategories({
      organizationId: orgId,
      includeGlobal: true, // Include global categories + vendor's own categories
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
    const { categoryService } = await import('../services/category.service');
    const userId = (req as any).user?.userId;
    const orgId = (req as any).user?.organizationId;
    const category = await categoryService.createCategory({
      name: req.body.name,
      description: req.body.description,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Vendor-created categories are organization-specific
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

// Models routes (vendor can create models that need approval)
router.get('/models', async (req, res) => {
  try {
    const { modelService } = await import('../services/model.service');
    const orgId = (req as any).user?.organizationId;
    const filters: any = {
      organizationId: orgId,
      includeGlobal: true, // Include global models + vendor's own models
    };
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
    const orgId = (req as any).user?.organizationId;
    const model = await modelService.createModel({
      name: req.body.name,
      description: req.body.description,
      brandId: req.body.brandId,
      createdBy: userId,
      organizationId: orgId,
      isGlobal: false, // Vendor-created models are organization-specific
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

// RFQ routes (vendor's RFQ inbox)
router.get('/rfq', async (req, res) => {
  try {
    const vendorOrgId = (req as any).user?.organizationId;
    if (!vendorOrgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }
    const rfqs = await rfqService.getRFQsForVendor(vendorOrgId, req.query);
    res.json({ success: true, data: rfqs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rfq/:id', async (req, res) => {
  try {
    const vendorOrgId = (req as any).user?.organizationId;
    if (!vendorOrgId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID not found',
      });
    }
    const rfqs = await rfqService.getRFQsForVendor(vendorOrgId);
    const rfq = rfqs.find((r: any) => r._id.toString() === req.params.id);
    if (!rfq) {
      return res.status(404).json({
        success: false,
        error: 'RFQ not found',
      });
    }
    res.json({ success: true, data: rfq });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
