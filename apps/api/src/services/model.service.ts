import { Model, IModel } from '../models/model.model';
import { logger } from '../config/logger';

export class ModelService {
  async createModel(data: {
    name: string;
    description?: string;
    brandId?: string;
    createdBy?: string;
    organizationId?: string;
    isGlobal?: boolean;
    status?: 'active' | 'pending';
  }) {
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

  async getModels(filters?: { status?: string; organizationId?: string; brandId?: string; includeGlobal?: boolean }) {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.brandId) {
      query.brandId = filters.brandId;
    }

    // If organizationId is provided, show global models + organization-specific models
    if (filters?.organizationId) {
      query.$or = [
        { isGlobal: true },
        { organizationId: filters.organizationId },
      ];
    } else if (filters?.includeGlobal === false) {
      // Only show organization-specific models
      query.isGlobal = false;
      if (filters.organizationId) {
        query.organizationId = filters.organizationId;
      }
    } else {
      // Default: show all models (for admin portal)
    }

    return await Model.find(query)
      .populate('createdBy', 'email firstName lastName')
      .populate('organizationId', 'name')
      .populate('brandId', 'name')
      .sort({ createdAt: -1 });
  }

  async getModelById(modelId: string) {
    const model = await Model.findById(modelId)
      .populate('createdBy', 'email firstName lastName')
      .populate('organizationId', 'name')
      .populate('brandId', 'name');
    if (!model) {
      throw new Error('Model not found');
    }
    return model;
  }

  async updateModel(modelId: string, data: Partial<IModel>) {
    const model = await Model.findById(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    Object.assign(model, data);
    await model.save();
    return model;
  }

  async deleteModel(modelId: string) {
    const model = await Model.findByIdAndDelete(modelId);
    if (!model) {
      throw new Error('Model not found');
    }
    return { success: true };
  }

  async approveModel(modelId: string) {
    const model = await Model.findById(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    model.status = 'active';
    await model.save();
    logger.info(`Model approved: ${model.name}`);
    return model;
  }

  async rejectModel(modelId: string) {
    const model = await Model.findByIdAndDelete(modelId);
    if (!model) {
      throw new Error('Model not found');
    }
    return { success: true };
  }
}

export const modelService = new ModelService();

