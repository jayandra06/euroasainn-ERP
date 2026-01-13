import mongoose, { Schema } from 'mongoose';
const RolePayrollStructureSchema = new Schema({
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
}, {
    timestamps: true,
});
// Ensure one payroll structure per role per organization
RolePayrollStructureSchema.index({ organizationId: 1, roleId: 1 }, { unique: true });
export const RolePayrollStructure = mongoose.model('RolePayrollStructure', RolePayrollStructureSchema);
//# sourceMappingURL=role-payroll-structure.model.js.map