import mongoose from 'mongoose';
import { Model } from '../models/model.model';
import { logger } from '../config/logger';
export class ModelService {
    async createModel(data) {
        const model = new Model({
            name: data.name,
            description: data.description,
            brandId: data.brandId,
            createdBy: data.createdBy,
            organizationId: data.organizationId,
            isGlobal: data.isGlobal ?? (data.organizationId ? false : true), // Vendor-created are not global by default
            status: data.status || (data.organizationId ? 'pending' : 'active'), // Vendor-created need approval
        });
        await model.save();
        logger.info(`Model created: ${model.name} (${model.isGlobal ? 'global' : 'organization-specific'})`);
        return model;
    }
    async getModels(filters) {
        const query = {};
        if (filters?.brandId) {
            // Convert brandId to ObjectId if it's a string
            let brandIdObj = filters.brandId;
            try {
                if (typeof brandIdObj === 'string' && mongoose.Types.ObjectId.isValid(brandIdObj)) {
                    brandIdObj = new mongoose.Types.ObjectId(brandIdObj);
                }
            }
            catch {
                // If conversion fails, use as-is
            }
            query.brandId = brandIdObj;
        }
        // If organizationId is provided, show global models + organization-specific models
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
            // Only show organization-specific models
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
            // Default: show all models (for admin portal)
            if (filters?.status) {
                query.status = filters.status;
            }
        }
        let queryBuilder = Model.find(query);
        // Only populate if needed (for admin portal display)
        if (!filters?.skipPopulate) {
            queryBuilder = queryBuilder
                .populate('createdBy', 'email firstName lastName')
                .populate('organizationId', 'name')
                .populate('brandId', 'name');
        }
        else {
            // For customer portal, we still need brandId name for filtering
            queryBuilder = queryBuilder.populate('brandId', 'name');
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
    async getModelById(modelId) {
        const model = await Model.findById(modelId)
            .populate('createdBy', 'email firstName lastName')
            .populate('organizationId', 'name')
            .populate('brandId', 'name');
        if (!model) {
            throw new Error('Model not found');
        }
        return model;
    }
    async updateModel(modelId, data) {
        const model = await Model.findById(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        Object.assign(model, data);
        await model.save();
        return model;
    }
    async deleteModel(modelId) {
        const model = await Model.findByIdAndDelete(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        return { success: true };
    }
    async approveModel(modelId) {
        const model = await Model.findById(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        model.status = 'active';
        await model.save();
        logger.info(`Model approved: ${model.name}`);
        return model;
    }
    async rejectModel(modelId) {
        const model = await Model.findByIdAndDelete(modelId);
        if (!model) {
            throw new Error('Model not found');
        }
        return { success: true };
    }
}
export const modelService = new ModelService();
//# sourceMappingURL=model.service.js.map