import mongoose from 'mongoose';
import { IBrand } from '../models/brand.model';
export declare class BrandService {
    createBrand(data: {
        name: string;
        description?: string;
        createdBy?: string;
        organizationId?: string;
        isGlobal?: boolean;
        status?: 'active' | 'pending';
    }): Promise<mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getBrands(filters?: {
        status?: string;
        organizationId?: string;
        includeGlobal?: boolean;
        skipPopulate?: boolean;
    }): Promise<(mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getBrandById(brandId: string): Promise<mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateBrand(brandId: string, data: Partial<IBrand>): Promise<mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteBrand(brandId: string): Promise<{
        success: boolean;
    }>;
    approveBrand(brandId: string): Promise<mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    rejectBrand(brandId: string): Promise<{
        success: boolean;
    }>;
}
export declare const brandService: BrandService;
//# sourceMappingURL=brand.service.d.ts.map