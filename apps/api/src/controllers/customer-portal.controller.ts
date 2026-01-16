import { Request, Response } from 'express';
import { rfqService } from '../services/rfq.service';
import { vesselService } from '../services/vessel.service';
import { employeeService } from '../services/employee.service';
import { businessUnitService } from '../services/business-unit.service';
import { licenseService } from '../services/license.service';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { modelService } from '../services/model.service';
import { rolePayrollStructureService } from '../services/role-payroll-structure.service';
import { organizationService } from '../services/organization.service';
import { userService } from '../services/user.service';
import { organizationController } from './organization.controller';
import { PortalType, OrganizationType } from '../../../../packages/shared/src/types/index';
import { logger } from '../config/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { VendorOnboarding } from '../models/vendor-onboarding.model';
import { CustomerOnboarding } from '../models/customer-onboarding.model';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { RFQ } from '../models/rfq.model';
import { Vessel } from '../models/vessel.model';

export class CustomerPortalController {
  /* ===========================
     RFQ ROUTES
  =========================== */
  async getRFQs(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const rfqs = await rfqService.getRFQs(orgId, req.query);
      res.json({ success: true, data: rfqs });
    } catch (error: any) {
      logger.error('Get RFQs error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createRFQ(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
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
        'customer',
        recipientVendorIds
      );
      res.status(201).json({ success: true, data: rfq });
    } catch (error: any) {
      logger.error('Create RFQ error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getAvailableVendorsForRFQ(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const vendors = await rfqService.getAvailableVendorsForRFQ(orgId, PortalType.CUSTOMER);
      res.json({ success: true, data: vendors });
    } catch (error: any) {
      logger.error('Get available vendors error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRFQById(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const rfq = await rfqService.getRFQById(req.params.id, orgId);
      res.json({ success: true, data: rfq });
    } catch (error: any) {
      logger.error('Get RFQ by ID error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async updateRFQ(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const rfq = await rfqService.updateRFQ(req.params.id, orgId, req.body);
      res.json({ success: true, data: rfq });
    } catch (error: any) {
      logger.error('Update RFQ error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteRFQ(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      await rfqService.deleteRFQ(req.params.id, orgId);
      res.json({ success: true, message: 'RFQ deleted' });
    } catch (error: any) {
      logger.error('Delete RFQ error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async bulkUploadRFQs(req: AuthRequest, res: Response) {
    try {
      const authUser = req.user;

      if (!authUser?.organizationId) {
        return res.status(403).json({
          success: false,
          error: 'Organization context missing',
        });
      }

      if (!req.file) {
        logger.warn('Bulk upload RFQ: No file uploaded');
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const filePath = req.file.path;
      logger.info('Bulk upload RFQ started', {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath,
        mimetype: req.file.mimetype,
      });

      let workbook;
      try {
        workbook = XLSX.readFile(filePath);
      } catch (parseError: any) {
        logger.error('Bulk upload RFQ: Failed to parse file', { error: parseError.message });
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: `Failed to parse file: ${parseError.message}. Please ensure the file is a valid CSV or Excel file.`,
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        logger.warn('Bulk upload RFQ: No sheets found in file');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: 'File contains no sheets. Please ensure the file has at least one sheet with data.',
        });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        logger.warn('Bulk upload RFQ: Sheet is empty or invalid');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: 'The first sheet in the file is empty or invalid.',
        });
      }

      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
      logger.info('Bulk upload RFQ: File parsed', { rowCount: rows.length, sheetName });

      if (rows.length === 0) {
        logger.warn('Bulk upload RFQ: File is empty');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: 'Uploaded file is empty',
        });
      }

      const created: string[] = [];
      const updated: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      const getField = (row: any, names: string[]) => {
        for (const name of names) {
          if (row[name] !== undefined) return row[name];
          const match = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, '')
          );
          if (match !== undefined) return row[match];
        }
        return undefined;
      };

      // Get available vendors once
      const availableVendors = await rfqService.getAvailableVendorsForRFQ(
        authUser.organizationId,
        PortalType.CUSTOMER
      );
      const vendorMap = new Map<string, mongoose.Types.ObjectId>();
      availableVendors.forEach((vendor: any) => {
        const vendorId = vendor._id || vendor.id;
        if (vendor.name) vendorMap.set(vendor.name.toLowerCase(), new mongoose.Types.ObjectId(vendorId));
        if (vendor.email) vendorMap.set(vendor.email.toLowerCase(), new mongoose.Types.ObjectId(vendorId));
        if (vendorId) vendorMap.set(vendorId.toString(), new mongoose.Types.ObjectId(vendorId));
      });

      // Get vessels for this organization
      const vessels = await Vessel.find({ organizationId: authUser.organizationId }).select('_id name imoNumber');
      const vesselMap = new Map<string, mongoose.Types.ObjectId>();
      vessels.forEach((vessel) => {
        if (vessel.name) vesselMap.set(vessel.name.toLowerCase(), vessel._id);
        if (vessel.imoNumber) vesselMap.set(vessel.imoNumber, vessel._id);
      });

      // Process each row
      for (const [index, row] of rows.entries()) {
        const rowIndex = index + 2; // Excel rows are 1-indexed + header row
        try {
          // Extract all RFQ fields
          const vesselName = getField(row, ['vesselName', 'Vessel Name', 'vessel', 'Vessel']);
          const vesselExName = getField(row, ['vesselExName', 'Vessel Ex Name', 'vesselExName', 'exVesselName']);
          const imoNumber = getField(row, ['imoNumber', 'IMO Number', 'imo', 'IMO', 'imoNo', 'IMO No']);
          const supplyPort = getField(row, ['supplyPort', 'Supply Port', 'port', 'Port']);
          const equipmentTags = getField(row, ['equipmentTags', 'Equipment Tags', 'equipmentTags', 'equipmentTag']);
          const category = getField(row, ['category', 'Category']);
          const subCategory = getField(row, ['subCategory', 'Sub Category', 'subcategory']);
          const brand = getField(row, ['brand', 'Brand']);
          const model = getField(row, ['model', 'Model']);
          const hullNo = getField(row, ['hullNo', 'HULL No', 'hullNo', 'hull']);
          const serialNumber = getField(row, ['serialNumber', 'Serial Number', 'serialNumber', 'serial']);
          const drawingNumber = getField(row, ['drawingNumber', 'Drawing Number', 'drawingNumber', 'drawing']);
          const remarks = getField(row, ['remarks', 'Remarks', 'description', 'Description']);
          const preferredQuality = getField(row, ['preferredQuality', 'Preferred Quality', 'preferredQuality', 'quality']);
          const typeOfIncoterms = getField(row, ['typeOfIncoterms', 'Type of Incoterms', 'typeOfIncoterms', 'incoterms']);
          const typeOfLogisticContainer = getField(row, ['typeOfLogisticContainer', 'Type of Logistic Container', 'typeOfLogisticContainer', 'container']);
          const createdDate = getField(row, ['createdDate', 'Created Date', 'createdDate']);
          const leadDate = getField(row, ['leadDate', 'Lead Date', 'leadDate', 'dueDate', 'Due Date']);
          const status = getField(row, ['status', 'Status']) || 'draft';
          
          // Extract vendors (can be comma-separated or vendor1, vendor2, vendor3)
          const vendor1 = getField(row, ['vendor1', 'Vendor 1', 'vendor1']);
          const vendor2 = getField(row, ['vendor2', 'Vendor 2', 'vendor2']);
          const vendor3 = getField(row, ['vendor3', 'Vendor 3', 'vendor3']);
          const vendorsString = getField(row, ['vendors', 'Vendors', 'vendorIds', 'Vendor IDs']);
          const vendorNames = vendorsString || [vendor1, vendor2, vendor3].filter(Boolean).join(',');

          // Extract items - parse from text format (pipe or semicolon separated)
          let items: any[] = [];
          const itemsText = getField(row, ['items', 'Items', 'itemsText']);
          if (itemsText && typeof itemsText === 'string') {
            try {
              // Parse text format: each line/item separated by newline or semicolon
              // Format: itemDescription|requiredQuantity|uom|generalRemark|impaNo|partNo|altPartNo|positionNo|dimensions
              const itemLines = itemsText.split(/[\n;]/).filter((line: string) => line.trim());
              
              for (const line of itemLines) {
                const parts = line.split('|').map((p: string) => p.trim()).filter(Boolean);
                if (parts.length >= 4) {
                  // Required: itemDescription, requiredQuantity, uom, generalRemark
                  items.push({
                    itemDescription: parts[0] || '',
                    requiredQuantity: parts[1] || '',
                    uom: parts[2] || '',
                    generalRemark: parts[3] || '',
                    impaNo: parts[4] || '',
                    partNo: parts[5] || '',
                    altPartNo: parts[6] || '',
                    positionNo: parts[7] || '',
                    dimensions: parts[8] || '',
                  });
                } else if (parts.length >= 3) {
                  // If only 3 parts, assume: itemDescription|requiredQuantity|uom (generalRemark optional)
                  items.push({
                    itemDescription: parts[0] || '',
                    requiredQuantity: parts[1] || '',
                    uom: parts[2] || '',
                    generalRemark: parts[3] || 'N/A',
                    impaNo: '',
                    partNo: '',
                    altPartNo: '',
                    positionNo: '',
                    dimensions: '',
                  });
                }
              }
            } catch (e) {
              logger.warn('Bulk upload RFQ: Failed to parse items text', { row: rowIndex, error: e });
            }
          }
          
          // Alternative: Try to parse individual item fields if items column is empty
          if (items.length === 0) {
            const itemDescription = getField(row, ['itemDescription', 'Item Description', 'item1Description']);
            const requiredQuantity = getField(row, ['requiredQuantity', 'Required Quantity', 'item1Quantity']);
            const uom = getField(row, ['uom', 'UOM', 'item1UOM']);
            const generalRemark = getField(row, ['generalRemark', 'General Remark', 'item1Remark']);
            
            if (itemDescription && requiredQuantity && uom && generalRemark) {
              items.push({
                itemDescription: String(itemDescription).trim(),
                requiredQuantity: String(requiredQuantity).trim(),
                uom: String(uom).trim(),
                generalRemark: String(generalRemark).trim(),
                impaNo: getField(row, ['item1ImpaNo', 'impaNo', 'IMPA No'])?.toString().trim() || '',
                partNo: getField(row, ['item1PartNo', 'partNo', 'Part No'])?.toString().trim() || '',
                altPartNo: getField(row, ['item1AltPartNo', 'altPartNo', 'Alt Part No'])?.toString().trim() || '',
                positionNo: getField(row, ['item1PositionNo', 'positionNo', 'Position No'])?.toString().trim() || '',
                dimensions: getField(row, ['item1Dimensions', 'dimensions', 'Dimensions'])?.toString().trim() || '',
              });
            }
          }

          // Required fields validation
          if (!vesselName || !supplyPort || !category || !subCategory || !brand || !model || !preferredQuality || !typeOfIncoterms || !typeOfLogisticContainer || !leadDate || !vendorNames) {
            skipped.push(vesselName || `Row ${rowIndex}`);
            errors.push(`Row ${rowIndex}: Missing required fields (vesselName, supplyPort, category, subCategory, brand, model, preferredQuality, typeOfIncoterms, typeOfLogisticContainer, leadDate, vendors)`);
            continue;
          }

          // Generate title if not provided
          const title = getField(row, ['title', 'Title', 'rfqTitle']) || 
                        `RFQ for ${vesselName}${category ? ` - ${category}` : ''}${brand ? ` (${brand})` : ''}`;

          // Resolve vessel ID
          let vesselId: mongoose.Types.ObjectId | undefined;
          if (vesselName) {
            const vesselSearchKey = vesselName.toString().toLowerCase().trim();
            vesselId = vesselMap.get(vesselSearchKey);
          }
          if (!vesselId && imoNumber) {
            vesselId = vesselMap.get(imoNumber.toString().trim());
          }

          // Resolve vendor IDs
          const vendorIdStrings = String(vendorNames)
            .split(/[,;|]/)
            .map((v) => v.trim())
            .filter(Boolean);
          const resolvedVendorIds: mongoose.Types.ObjectId[] = [];

          for (const vendorInput of vendorIdStrings) {
            const searchKey = vendorInput.toLowerCase();
            const vendorId = vendorMap.get(searchKey);
            if (vendorId) {
              resolvedVendorIds.push(vendorId);
            } else {
              // Try to find by ObjectId
              if (mongoose.Types.ObjectId.isValid(vendorInput)) {
                const vendor = availableVendors.find(
                  (v: any) => (v._id || v.id)?.toString() === vendorInput
                );
                if (vendor) {
                  resolvedVendorIds.push(new mongoose.Types.ObjectId(vendorInput));
                }
              }
            }
          }

          if (resolvedVendorIds.length === 0) {
            skipped.push(title);
            errors.push(`Row ${rowIndex}: No valid vendors found. Vendors must be from your available vendor list.`);
            continue;
          }

          // Check if RFQ already exists (by vessel, category, brand combination)
          const existingRFQ = await RFQ.findOne({
            organizationId: authUser.organizationId,
            vesselName: vesselName.trim(),
            category: category.trim(),
            brand: brand.trim(),
            supplyPort: supplyPort.trim(),
          });

          const rfqData: any = {
            title: title.trim(),
            description: remarks?.trim() || `RFQ for ${vesselName}`,
            supplyPort: supplyPort.trim(),
            brand: brand.trim(),
            category: category.trim(),
            model: model?.trim(),
            status: status.toLowerCase().trim() || 'draft',
            recipientVendorIds: resolvedVendorIds,
            vesselName: vesselName.trim(),
            vesselExName: vesselExName?.trim(),
            imoNumber: imoNumber?.trim(),
            equipmentTags: equipmentTags?.trim(),
            subCategory: subCategory?.trim(),
            hullNo: hullNo?.trim(),
            serialNumber: serialNumber?.trim(),
            drawingNumber: drawingNumber?.trim(),
            remarks: remarks?.trim(),
            preferredQuality: preferredQuality.trim(),
            typeOfIncoterms: typeOfIncoterms.trim(),
            typeOfLogisticContainer: typeOfLogisticContainer.trim(),
            leadDate: leadDate.trim(),
            items: items.length > 0 ? items : [],
          };

          if (vesselId) rfqData.vesselId = vesselId;
          if (leadDate) {
            const parsedDate = new Date(leadDate);
            if (!isNaN(parsedDate.getTime())) {
              rfqData.dueDate = parsedDate;
            }
          }
          if (createdDate) {
            const parsedDate = new Date(createdDate);
            if (!isNaN(parsedDate.getTime())) {
              rfqData.createdDate = parsedDate;
            }
          }

          if (existingRFQ) {
            // Check if any changes needed
            const changes: any = {};
            Object.keys(rfqData).forEach((key) => {
              if (key === 'recipientVendorIds') {
                const existingIds = existingRFQ.recipientVendorIds?.map((id: any) => id.toString()).sort() || [];
                const newIds = resolvedVendorIds.map((id) => id.toString()).sort();
                if (JSON.stringify(existingIds) !== JSON.stringify(newIds)) {
                  changes.recipientVendorIds = resolvedVendorIds;
                }
              } else if (key === 'items') {
                if (JSON.stringify(existingRFQ.items || []) !== JSON.stringify(rfqData.items || [])) {
                  changes.items = rfqData.items;
                }
              } else if (existingRFQ[key]?.toString() !== rfqData[key]?.toString()) {
                changes[key] = rfqData[key];
              }
            });

            if (Object.keys(changes).length > 0) {
              Object.assign(existingRFQ, changes);
              await existingRFQ.save();
              updated.push(title);
              logger.info('Bulk upload RFQ: RFQ updated', { title, changes });
            } else {
              skipped.push(title);
              logger.info('Bulk upload RFQ: RFQ skipped (no changes)', { title });
            }
          } else {
            // Create new RFQ
            const newRFQ = await rfqService.createRFQ(
              authUser.organizationId,
              rfqData,
              'customer',
              resolvedVendorIds.map((id) => id.toString())
            );
            created.push(title);
            logger.info('Bulk upload RFQ: RFQ created', { title, rfqId: newRFQ._id });
          }
        } catch (rowError: any) {
          const title = getField(row, ['title', 'Title', 'vesselName']) || `Row ${rowIndex}`;
          skipped.push(String(title));
          errors.push(`Row ${rowIndex}: ${rowError.message || 'Failed to process'}`);
          logger.error('Bulk upload RFQ: Row error', { row: rowIndex, error: rowError.message });
        }
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      logger.info('Bulk upload RFQ completed', {
        created: created.length,
        updated: updated.length,
        skipped: skipped.length,
        errors: errors.length,
      });

      return res.status(200).json({
        success: true,
        message: 'Bulk upload completed',
        data: {
          created: created.length,
          updated: updated.length,
          skipped: skipped.length,
          details: {
            created,
            updated,
            skipped,
            errors: errors.length > 0 ? errors : undefined,
          },
        },
      });
    } catch (error: any) {
      logger.error('Bulk upload RFQ error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Bulk upload failed',
      });
    }
  }

  /* ===========================
     VESSEL ROUTES
  =========================== */
  async getVessels(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const vessels = await vesselService.getVessels(orgId);
      res.json({ success: true, data: vessels });
    } catch (error: any) {
      logger.error('Get vessels error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createVessel(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const vessel = await vesselService.createVessel(orgId, req.body);
      res.status(201).json({ success: true, data: vessel });
    } catch (error: any) {
      logger.error('Create vessel error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     EMPLOYEE ROUTES
  =========================== */
  async getEmployees(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      const portalType = req.user?.portalType || PortalType.CUSTOMER;
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
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      await employeeService.deleteEmployee(req.params.id, orgId);
      res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error: any) {
      logger.error('Delete employee error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     EMPLOYEE ONBOARDING ROUTES
  =========================== */
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
      const result = await employeeService.rejectEmployeeOnboarding(req.params.id, orgId, userId, rejectionReason);
      res.json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      logger.error('Reject employee onboarding error:', error);
      res.status(400).json({ success: false, error: error.message });
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

      const result = await employeeService.deleteEmployeeOnboarding(req.params.id, orgId);
      res.json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      logger.error('Delete employee onboarding error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     BUSINESS UNIT ROUTES
  =========================== */
  async getBusinessUnits(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const units = await businessUnitService.getBusinessUnits(orgId, req.query);
      res.json({ success: true, data: units });
    } catch (error: any) {
      logger.error('Get business units error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createBusinessUnit(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const unit = await businessUnitService.createBusinessUnit(orgId, req.body);
      res.status(201).json({ success: true, data: unit });
    } catch (error: any) {
      logger.error('Create business unit error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getBusinessUnitById(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const unit = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      res.json({ success: true, data: unit });
    } catch (error: any) {
      logger.error('Get business unit by ID error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async getBusinessUnitVessels(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const { Vessel } = await import('../models/vessel.model');
      
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
      logger.error('Get business unit vessels error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async assignVesselToBusinessUnit(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const { Vessel } = await import('../models/vessel.model');
      
      const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      if (!bu) {
        return res.status(404).json({ success: false, error: 'Business unit not found' });
      }

      const vessel = await Vessel.findOne({
        _id: req.params.vesselId,
        organizationId: orgId,
      });
      if (!vessel) {
        return res.status(404).json({ success: false, error: 'Vessel not found' });
      }

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
      logger.error('Assign vessel to business unit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async unassignVesselFromBusinessUnit(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const { Vessel } = await import('../models/vessel.model');
      
      const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      if (!bu) {
        return res.status(404).json({ success: false, error: 'Business unit not found' });
      }

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
      logger.error('Unassign vessel from business unit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBusinessUnitStaff(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      
      const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      if (!bu) {
        return res.status(404).json({ success: false, error: 'Business unit not found' });
      }

      const employees = await employeeService.getEmployees(orgId, { businessUnitId: req.params.id });
      res.json({ success: true, data: employees });
    } catch (error: any) {
      logger.error('Get business unit staff error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async assignStaffToBusinessUnit(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      if (!bu) {
        return res.status(404).json({ success: false, error: 'Business unit not found' });
      }

      const users = await userService.getUsers(PortalType.CUSTOMER, orgId);
      const user = users.find((u: any) => u._id.toString() === userId);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

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

      const existingEmployeeInOtherBU = await Employee.findOne({
        organizationId: orgId,
        email: user.email,
        businessUnitId: { $ne: req.params.id },
      });

      if (existingEmployeeInOtherBU) {
        existingEmployeeInOtherBU.businessUnitId = req.params.id as any;
        await existingEmployeeInOtherBU.save();
        return res.status(200).json({ success: true, data: existingEmployeeInOtherBU });
      }

      const employee = await employeeService.createEmployee(orgId, {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        businessUnitId: req.params.id as any,
      });

      res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
      logger.error('Assign staff to business unit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async unassignStaffFromBusinessUnit(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      
      const bu = await businessUnitService.getBusinessUnitById(req.params.id, orgId);
      if (!bu) {
        return res.status(404).json({ success: false, error: 'Business unit not found' });
      }

      const employee = await employeeService.getEmployeeById(req.params.employeeId, orgId);
      if (!employee || employee.businessUnitId?.toString() !== req.params.id) {
        return res.status(404).json({ success: false, error: 'Employee not found or not assigned to this BU' });
      }

      await employeeService.updateEmployee(req.params.employeeId, orgId, { businessUnitId: undefined });
      res.json({ success: true, message: 'Staff unassigned successfully' });
    } catch (error: any) {
      logger.error('Unassign staff from business unit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     LICENSE ROUTES
  =========================== */
  async getLicensePricing(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

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
      logger.error('Get license pricing error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get license pricing',
      });
    }
  }

  async getLicenses(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID not found',
        });
      }
      const licenses = await licenseService.getLicenses(orgId);
      res.json({ success: true, data: licenses });
    } catch (error: any) {
      logger.error('Get licenses error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     VENDOR ROUTES
  =========================== */
  async getVendors(req: AuthRequest, res: Response) {
    try {
      const requester = req.user;
      
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
      logger.error('Get vendors error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get vendors',
      });
    }
  }

  async inviteVendor(req: AuthRequest, res: Response) {
    try {
      req.body.type = OrganizationType.VENDOR;
      req.body.portalType = PortalType.VENDOR;
      
      await organizationController.createOrganization(req, res);
    } catch (error: any) {
      logger.error('Invite vendor error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to invite vendor',
      });
    }
  }

  async getVendorUsers(req: AuthRequest, res: Response) {
    try {
      const requester = req.user;
      
      if (!requester?.organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Customer organization ID is required',
        });
      }

      const vendorOrgs = await organizationService.getOrganizations(
        OrganizationType.VENDOR,
        PortalType.VENDOR,
        {
          customerOrganizationId: requester.organizationId,
          requesterPortalType: PortalType.CUSTOMER,
        }
      );

      const vendorOrgIds = vendorOrgs.map((org: any) => org._id.toString());

      if (vendorOrgIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      const filters: any = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const allVendorUsers = await userService.getUsers(PortalType.VENDOR, undefined, filters);
      
      const vendorUsers = allVendorUsers.filter((user: any) => 
        user.organizationId && vendorOrgIds.includes(user.organizationId.toString())
      );

      const vendorsWithOrgInfo = await Promise.all(
        vendorUsers.map(async (user: any) => {
          let organizationName = null;
          let onboardingStatus = 'pending';
          
          if (user.organizationId) {
            const org = await Organization.findById(user.organizationId);
            organizationName = org?.name || null;
            
            const onboarding = await VendorOnboarding.findOne({ 
              organizationId: user.organizationId 
            }).sort({ createdAt: -1 });
            
            if (onboarding) {
              onboardingStatus = onboarding.status;
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
            onboardingStatus,
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
      logger.error('Get vendor users error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get vendor users',
      });
    }
  }

  /* ===========================
     BRAND ROUTES
  =========================== */
  async getBrands(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
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
      logger.error('Get brands error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get brands',
      });
    }
  }

  async createBrand(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const brand = await brandService.createBrand({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        organizationId: orgId,
        isGlobal: false,
        status: 'pending',
      });
      res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create brand error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create brand',
      });
    }
  }

  /* ===========================
     CATEGORY ROUTES
  =========================== */
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
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
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get categories',
      });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const category = await categoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        organizationId: orgId,
        isGlobal: false,
        status: 'pending',
      });
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create category error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create category',
      });
    }
  }

  /* ===========================
     MODEL ROUTES
  =========================== */
  async getModels(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
      }
      const brandId = req.query.brandId as string;
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
      logger.error('Get models error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get models',
      });
    }
  }

  async createModel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required',
        });
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
      res.status(201).json({
        success: true,
        data: model,
        message: 'Model created successfully. It will appear after admin approval.',
      });
    } catch (error: any) {
      logger.error('Create model error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create model',
      });
    }
  }

  /* ===========================
     ROLE PAYROLL STRUCTURE ROUTES
  =========================== */
  async getRolePayrollStructures(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID is required' });
      }
      const structures = await rolePayrollStructureService.getPayrollStructures(orgId);
      res.json({ success: true, data: structures });
    } catch (error: any) {
      logger.error('Get role payroll structures error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRolePayrollStructureByRole(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID is required' });
      }
      const structure = await rolePayrollStructureService.getPayrollStructureByRole(orgId, req.params.roleId);
      res.json({ success: true, data: structure });
    } catch (error: any) {
      logger.error('Get role payroll structure by role error:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createOrUpdateRolePayrollStructure(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
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
      logger.error('Create or update role payroll structure error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateRolePayrollStructure(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
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
      logger.error('Update role payroll structure error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteRolePayrollStructure(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: 'Organization ID is required' });
      }
      await rolePayrollStructureService.deletePayrollStructure(orgId, req.params.roleId);
      res.json({ success: true, message: 'Payroll structure deleted successfully' });
    } catch (error: any) {
      logger.error('Delete role payroll structure error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async toggleRolePayrollStructureStatus(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user?.organizationId;
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
      logger.error('Toggle role payroll structure status error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /* ===========================
     CUSTOMER PROFILE / ONBOARDING ROUTES
  =========================== */
  /**
   * GET /onboarding/me
   * Fetch current logged-in customer's onboarding/profile data
   */
  async getCurrentCustomerOnboarding(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required',
        });
      }

      const onboarding = await CustomerOnboarding.findOne({ organizationId }).lean();

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          error: 'Customer onboarding profile not found',
        });
      }

      return res.json({
        success: true,
        data: onboarding,
      });
    } catch (error: any) {
      logger.error('Get customer onboarding error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch customer profile',
      });
    }
  }

  /**
   * PATCH /onboarding/me
   * Update current logged-in customer's onboarding/profile data
   */
  async updateCurrentCustomerOnboarding(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          success: false,
          error: 'Organization context required',
        });
      }

      // Convert organizationId to ObjectId
      const orgObjectId = new mongoose.Types.ObjectId(organizationId);

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
        'vessels',
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
      ];

      const updates: any = {};
      allowedFields.forEach((field) => {
        if (req.body.hasOwnProperty(field) && req.body[field] !== undefined && req.body[field] !== null && req.body[field] !== '') {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields provided for update',
        });
      }

      // Check if record exists first
      const existingRecord = await CustomerOnboarding.findOne({ organizationId: orgObjectId });
      
      let onboarding;
      if (existingRecord) {
        // Update existing record - allow partial updates
        onboarding = await CustomerOnboarding.findOneAndUpdate(
          { organizationId: orgObjectId },
          { $set: updates },
          { new: true, runValidators: false } // Skip validators for partial updates
        );
        
        if (!onboarding) {
          return res.status(500).json({
            success: false,
            error: 'Failed to update customer profile',
          });
        }
        
        logger.info(`Customer onboarding profile updated for organizationId: ${organizationId}`);
      } else {
        // Record doesn't exist - try to create with upsert
        // Note: This may fail if required fields are missing, which is expected
        try {
          onboarding = await CustomerOnboarding.findOneAndUpdate(
            { organizationId: orgObjectId },
            { 
              $set: {
                ...updates,
                organizationId: orgObjectId,
                status: 'pending',
              }
            },
            { new: true, upsert: true, runValidators: false }
          );
          
          if (onboarding) {
            logger.info(`Customer onboarding profile created for organizationId: ${organizationId}`);
          } else {
            throw new Error('Failed to create customer profile');
          }
        } catch (createError: any) {
          // If creation fails, return helpful error
          logger.error('Create customer onboarding error:', createError);
          return res.status(400).json({
            success: false,
            error: createError.message?.includes('required') 
              ? 'Please provide all required fields to create your profile. Some fields are missing.'
              : 'Customer profile not found. Please complete onboarding first.',
          });
        }
      }

      return res.json({
        success: true,
        data: onboarding,
        message: existingRecord ? 'Customer profile updated successfully' : 'Customer profile created successfully',
      });
    } catch (error: any) {
      logger.error('Update customer onboarding error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to save customer profile',
      });
    }
  }

  /**
   * POST /onboarding/logo
   * Upload customer company logo
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

      // Convert organizationId to ObjectId
      const orgObjectId = new mongoose.Types.ObjectId(organizationId);

      // Update customer onboarding with logo URL
      const updated = await CustomerOnboarding.findOneAndUpdate(
        { organizationId: orgObjectId },
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
          error: 'Customer onboarding profile not found',
        });
      }

      return res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: { logo: logoUrl },
      });
    } catch (error: any) {
      logger.error('Upload customer logo error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload logo',
      });
    }
  }
}

export const customerPortalController = new CustomerPortalController();
