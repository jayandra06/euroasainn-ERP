import mongoose, { Schema } from 'mongoose';
const BrandSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'pending'],
        default: 'active',
        index: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
    },
    isGlobal: {
        type: Boolean,
        default: true, // Admin-created brands are global by default
        index: true,
    },
}, {
    timestamps: true,
});
BrandSchema.index({ name: 1, isGlobal: 1 });
BrandSchema.index({ organizationId: 1, status: 1 });
BrandSchema.index({ status: 1 });
export const Brand = mongoose.model('Brand', BrandSchema);
//# sourceMappingURL=brand.model.js.map