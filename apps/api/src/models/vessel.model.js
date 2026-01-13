import mongoose, { Schema } from 'mongoose';
const VesselSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    businessUnitId: {
        type: Schema.Types.ObjectId,
        ref: 'BusinessUnit',
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
    },
    imoNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    exVesselName: {
        type: String,
        trim: true,
    },
    flag: {
        type: String,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
VesselSchema.index({ organizationId: 1 });
VesselSchema.index({ businessUnitId: 1 });
VesselSchema.index({ imoNumber: 1 });
export const Vessel = mongoose.model('Vessel', VesselSchema);
//# sourceMappingURL=vessel.model.js.map