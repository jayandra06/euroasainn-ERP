import { IRolePayrollStructure, IPayrollStructure } from '../models/role-payroll-structure.model';
import mongoose from 'mongoose';
export declare class RolePayrollStructureService {
    getPayrollStructures(organizationId: string): Promise<(mongoose.Document<unknown, {}, IRolePayrollStructure, {}, {}> & IRolePayrollStructure & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getPayrollStructureByRole(organizationId: string, roleId: string): Promise<mongoose.Document<unknown, {}, IRolePayrollStructure, {}, {}> & IRolePayrollStructure & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    createOrUpdatePayrollStructure(organizationId: string, roleId: string, payrollStructure: Partial<IPayrollStructure>): Promise<mongoose.Document<unknown, {}, IRolePayrollStructure, {}, {}> & IRolePayrollStructure & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deletePayrollStructure(organizationId: string, roleId: string): Promise<{
        success: boolean;
    }>;
    togglePayrollStructureStatus(organizationId: string, roleId: string, isActive: boolean): Promise<mongoose.Document<unknown, {}, IRolePayrollStructure, {}, {}> & IRolePayrollStructure & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
}
export declare const rolePayrollStructureService: RolePayrollStructureService;
//# sourceMappingURL=role-payroll-structure.service.d.ts.map