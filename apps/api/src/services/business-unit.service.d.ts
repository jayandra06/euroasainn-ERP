import { IBusinessUnit } from '../models/business-unit.model';
export declare class BusinessUnitService {
    createBusinessUnit(organizationId: string, data: Partial<IBusinessUnit>): Promise<import("mongoose").Document<unknown, {}, IBusinessUnit, {}, {}> & IBusinessUnit & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getBusinessUnits(organizationId: string, filters?: any): Promise<(import("mongoose").Document<unknown, {}, IBusinessUnit, {}, {}> & IBusinessUnit & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getBusinessUnitById(unitId: string, organizationId: string): Promise<import("mongoose").Document<unknown, {}, IBusinessUnit, {}, {}> & IBusinessUnit & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateBusinessUnit(unitId: string, organizationId: string, data: Partial<IBusinessUnit>): Promise<import("mongoose").Document<unknown, {}, IBusinessUnit, {}, {}> & IBusinessUnit & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteBusinessUnit(unitId: string, organizationId: string): Promise<{
        success: boolean;
    }>;
}
export declare const businessUnitService: BusinessUnitService;
//# sourceMappingURL=business-unit.service.d.ts.map