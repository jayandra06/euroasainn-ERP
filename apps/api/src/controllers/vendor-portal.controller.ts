import { Request, Response } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../config/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index';
import { User } from '../models/user.model';
import { CatalogItem } from '../models/catalog.model';
import { VendorOnboarding } from '../models/vendor-onboarding.model'; // ← Your VendorOnboarding model

import { itemService } from '../services/item.service';
import { quotationService } from '../services/quotation.service';
import { licenseService } from '../services/license.service';
import { rfqService } from '../services/rfq.service';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { modelService } from '../services/model.service';
import { employeeService } from '../services/employee.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const extOk = ['.csv', '.xls', '.xlsx'].some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (allowed.includes(file.mimetype) || extOk) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, or XLSX files are allowed'));
    }
  },
});

export class VendorPortalController {
  // ===============================
  //     VENDOR ONBOARDING / PROFILE
  // ===============================
  /**
   * GET /onboarding/me
   * Fetch current logged-in vendor's onboarding/profile data
   */
  async getCurrentVendorOnboarding(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required',
        });
      }

      const onboarding = await VendorOnboarding.findOne({ organizationId }).lean();

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          error: 'Vendor onboarding profile not found',
        });
      }

      return res.json({
        success: true,
        data: onboarding,
      });
    } catch (error: any) {
      logger.error('Get vendor onboarding error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch vendor profile',
      });
    }
  }

  /**
   * PATCH /onboarding/me
   * Update current logged-in vendor's onboarding/profile data
   */
  async updateCurrentVendorOnboarding(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required',
        });
      }

      // Only allow these fields to be updated (security filter)
      const allowedFields = [
        'companyName',
        'contactPerson',
        'email',
        'logo',
        'companyDescription',
        'website',
        'mobileCountryCode',
        'mobilePhone',
        'deskCountryCode',
        'deskPhone',
        'address1',
        'address2',
        'city',
        'province',
        'postalCode',
        'country',
        'taxId',
        'accountName',
        'bankName',
        'iban',
        'swift',
        'invoiceEmail',
        'billingAddress1',
        'billingAddress2',
        'billingCity',
        'billingProvince',
        'billingPostal',
        'billingCountry',
        'brands',
        'categories',
        'models',
        'warehouseAddress',
        'managingDirector',
        'managingDirectorEmail',
        'managingDirectorPhone',
        'managingDirectorDeskPhone',
        'port',
        'salesManager',
        'salesManagerEmail',
        'salesManagerPhone',
        'salesManagerDeskPhone',
        'logisticService',
        'logisticAddressLine1',
        'logisticAddressLine2',
        'logisticCity',
        'logisticProvince',
        'logisticPostalCode',
        'logisticCountry',
      ];

      const updates: Partial<typeof VendorOnboarding.prototype> = {};
      allowedFields.forEach(field => {
        if (req.body.hasOwnProperty(field)) {
          (updates as any)[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields provided for update',
        });
      }

      const updated = await VendorOnboarding.findOneAndUpdate(
        { organizationId },
        { $set: updates },
        { new: true, runValidators: true, lean: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Vendor onboarding profile not found',
        });
      }

      return res.json({
        success: true,
        message: 'Vendor profile updated successfully',
        data: updated,
      });
    } catch (error: any) {
      logger.error('Update vendor onboarding error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update vendor profile',
      });
    }
  }

  /**
   * POST /onboarding/logo
   * Upload vendor company logo
   */
  async uploadLogo(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed',
        });
      }

      // Validate file size (max 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'File size must be less than 5MB',
        });
      }

      // Create logos directory if it doesn't exist
      const logosDir = path.resolve(process.cwd(), 'uploads', 'logos');
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(logosDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, req.file.buffer);

      // Generate URL (relative path from uploads directory)
      const logoUrl = `/uploads/logos/${fileName}`;

      // Update vendor onboarding with logo URL
      const updated = await VendorOnboarding.findOneAndUpdate(
        { organizationId },
        { $set: { logo: logoUrl } },
        { new: true, runValidators: true, lean: true }
      );

      if (!updated) {
        // Clean up uploaded file if update fails
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(404).json({
          success: false,
          error: 'Vendor onboarding profile not found',
        });
      }

      return res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: { logo: logoUrl },
      });
    } catch (error: any) {
      logger.error('Upload vendor logo error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload logo',
      });
    }
  }

  // ===============================
  //          ITEM ROUTES
  // ===============================
  async getItems(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const items = await itemService.getItems(orgId, req.query);
      return res.json({ success: true, data: items });
    } catch (error: any) {
      logger.error('Get items error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  async createItem(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const item = await itemService.createItem(orgId, req.body);
      return res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      logger.error('Create item error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Invalid data' });
    }
  }

  // ===============================
  //       QUOTATION ROUTES
  // ===============================
  async getQuotations(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const quotations = await quotationService.getQuotations(orgId, req.query);
      return res.json({ success: true, data: quotations });
    } catch (error: any) {
      logger.error('Get quotations error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  async createQuotation(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const quotation = await quotationService.createQuotation(orgId, req.body);
      return res.status(201).json({ success: true, data: quotation });
    } catch (error: any) {
      logger.error('Create quotation error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Invalid data' });
    }
  }

  // ===============================
  //       CATALOGUE ROUTES
  // ===============================
  async getCatalogue(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.organizationId;
      if (!vendorId) {
        return res.status(403).json({ success: false, error: 'Vendor context required' });
      }

      const {
        page = '1',
        limit = '20',
        search = '',
        status,
        sortBy = 'createdAt',
        sortOrder = '-1',
      } = req.query;

      const query: any = { vendorId };

      if (search && typeof search === 'string' && search.trim()) {
        query.$text = { $search: search.trim() };
      }

      if (status && status !== 'All') {
        query.stockStatus = status;
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(5, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const sort: any = {};
      sort[sortBy as string] = sortOrder === '-1' ? -1 : 1;

      const [items, total] = await Promise.all([
        CatalogItem.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        CatalogItem.countDocuments(query),
      ]);

      return res.json({
        success: true,
        data: items,
        meta: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          limit: limitNum,
        },
      });
    } catch (error: any) {
      logger.error('Get catalogue error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch catalog',
      });
    }
  }

  async createCatalogueItem(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.organizationId;
      if (!vendorId) {
        return res.status(403).json({ success: false, error: 'Vendor context required' });
      }

      const item = await CatalogItem.create({
        ...req.body,
        vendorId,
      });

      return res.status(201).json({ success: true, data: item });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Duplicate IMPA code for this vendor',
        });
      }
      logger.error('Create catalog item error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Invalid data' });
    }
  }

  async updateCatalogueItem(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.organizationId;
      const { id } = req.params;

      if (!vendorId) {
        return res.status(403).json({ success: false, error: 'Vendor context required' });
      }

      const updated = await CatalogItem.findOneAndUpdate(
        { _id: id, vendorId },
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Item not found or not owned by vendor' });
      }

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      logger.error('Update catalogue item error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Update failed' });
    }
  }

  async deleteCatalogueItem(req: AuthRequest, res: Response) {
    try {
      const vendorId = req.user?.organizationId;
      const { id } = req.params;

      if (!vendorId) {
        return res.status(403).json({ success: false, error: 'Vendor context required' });
      }

      const deleted = await CatalogItem.findOneAndDelete({ _id: id, vendorId });

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }

      return res.json({ success: true, message: 'Catalog item deleted successfully' });
    } catch (error: any) {
      logger.error('Delete catalogue item error:', error);
      return res.status(500).json({ success: false, error: 'Failed to delete item' });
    }
  }

  // ===============================
  //     BULK CATALOG UPLOAD (UPSERT)
  // ===============================
  async uploadCatalog(req: AuthRequest, res: Response) {
    console.log('\n=== BULK CATALOG UPLOAD STARTED ===');
    console.log('User ID:', req.user?.userId);
    console.log('Vendor ID:', req.user?.organizationId);

    try {
      const vendorId = req.user?.organizationId;
      if (!vendorId) {
        return res.status(403).json({ success: false, error: 'Vendor context required' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      console.log(`File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        return res.status(400).json({ success: false, error: 'File is empty or contains no data' });
      }

      console.log(`Processing ${rows.length} rows...`);

      const stats = {
        created: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [] as string[],
      };

      const getField = (row: any, possibleNames: string[]): string => {
        for (const name of possibleNames) {
          const key = Object.keys(row).find(
            k => k.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
          );
          if (key && row[key] !== undefined && row[key] !== '') {
            return String(row[key]).trim();
          }
        }
        return '';
      };

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;

        try {
          const impaRaw = getField(row, ['IMPA', 'impa', 'Impa Code']);
          const impa = impaRaw ? impaRaw.toUpperCase() : null;

          if (!impa) {
            throw new Error('Missing required field: IMPA');
          }

          const description = getField(row, ['Description', 'description', 'Item Description']);
          if (!description) {
            throw new Error('Missing required field: Description');
          }

          const priceRaw = getField(row, ['Price', 'price', 'Unit Price']);
          const price = priceRaw ? parseFloat(priceRaw) : NaN;
          if (isNaN(price) || price < 0) {
            throw new Error('Invalid or missing price');
          }

          const itemData = {
            vendorId,
            impa,
            description,
            partNo: getField(row, ['Part No', 'PartNo', 'Part Number', 'partno']) || undefined,
            positionNo: getField(row, ['Position No', 'positionNo']) || undefined,
            alternativeNo: getField(row, ['Alternative No', 'alternativeNo']) || undefined,
            brand: getField(row, ['Brand', 'brand']) || undefined,
            model: getField(row, ['Model', 'model']) || undefined,
            category: getField(row, ['Category', 'category']) || 'General',
            dimensions: getField(row, ['Dimensions', 'dimensions']) || undefined,
            uom: getField(row, ['UoM', 'uom', 'Unit', 'Unit of Measure']) || 'PCS',
            moq: getField(row, ['MOQ', 'moq', 'Minimum Order Quantity']) || '1',
            leadTime: getField(row, ['Lead Time', 'leadTime', 'Delivery Time']) || undefined,
            price,
            currency: (getField(row, ['Currency', 'currency']) || 'USD').toUpperCase(),
            stockStatus: (() => {
              const statusRaw = getField(row, ['Stock Status', 'stockStatus', 'Status']).toLowerCase();
              if (statusRaw.includes('limited') || statusRaw.includes('low')) return 'Limited';
              if (statusRaw.includes('backorder') || statusRaw.includes('back order')) return 'Backorder';
              if (statusRaw.includes('discontinued')) return 'Discontinued';
              return 'In Stock';
            })(),
          };

          // UPSERT logic with difference checking
          const existing = await CatalogItem.findOne({ vendorId, impa });

          if (existing) {
            // Normalize values for comparison (handle null/undefined/empty strings)
            const normalize = (val: any): string => {
              if (val === null || val === undefined) return '';
              return String(val).trim();
            };

            // Check for differences between existing and new data
            const hasDifferences = 
              normalize(existing.description) !== normalize(itemData.description) ||
              normalize(existing.partNo) !== normalize(itemData.partNo) ||
              normalize(existing.positionNo) !== normalize(itemData.positionNo) ||
              normalize(existing.alternativeNo) !== normalize(itemData.alternativeNo) ||
              normalize(existing.brand) !== normalize(itemData.brand) ||
              normalize(existing.model) !== normalize(itemData.model) ||
              normalize(existing.category) !== normalize(itemData.category || 'General') ||
              normalize(existing.dimensions) !== normalize(itemData.dimensions) ||
              normalize(existing.uom) !== normalize(itemData.uom || 'PCS') ||
              normalize(existing.moq) !== normalize(itemData.moq || '1') ||
              normalize(existing.leadTime) !== normalize(itemData.leadTime) ||
              Number(existing.price) !== Number(itemData.price) ||
              normalize(existing.currency) !== normalize(itemData.currency) ||
              normalize(existing.stockStatus) !== normalize(itemData.stockStatus);

            if (hasDifferences) {
              // Update only if there are differences
              await CatalogItem.updateOne(
                { _id: existing._id },
                { $set: itemData },
                { runValidators: true }
              );
              stats.updated++;
            } else {
              // Skip if no differences
              stats.skipped++;
            }
          } else {
            // Create new item if it doesn't exist
            await CatalogItem.create(itemData);
            stats.created++;
          }
        } catch (err: any) {
          stats.failed++;
          const errorMessage = `Row ${rowNumber}: ${err.message || 'Unknown error'}`;
          stats.errors.push(errorMessage);
          console.warn(errorMessage);
        }
      }

      const message = `Upload completed: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.failed} failed`;

      const response: any = {
        success: true,
        message,
        data: stats,
      };

      if (stats.failed > 0) {
        response.errors = stats.errors;
      }

      return res.status(200).json(response);
    } catch (error: any) {
      console.error('FATAL UPLOAD ERROR:', error);
      logger.error('Catalog bulk upload failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Server error during catalog upload',
      });
    } finally {
      console.log('=== BULK CATALOG UPLOAD FINISHED ===\n');
    }
  }

  // ===============================
  //         INVENTORY ROUTE
  // ===============================
  async getInventory(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const items = await itemService.getItems(orgId, req.query);
      const inventory = items.map((item: any) => ({
        itemId: item._id,
        name: item.name,
        sku: item.sku,
        stockQuantity: item.stockQuantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
      }));

      return res.json({ success: true, data: inventory });
    } catch (error: any) {
      logger.error('Get inventory error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  // ===============================
  //      LICENSE & PAYMENT ROUTES
  // ===============================
  async getLicensePricing(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const user = await User.findById(userId);
      if (!user || !user.organizationId) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const licenses = await licenseService.getLicenses(user.organizationId.toString());
      const activeLicense = licenses.find((l: any) => l.status === 'active' && new Date(l.expiresAt) > new Date());

      if (!activeLicense || !activeLicense.pricing) {
        return res.status(404).json({ success: false, error: 'No active license with pricing found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          monthlyPrice: activeLicense.pricing.monthlyPrice,
          yearlyPrice: activeLicense.pricing.yearlyPrice,
          currency: activeLicense.pricing.currency,
        },
      });
    } catch (error: any) {
      logger.error('Get license pricing error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get license pricing' });
    }
  }

  async getLicenses(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const licenses = await licenseService.getLicenses(orgId);
      return res.json({ success: true, data: licenses });
    } catch (error: any) {
      logger.error('Get licenses error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  // ===============================
  //          BRAND ROUTES
  // ===============================
  async getBrands(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const brands = await brandService.getBrands({
        organizationId: orgId,
        includeGlobal: true,
      });
      return res.status(200).json({ success: true, data: brands });
    } catch (error: any) {
      logger.error('Get brands error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get brands' });
    }
  }

  async createBrand(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const brand = await brandService.createBrand({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        organizationId: orgId,
        isGlobal: false,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create brand error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to create brand' });
    }
  }

  // ===============================
  //        CATEGORY ROUTES
  // ===============================
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const categories = await categoryService.getCategories({
        organizationId: orgId,
        includeGlobal: true,
      });
      return res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get categories' });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const category = await categoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        organizationId: orgId,
        isGlobal: false,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create category error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to create category' });
    }
  }

  // ===============================
  //          MODEL ROUTES
  // ===============================
  async getModels(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const filters: any = {
        organizationId: orgId,
        includeGlobal: true,
      };

      if (req.query.brandId) {
        filters.brandId = req.query.brandId;
      }

      const models = await modelService.getModels(filters);
      return res.status(200).json({ success: true, data: models });
    } catch (error: any) {
      logger.error('Get models error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get models' });
    }
  }

  async createModel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const model = await modelService.createModel({
        name: req.body.name,
        description: req.body.description,
        brandId: req.body.brandId,
        createdBy: userId,
        organizationId: orgId,
        isGlobal: false,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        data: model,
        message: 'Model created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create model error:', error);
      return res.status(400).json({ success: false, error: error.message || 'Failed to create model' });
    }
  }

  // ===============================
  //          RFQ ROUTES
  // ===============================
  async getRFQs(req: AuthRequest, res: Response) {
    try {
      const vendorOrgId = req.user?.organizationId;
      if (!vendorOrgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const rfqs = await rfqService.getRFQsForVendor(vendorOrgId, req.query);
      return res.json({ success: true, data: rfqs });
    } catch (error: any) {
      logger.error('Get RFQs for vendor error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  async getRFQById(req: AuthRequest, res: Response) {
    try {
      const vendorOrgId = req.user?.organizationId;
      if (!vendorOrgId) {
        return res.status(400).json({ success: false, error: 'Organization ID required' });
      }

      const rfq = await rfqService.getRFQByIdForVendor(req.params.id, vendorOrgId);
      if (!rfq) {
        return res.status(404).json({ success: false, error: 'RFQ not found' });
      }

      return res.json({ success: true, data: rfq });
    } catch (error: any) {
      logger.error('Get RFQ by ID error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
  }

  // ===============================
  //       EMPLOYEE ROUTES
  // ===============================
  async getEmployees(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      // Extract filters from query, excluding portalType if it exists
      const filters: any = { ...req.query };
      delete filters.portalType; // Remove portalType from filters if present
      const employees = await employeeService.getEmployees(orgId, portalType, filters);
      res.json({ success: true, data: employees });
    } catch (error: any) {
      logger.error('Get employees error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEmployeesWithOnboardingStatus(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
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

      const employees = await employeeService.getEmployeesWithOnboardingStatus(orgId, portalType, filters);
      res.json({ success: true, data: employees });
    } catch (error: any) {
      logger.error('Get employees with onboarding status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createEmployee(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const employee = await employeeService.createEmployee(orgId, portalType, req.body);
      res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
      logger.error('Create employee error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async inviteEmployee(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID not found',
        });
      }

      const result = await employeeService.inviteEmployee(orgId, portalType, req.body);
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
      logger.error('Invite employee error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getEmployeeById(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const employee = await employeeService.getEmployeeById(req.params.id, orgId, portalType);
      res.json({ success: true, data: employee });
    } catch (error: any) {
      logger.error('Get employee by ID error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async updateEmployee(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const employee = await employeeService.updateEmployee(req.params.id, orgId, portalType, req.body);
      res.json({ success: true, data: employee });
    } catch (error: any) {
      logger.error('Update employee error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteEmployee(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.VENDOR;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      await employeeService.deleteEmployee(req.params.id, orgId, portalType);
      res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error: any) {
      logger.error('Delete employee error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ===============================
  //    EMPLOYEE ONBOARDING ROUTES
  // ===============================
  async getEmployeeOnboardings(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
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
      logger.error('Get employee onboardings error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEmployeeOnboardingById(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID not found',
        });
      }

      const onboarding = await employeeService.getEmployeeOnboardingById(req.params.id, orgId);
      res.json({ success: true, data: onboarding });
    } catch (error: any) {
      logger.error('Get employee onboarding by ID error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async approveEmployeeOnboarding(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const userId = req.user?.userId;
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
      logger.error('Approve employee onboarding error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to approve onboarding' });
    }
  }

  async rejectEmployeeOnboarding(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID not found',
        });
      }

      const userId = req.user?.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID not found',
        });
      }

      const { rejectionReason } = req.body;
      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
      }

      const result = await employeeService.rejectEmployeeOnboarding(req.params.id, orgId, userId, rejectionReason);
      res.json({ success: true, data: result, message: 'Onboarding rejected successfully' });
    } catch (error: any) {
      logger.error('Reject employee onboarding error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to reject onboarding' });
    }
  }

  async deleteEmployeeOnboarding(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID not found',
        });
      }

      await employeeService.deleteEmployeeOnboarding(req.params.id, orgId);
      res.json({ success: true, message: 'Onboarding deleted successfully' });
    } catch (error: any) {
      logger.error('Delete employee onboarding error:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to delete onboarding' });
    }
  }
}

export const vendorPortalController = new VendorPortalController();