import mongoose from 'mongoose';
import { Category } from '../models/category.model';
import { logger } from '../config/logger';
export class CategoryService {
    async createCategory(data) {
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
    async getCategories(filters) {
        const query = {};
        // If organizationId is provided, show global categories + organization-specific categories
        if (filters?.organizationId) {
            // Convert organizationId to ObjectId if it's a string
            let orgId = filters.organizationId;
            try {
                if (typeof orgId === 'string' && mongoose.Types.ObjectId.isValid(orgId)) {
                    orgId = new mongoose.Types.ObjectId(orgId);
                }
            }
            catch {
                // If conversion fails, use as-is
            }
            // Combine status filter with $or condition
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
            }
            else {
                query.$or = [
                    { isGlobal: true },
                    { organizationId: orgId },
                ];
            }
        }
        else if (filters?.includeGlobal === false) {
            // Only show organization-specific categories
            query.isGlobal = false;
            if (filters.organizationId) {
                let orgId = filters.organizationId;
                try {
                    if (typeof orgId === 'string' && mongoose.Types.ObjectId.isValid(orgId)) {
                        orgId = new mongoose.Types.ObjectId(orgId);
                    }
                }
                catch (error) {
                    // If conversion fails, use as-is
                }
                query.organizationId = orgId;
            }
            if (filters?.status) {
                query.status = filters.status;
            }
        }
        else {
            // Default: show all categories (for admin portal)
            if (filters?.status) {
                query.status = filters.status;
            }
        }
        let queryBuilder = Category.find(query);
        // Only populate if needed (for admin portal display)
        if (!filters?.skipPopulate) {
            queryBuilder = queryBuilder
                .populate('createdBy', 'email firstName lastName')
                .populate('organizationId', 'name');
        }
        // Sort alphabetically for dropdowns, or by creation date for admin
        if (filters?.skipPopulate) {
            queryBuilder = queryBuilder.sort({ name: 1 }); // Alphabetical for dropdowns
        }
        else {
            queryBuilder = queryBuilder.sort({ createdAt: -1 }); // Newest first for admin
        }
        return await queryBuilder;
    }
    async getCategoryById(categoryId) {
        const category = await Category.findById(categoryId)
            .populate('createdBy', 'email firstName lastName')
            .populate('organizationId', 'name');
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }
    async updateCategory(categoryId, data) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        Object.assign(category, data);
        await category.save();
        return category;
    }
    async deleteCategory(categoryId) {
        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        return { success: true };
    }
    async approveCategory(categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        category.status = 'active';
        await category.save();
        logger.info(`Category approved: ${category.name}`);
        return category;
    }
    async rejectCategory(categoryId) {
        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) {
            throw new Error('Category not found');
        }
        return { success: true };
    }
}
export const categoryService = new CategoryService();
//# sourceMappingURL=category.service.js.map