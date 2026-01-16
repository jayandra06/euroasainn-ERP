import mongoose, { Schema } from 'mongoose';
import { LicenseStatus, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
const LicenseSchema = new Schema({
    licenseKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    organizationType: {
        type: String,
        enum: Object.values(OrganizationType),
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(LicenseStatus),
        default: LicenseStatus.ACTIVE,
        index: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
    usageLimits: {
        users: { type: Number, default: 0 },
        vessels: { type: Number, default: 0 },
        items: { type: Number, default: 0 },
        employees: { type: Number, default: 0 },
        businessUnits: { type: Number, default: 0 },
    },
    currentUsage: {
        users: { type: Number, default: 0 },
        vessels: { type: Number, default: 0 },
        items: { type: Number, default: 0 },
        employees: { type: Number, default: 0 },
        businessUnits: { type: Number, default: 0 },
    },
    pricing: {
        monthlyPrice: { type: Number, default: 0 },
        yearlyPrice: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
    },
}, {
    timestamps: true,
});
LicenseSchema.index({ organizationId: 1, status: 1 });
LicenseSchema.index({ status: 1, expiresAt: 1 });
LicenseSchema.index({ organizationType: 1, status: 1 }); // For filtering by type and status
LicenseSchema.index({ organizationId: 1, organizationType: 1 }); // For organization-specific queries
export const License = mongoose.model('License', LicenseSchema);
//# sourceMappingURL=license.model.js.map