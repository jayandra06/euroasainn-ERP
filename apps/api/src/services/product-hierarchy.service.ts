import mongoose from 'mongoose';
import { Brand } from '../models/brand.model';
import { Model } from '../models/model.model';
import { Category } from '../models/category.model';
import { SubCategory } from '../models/subcategory.model';
import { Part } from '../models/part.model';
import { logger } from '../config/logger';

export interface ProductHierarchy {
  _id: string;
  name: string;
  description?: string;
  models?: Array<{
    _id: string;
    name: string;
    description?: string;
    categories?: Array<{
      _id: string;
      name: string;
      description?: string;
      subCategories?: Array<{
        _id: string;
        name: string;
        description?: string;
        parts?: Array<{
          _id: string;
          name: string;
          partNumber: string;
          description?: string;
          priceUSD: number;
          stockQuantity: number;
        }>;
      }>;
    }>;
  }>;
}

export class ProductHierarchyService {
  async getHierarchy() {
    try {
      const brands = await Brand.find({ status: 'active', isGlobal: true })
        .sort({ name: 1 })
        .lean();

      const hierarchy: ProductHierarchy[] = [];

      for (const brand of brands) {
        const models = await Model.find({
          brandId: brand._id,
          status: 'active',
          isGlobal: true,
        })
          .sort({ name: 1 })
          .lean();

        const modelData = [];

        for (const model of models) {
          const categories = await Category.find({
            status: 'active',
            isGlobal: true,
          })
            .sort({ name: 1 })
            .lean();

          const categoryData = [];

          for (const category of categories) {
            const subCategories = await SubCategory.find({
              categoryId: category._id,
              status: 'active',
              isGlobal: true,
            })
              .sort({ name: 1 })
              .lean();

            const subCategoryData = [];

            for (const subCategory of subCategories) {
              const parts = await Part.find({
                subCategoryId: subCategory._id,
                status: 'active',
                isGlobal: true,
              })
                .sort({ partNumber: 1 })
                .lean();

              subCategoryData.push({
                _id: subCategory._id.toString(),
                name: subCategory.name,
                description: subCategory.description,
                parts: parts.map((p) => ({
                  _id: p._id.toString(),
                  name: p.name,
                  partNumber: p.partNumber,
                  description: p.description,
                  priceUSD: p.priceUSD,
                  stockQuantity: p.stockQuantity,
                })),
              });
            }

            categoryData.push({
              _id: category._id.toString(),
              name: category.name,
              description: category.description,
              subCategories: subCategoryData,
            });
          }

          modelData.push({
            _id: model._id.toString(),
            name: model.name,
            description: model.description,
            categories: categoryData,
          });
        }

        hierarchy.push({
          _id: brand._id.toString(),
          name: brand.name,
          description: brand.description,
          models: modelData,
        });
      }

      return hierarchy;
    } catch (error: any) {
      logger.error('Get hierarchy error:', error);
      throw error;
    }
  }

  async createSubCategory(data: {
    name: string;
    description?: string;
    categoryId: string;
    createdBy?: string;
    organizationId?: string;
    isGlobal?: boolean;
    status?: 'active' | 'pending';
  }) {
    const subCategory = new SubCategory({
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      createdBy: data.createdBy,
      organizationId: data.organizationId,
      isGlobal: data.isGlobal ?? (data.organizationId ? false : true),
      status: data.status || (data.organizationId ? 'pending' : 'active'),
    });

    await subCategory.save();
    logger.info(`SubCategory created: ${subCategory.name}`);
    return subCategory;
  }

  async createPart(data: {
    name: string;
    partNumber: string;
    description?: string;
    priceUSD: number;
    stockQuantity: number;
    subCategoryId: string;
    createdBy?: string;
    organizationId?: string;
    isGlobal?: boolean;
    status?: 'active' | 'pending';
  }) {
    const part = new Part({
      name: data.name,
      partNumber: data.partNumber,
      description: data.description,
      priceUSD: data.priceUSD,
      stockQuantity: data.stockQuantity,
      subCategoryId: data.subCategoryId,
      createdBy: data.createdBy,
      organizationId: data.organizationId,
      isGlobal: data.isGlobal ?? (data.organizationId ? false : true),
      status: data.status || (data.organizationId ? 'pending' : 'active'),
    });

    await part.save();
    logger.info(`Part created: ${part.name} (${part.partNumber})`);
    return part;
  }

  async updateSubCategory(subCategoryId: string, data: { name?: string; description?: string }) {
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      throw new Error('SubCategory not found');
    }

    if (data.name) subCategory.name = data.name;
    if (data.description !== undefined) subCategory.description = data.description;

    await subCategory.save();
    return subCategory;
  }

  async updatePart(partId: string, data: {
    name?: string;
    partNumber?: string;
    description?: string;
    priceUSD?: number;
    stockQuantity?: number;
  }) {
    const part = await Part.findById(partId);
    if (!part) {
      throw new Error('Part not found');
    }

    if (data.name) part.name = data.name;
    if (data.partNumber) part.partNumber = data.partNumber;
    if (data.description !== undefined) part.description = data.description;
    if (data.priceUSD !== undefined) part.priceUSD = data.priceUSD;
    if (data.stockQuantity !== undefined) part.stockQuantity = data.stockQuantity;

    await part.save();
    return part;
  }

  async deleteSubCategory(subCategoryId: string) {
    // Check if subcategory has parts
    const partsCount = await Part.countDocuments({ subCategoryId });
    if (partsCount > 0) {
      throw new Error('Cannot delete subcategory with existing parts');
    }

    const subCategory = await SubCategory.findByIdAndDelete(subCategoryId);
    if (!subCategory) {
      throw new Error('SubCategory not found');
    }
    return { success: true };
  }

  async deletePart(partId: string) {
    const part = await Part.findByIdAndDelete(partId);
    if (!part) {
      throw new Error('Part not found');
    }
    return { success: true };
  }
}

export const productHierarchyService = new ProductHierarchyService();
