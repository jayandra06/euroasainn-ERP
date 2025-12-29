import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollStructure {
  // Base Salary (absolute value)
  base?: number;
  
  // Percentage-based allowances (calculated from base)
  hraPercent?: number; // House Rent Allowance %
  taPercent?: number; // Travel Allowance %
  daPercent?: number; // Dearness Allowance %
  
  // Absolute value additions
  incentives?: number;
  
  // Percentage-based deductions (calculated from base or gross)
  pfPercent?: number; // Provident Fund %
  tdsPercent?: number; // Tax Deducted at Source %
  
  // Optional absolute value fields (for backward compatibility or additional fields)
  sa?: number; // Special Allowance (absolute)
  miscAddons?: number; // Miscellaneous Add-ons (absolute)
  insurance?: number; // Insurance (absolute)
  salaryAdvance?: number; // Salary Advance (absolute)
  
  // Calculated fields (computed from base and percentages)
  hra?: number; // Calculated HRA amount
  ta?: number; // Calculated TA amount
  da?: number; // Calculated DA amount
  pf?: number; // Calculated PF amount
  tds?: number; // Calculated TDS amount
  grossSalary?: number; // Sum of all credits
  netSalary?: number; // Gross Salary - Sum of all debits
}

export interface IRolePayrollStructure extends Document {
  organizationId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  payrollStructure: IPayrollStructure;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RolePayrollStructureSchema = new Schema<IRolePayrollStructure>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    payrollStructure: {
      // Base Salary (absolute)
      base: { type: Number, default: 0 },
      
      // Percentage-based fields
      hraPercent: { type: Number, default: 0 },
      taPercent: { type: Number, default: 0 },
      daPercent: { type: Number, default: 0 },
      pfPercent: { type: Number, default: 0 },
      tdsPercent: { type: Number, default: 0 },
      
      // Absolute value fields
      incentives: { type: Number, default: 0 },
      
      // Optional absolute fields
      sa: { type: Number, default: 0 },
      miscAddons: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      salaryAdvance: { type: Number, default: 0 },
      
      // Calculated amounts (from percentages)
      hra: { type: Number, default: 0 },
      ta: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      
      // Calculated totals
      grossSalary: { type: Number, default: 0 },
      netSalary: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one payroll structure per role per organization
RolePayrollStructureSchema.index({ organizationId: 1, roleId: 1 }, { unique: true });

export const RolePayrollStructure = mongoose.model<IRolePayrollStructure>(
  'RolePayrollStructure',
  RolePayrollStructureSchema
);

