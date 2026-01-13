import mongoose, { Document } from 'mongoose';
export interface IPayrollStructure {
    base?: number;
    hraPercent?: number;
    taPercent?: number;
    daPercent?: number;
    incentives?: number;
    pfPercent?: number;
    tdsPercent?: number;
    sa?: number;
    miscAddons?: number;
    insurance?: number;
    salaryAdvance?: number;
    hra?: number;
    ta?: number;
    da?: number;
    pf?: number;
    tds?: number;
    grossSalary?: number;
    netSalary?: number;
}
export interface IRolePayrollStructure extends Document {
    organizationId: mongoose.Types.ObjectId;
    roleId: mongoose.Types.ObjectId;
    payrollStructure: IPayrollStructure;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RolePayrollStructure: mongoose.Model<IRolePayrollStructure, {}, {}, {}, mongoose.Document<unknown, {}, IRolePayrollStructure, {}, {}> & IRolePayrollStructure & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=role-payroll-structure.model.d.ts.map