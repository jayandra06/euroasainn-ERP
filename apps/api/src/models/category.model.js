import mongoose, { Schema } from 'mongoose';
const CategorySchema = new Schema({
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
        default: true, // Admin-created categories are global by default
        index: true,
    },
}, {
    timestamps: true,
});
CategorySchema.index({ name: 1, isGlobal: 1 });
CategorySchema.index({ organizationId: 1, status: 1 });
CategorySchema.index({ status: 1 });
export const Category = mongoose.model('Category', CategorySchema);
//# sourceMappingURL=category.model.js.map