import mongoose, { Schema } from 'mongoose';
const BusinessUnitSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    code: {
        type: String,
        index: true,
    },
    description: {
        type: String,
        trim: true,
    },
    parentUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'BusinessUnit',
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
BusinessUnitSchema.index({ organizationId: 1 });
BusinessUnitSchema.index({ parentUnitId: 1 });
export const BusinessUnit = mongoose.model('BusinessUnit', BusinessUnitSchema);
//# sourceMappingURL=business-unit.model.js.map