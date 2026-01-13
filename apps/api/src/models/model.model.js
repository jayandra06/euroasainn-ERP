import mongoose, { Schema } from 'mongoose';
const ModelSchema = new Schema({
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
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        index: true,
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
        default: true, // Admin-created models are global by default
        index: true,
    },
}, {
    timestamps: true,
});
ModelSchema.index({ name: 1, isGlobal: 1 });
ModelSchema.index({ organizationId: 1, status: 1 });
ModelSchema.index({ brandId: 1 });
ModelSchema.index({ status: 1 });
export const Model = mongoose.model('Model', ModelSchema);
//# sourceMappingURL=model.model.js.map