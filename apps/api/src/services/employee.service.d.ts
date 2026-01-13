import { IEmployee, IPayrollDetails } from '../models/employee.model';
import mongoose from 'mongoose';
export declare class EmployeeService {
    createEmployee(organizationId: string, data: Partial<IEmployee>): Promise<mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getEmployees(organizationId: string, filters?: any): Promise<(mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getEmployeesWithOnboardingStatus(organizationId: string, filters?: {
        status?: string;
    }): Promise<{
        onboardingStatus: any;
        onboarding: any;
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
        _id: unknown;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: mongoose.Collection;
        db: mongoose.Connection;
        errors?: mongoose.Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: mongoose.Schema;
        __v: number;
    }[]>;
    getEmployeeById(employeeId: string, organizationId: string): Promise<mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateEmployee(employeeId: string, organizationId: string, data: Partial<IEmployee>): Promise<mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteEmployee(employeeId: string, organizationId: string): Promise<{
        success: boolean;
    }>;
    inviteEmployee(organizationId: string, data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        role?: string;
        employeeType?: string;
        accessLevel?: string;
        businessUnitId?: string;
        payrollDetails?: Partial<IPayrollDetails>;
    }): Promise<{
        employee: mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        emailSent: boolean;
        invitationLink: string | undefined;
    }>;
    completeEmployeeOnboarding(token: string, password: string): Promise<{
        success: boolean;
        user: any;
        employee: mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        message: string;
    }>;
    submitEmployeeOnboardingForm(token: string, data: {
        fullName: string;
        phone: string;
        country: string;
        state: string;
        city: string;
        zipCode: string;
        addressLine1?: string;
        addressLine2?: string;
        accountNumber: string;
        ifscOrSwift: string;
        bankName: string;
        passport?: string;
        nationalId?: string;
        drivingLicense?: string;
        pan?: string;
        ssn?: string;
        nomineeName?: string;
        nomineeRelation?: string;
        nomineePhone?: string;
    }): Promise<{
        success: boolean;
        onboarding: mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        message: string;
    }>;
    getEmployeeOnboardingByToken(token: string): Promise<{
        invitation: {
            email: string;
            token: string;
            expiresAt: Date;
            fullName: string | null;
            phone: string | null;
        };
        onboarding: (mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
    }>;
    getEmployeeOnboardings(organizationId: string, filters?: {
        status?: string;
    }): Promise<(mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getEmployeeOnboardingById(onboardingId: string, organizationId: string): Promise<mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    approveEmployeeOnboarding(onboardingId: string, organizationId: string, approvedBy: string, _remarks?: string): Promise<{
        success: boolean;
        onboarding: mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        user: any;
        employee: (mongoose.Document<unknown, {}, IEmployee, {}, {}> & IEmployee & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }) | null;
        message: string;
    }>;
    rejectEmployeeOnboarding(onboardingId: string, organizationId: string, rejectedBy: string, rejectionReason?: string): Promise<{
        success: boolean;
        onboarding: mongoose.Document<unknown, {}, import("../models/employee-onboarding.model").IEmployeeOnboarding, {}, {}> & import("../models/employee-onboarding.model").IEmployeeOnboarding & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        message: string;
    }>;
    deleteEmployeeOnboarding(onboardingId: string, organizationId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const employeeService: EmployeeService;
//# sourceMappingURL=employee.service.d.ts.map