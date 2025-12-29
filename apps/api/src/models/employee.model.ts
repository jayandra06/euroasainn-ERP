import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollDetails {
  // Salary Credits (Additions)
  base?: number;
  hra?: number; // House Rent Allowance
  ta?: number; // Travel Allowance
  da?: number; // Dearness Allowance
  sa?: number; // Special Allowance
  incentives?: number;
  miscAddons?: number; // Miscellaneous Add-ons
  
  // Salary Debits (Deductions)
  pf?: number; // Provident Fund
  tds?: number; // Tax Deducted at Source
  insurance?: number;
  salaryAdvance?: number;
  
  // Calculated fields
  grossSalary?: number; // Sum of all credits
  netSalary?: number; // Gross Salary - Sum of all debits
}

export interface IEmployee extends Document {
  organizationId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string; // Employee role (e.g., Captain, Engineer, Deck Officer, etc.)
  businessUnitId?: mongoose.Types.ObjectId;
  payrollDetails?: IPayrollDetails;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
    },
    department: {
      type: String,
    },
    role: {
      type: String,
      trim: true,
    },
    businessUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessUnit',
    },
    payrollDetails: {
      // Salary Credits (Additions)
      base: { type: Number, default: 0 },
      hra: { type: Number, default: 0 }, // House Rent Allowance
      ta: { type: Number, default: 0 }, // Travel Allowance
      da: { type: Number, default: 0 }, // Dearness Allowance
      sa: { type: Number, default: 0 }, // Special Allowance
      incentives: { type: Number, default: 0 },
      miscAddons: { type: Number, default: 0 }, // Miscellaneous Add-ons
      
      // Salary Debits (Deductions)
      pf: { type: Number, default: 0 }, // Provident Fund
      tds: { type: Number, default: 0 }, // Tax Deducted at Source
      insurance: { type: Number, default: 0 },
      salaryAdvance: { type: Number, default: 0 },
      
      // Calculated fields
      grossSalary: { type: Number, default: 0 }, // Sum of all credits
      netSalary: { type: Number, default: 0 }, // Gross Salary - Sum of all debits
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ organizationId: 1, email: 1 });
EmployeeSchema.index({ businessUnitId: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
