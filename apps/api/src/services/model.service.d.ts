import mongoose from 'mongoose';
import { IModel } from '../models/model.model';
export declare class ModelService {
    createModel(data: {
        name: string;
        description?: string;
        brandId?: string;
        createdBy?: string;
        organizationId?: string;
        isGlobal?: boolean;
        status?: 'active' | 'pending';
    }): Promise<mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getModels(filters?: {
        status?: string;
        organizationId?: string;
        brandId?: string;
        includeGlobal?: boolean;
        skipPopulate?: boolean;
    }): Promise<(mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getModelById(modelId: string): Promise<mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateModel(modelId: string, data: Partial<IModel>): Promise<mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteModel(modelId: string): Promise<{
        success: boolean;
    }>;
    approveModel(modelId: string): Promise<mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    rejectModel(modelId: string): Promise<{
        success: boolean;
    }>;
}
export declare const modelService: ModelService;
//# sourceMappingURL=model.service.d.ts.map