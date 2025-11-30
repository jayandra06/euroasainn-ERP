import mongoose from 'mongoose';
import { Brand, IBrand } from '../models/brand.model';
import { logger } from '../config/logger';

export class BrandService {
  async createBrand(data: {
    name: string;
    description?: string;
    createdBy?: string;
    organizationId?: string;
    isGlobal?: boolean;
    status?: 'active' | 'pending';
  }) {
    // Convert string IDs to ObjectId if needed
    let createdById: any = data.createdBy;
    let organizationId: any = data.organizationId;

    try {
      if (createdById && typeof createdById === 'string' && mongoose.Types.ObjectId.isValid(createdById)) {
        createdById = new mongoose.Types.ObjectId(createdById);
      }
      if (organizationId && typeof organizationId === 'string' && mongoose.Types.ObjectId.isValid(organizationId)) {
        organizationId = new mongoose.Types.ObjectId(organizationId);
      }
    } catch (error) {
      // If conversion fails, use as-is
    }

    const brand = new Brand({
      name: data.name,
      description: data.description,
      createdBy: createdById,
      organizationId: organizationId,
      isGlobal: data.isGlobal ?? (data.organizationId ? false : true), // Vendor-created are not global by default
      status: data.status || (data.organizationId ? 'pending' : 'active'), // Vendor-created need approval
    });

    await brand.save();
    logger.info(`Brand created: ${brand.name} (${brand.isGlobal ? 'global' : 'organization-specific'})`);
    return brand;
  }

  async getBrands(filters?: { status?: string; organizationId?: string; includeGlobal?: boolean; skipPopulate?: boolean }) {
    const query: any = {};

    // If organizationId is provided, show global brands + organization-specific brands
    if (filters?.organizationId) {
      // Convert organizationId to ObjectId if it's a string
      let orgId: any = filters.organizationId;
      try {
        if (typeof orgId === 'string' && mongoose.Types.ObjectId.isValid(orgId)) {
          orgId = new mongoose.Types.ObjectId(orgId);
        }
      } catch (error) {
        // If conversion fails, use as-is
      }

      // Combine status filter with $or condition
      // MongoDB query: status='active' AND (isGlobal=true OR organizationId=orgId)
      if (filters?.status) {
        query.$and = [
          { status: filters.status },
          {
            $or: [
              { isGlobal: true },
              { organizationId: orgId },
            ],
          },
        ];
      } else {
        query.$or = [
          { isGlobal: true },
          { organizationId: orgId },
        ];
      }
    } else if (filters?.includeGlobal === false) {
      // Only show organization-specific brands
      query.isGlobal = false;
      if (filters.organizationId) {
        let orgId: any = filters.organizationId;
        try {
          if (typeof orgId === 'string' && mongoose.Types.ObjectId.isValid(orgId)) {
            orgId = new mongoose.Types.ObjectId(orgId);
          }
        } catch (error) {
          // If conversion fails, use as-is
        }
        query.organizationId = orgId;
      }
      if (filters?.status) {
        query.status = filters.status;
      }
    } else {
      // Default: show all brands (for admin portal)
      // This will show both global and organization-specific
      if (filters?.status) {
        query.status = filters.status;
      }
    }

    let queryBuilder = Brand.find(query);
    
    // Only populate if needed (for admin portal display)
    if (!filters?.skipPopulate) {
      queryBuilder = queryBuilder
        .populate('createdBy', 'email firstName lastName')
        .populate('organizationId', 'name');
    }
    
    // Sort alphabetically for dropdowns, or by creation date for admin
    if (filters?.skipPopulate) {
      queryBuilder = queryBuilder.sort({ name: 1 }); // Alphabetical for dropdowns
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 }); // Newest first for admin
    }
    
    const brands = await queryBuilder;
    
    // Debug logging for customer portal queries
    if (filters?.skipPopulate && filters?.organizationId) {
      logger.info(`getBrands for customer portal - orgId: ${filters.organizationId}, query: ${JSON.stringify(query)}, found ${brands.length} brands`);
      const globalCount = brands.filter(b => b.isGlobal === true).length;
      const orgSpecificCount = brands.filter(b => b.isGlobal === false).length;
      logger.info(`  - Global brands: ${globalCount}, Organization-specific: ${orgSpecificCount}`);
    }
    
    return brands;
  }

  async getBrandById(brandId: string) {
    const brand = await Brand.findById(brandId)
      .populate('createdBy', 'email firstName lastName')
      .populate('organizationId', 'name');
    if (!brand) {
      throw new Error('Brand not found');
    }
    return brand;
  }

  async updateBrand(brandId: string, data: Partial<IBrand>) {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    Object.assign(brand, data);
    await brand.save();
    return brand;
  }

  async deleteBrand(brandId: string) {
    const brand = await Brand.findByIdAndDelete(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }
    return { success: true };
  }

  async approveBrand(brandId: string) {
    const brand = await Brand.findById(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    brand.status = 'active';
    await brand.save();
    logger.info(`Brand approved: ${brand.name}`);
    return brand;
  }

  async rejectBrand(brandId: string) {
    const brand = await Brand.findByIdAndDelete(brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }
    return { success: true };
  }
}

export const brandService = new BrandService();

