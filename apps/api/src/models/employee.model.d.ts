import mongoose, { Document } from 'mongoose';
export interface IPayrollDetails {
    base?: number;
    hra?: number;
    ta?: number;
    da?: number;
    sa?: number;
    incentives?: number;
    miscAddons?: number;
    pf?: number;
    tds?: number;
    insurance?: number;
    salaryAdvance?: number;
    grossSalary?: number;
    netSalary?: number;
}
export interface IEmployee extends Document {
    organizationId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    position?: string;
    department?: string;
    role?: string;
    businessUnitId?: mongoose.Types.ObjectId;
    payrollDetails?: IPayrollDetails;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Employee: mongoose.Model<IEmployee, {}, {}, {}, mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=employee.model.d.ts.map