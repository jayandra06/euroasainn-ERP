import mongoose from 'mongoose';
import { ICategory } from '../models/category.model';
export declare class CategoryService {
    createCategory(data: {
        name: string;
        description?: string;
        createdBy?: string;
        organizationId?: string;
        isGlobal?: boolean;
        status?: 'active' | 'pending';
    }): Promise<mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getCategories(filters?: {
        status?: string;
        organizationId?: string;
        includeGlobal?: boolean;
        skipPopulate?: boolean;
    }): Promise<(mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getCategoryById(categoryId: string): Promise<mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateCategory(categoryId: string, data: Partial<ICategory>): Promise<mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteCategory(categoryId: string): Promise<{
        success: boolean;
    }>;
    approveCategory(categoryId: string): Promise<mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    rejectCategory(categoryId: string): Promise<{
        success: boolean;
    }>;
}
export declare const categoryService: CategoryService;
//# sourceMappingURL=category.service.d.ts.map