import { RolePayrollStructure } from '../models/role-payroll-structure.model';
import { Role } from '../models/role.model';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
// Helper function to calculate payroll totals from base and percentages
function calculatePayrollTotals(payroll) {
    const base = payroll.base || 0;
    // Calculate amounts from percentages
    const hra = base * ((payroll.hraPercent || 0) / 100);
    const ta = base * ((payroll.taPercent || 0) / 100);
    const da = base * ((payroll.daPercent || 0) / 100);
    // Calculate Gross Salary (base + calculated allowances + absolute additions)
    const grossSalary = base +
        hra +
        ta +
        da +
        (payroll.sa || 0) +
        (payroll.incentives || 0) +
        (payroll.miscAddons || 0);
    // Calculate deductions from percentages (based on base or gross, typically base)
    // PF and TDS are usually calculated on base salary
    const pf = base * ((payroll.pfPercent || 0) / 100);
    const tds = base * ((payroll.tdsPercent || 0) / 100);
    // Total deductions (percentage-based + absolute)
    const totalDeductions = pf +
        tds +
        (payroll.insurance || 0) +
        (payroll.salaryAdvance || 0);
    // Calculate Net Salary
    const netSalary = grossSalary - totalDeductions;
    return { hra, ta, da, pf, tds, grossSalary, netSalary };
}
export class RolePayrollStructureService {
    async getPayrollStructures(organizationId) {
        const structures = await RolePayrollStructure.find({ organizationId })
            .populate('roleId', 'name description')
            .sort({ createdAt: -1 });
        return structures;
    }
    async getPayrollStructureByRole(organizationId, roleId) {
        const structure = await RolePayrollStructure.findOne({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            roleId: new mongoose.Types.ObjectId(roleId),
        }).populate('roleId', 'name description');
        if (!structure) {
            throw new Error('Payroll structure not found for this role');
        }
        return structure;
    }
    async createOrUpdatePayrollStructure(organizationId, roleId, payrollStructure) {
        // Calculate totals and amounts from percentages
        const { hra, ta, da, pf, tds, grossSalary, netSalary } = calculatePayrollTotals(payrollStructure);
        // Prepare the payroll structure with calculated values
        const structureData = {
            ...payrollStructure,
            hra, // Calculated amount
            ta, // Calculated amount
            da, // Calculated amount
            pf, // Calculated amount
            tds, // Calculated amount
            grossSalary,
            netSalary,
        };
        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            throw new Error('Role not found');
        }
        // Use findOneAndUpdate with upsert to create or update
        const structure = await RolePayrollStructure.findOneAndUpdate({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            roleId: new mongoose.Types.ObjectId(roleId),
        }, {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            roleId: new mongoose.Types.ObjectId(roleId),
            payrollStructure: structureData,
            isActive: true,
        }, {
            new: true,
            upsert: true,
            runValidators: true,
        }).populate('roleId', 'name description');
        logger.info(`Payroll structure ${structure._id ? 'updated' : 'created'} for role ${roleId} in organization ${organizationId}`);
        return structure;
    }
    async deletePayrollStructure(organizationId, roleId) {
        const structure = await RolePayrollStructure.findOneAndDelete({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            roleId: new mongoose.Types.ObjectId(roleId),
        });
        if (!structure) {
            throw new Error('Payroll structure not found');
        }
        return { success: true };
    }
    async togglePayrollStructureStatus(organizationId, roleId, isActive) {
        const structure = await RolePayrollStructure.findOneAndUpdate({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            roleId: new mongoose.Types.ObjectId(roleId),
        }, { isActive }, { new: true }).populate('roleId', 'name description');
        if (!structure) {
            throw new Error('Payroll structure not found');
        }
        return structure;
    }
}
export const rolePayrollStructureService = new RolePayrollStructureService();
//# sourceMappingURL=role-payroll-structure.service.js.map