import { Category, ICategory } from '../models/category.model';
import { logger } from '../config/logger';

export class CategoryService {
  async createCategory(data: {
    name: string;
    description?: string;
    createdBy?: string;
    organizationId?: string;
    isGlobal?: boolean;
    status?: 'active' | 'pending';
  }) {
    const category = new Category({
      name: data.name,
      description: data.description,
      createdBy: data.createdBy,
      organizationId: data.organizationId,
      isGlobal: data.isGlobal ?? (data.organizationId ? false : true), // Vendor-created are not global by default
      status: data.status || (data.organizationId ? 'pending' : 'active'), // Vendor-created need approval
    });

    await category.save();
    logger.info(`Category created: ${category.name} (${category.isGlobal ? 'global' : 'organization-specific'})`);
    return category;
  }

  async getCategories(filters?: { status?: string; organizationId?: string; includeGlobal?: boolean }) {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    // If organizationId is provided, show global categories + organization-specific categories
    if (filters?.organizationId) {
      query.$or = [
        { isGlobal: true },
        { organizationId: filters.organizationId },
      ];
    } else if (filters?.includeGlobal === false) {
      // Only show organization-specific categories
      query.isGlobal = false;
      if (filters.organizationId) {
        query.organizationId = filters.organizationId;
      }
    } else {
      // Default: show all categories (for admin portal)
    }

    return await Category.find(query)
      .populate('createdBy', 'email firstName lastName')
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 });
  }

  async getCategoryById(categoryId: string) {
    const category = await Category.findById(categoryId)
      .populate('createdBy', 'email firstName lastName')
      .populate('organizationId', 'name');
    if (!category) {
      throw new Error('Category not found');
    }
    return category;
  }

  async updateCategory(categoryId: string, data: Partial<ICategory>) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    Object.assign(category, data);
    await category.save();
    return category;
  }

  async deleteCategory(categoryId: string) {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    return { success: true };
  }

  async approveCategory(categoryId: string) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    category.status = 'active';
    await category.save();
    logger.info(`Category approved: ${category.name}`);
    return category;
  }

  async rejectCategory(categoryId: string) {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }
    return { success: true };
  }
}

export const categoryService = new CategoryService();

