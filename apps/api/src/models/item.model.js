import mongoose, { Schema } from 'mongoose';
const ItemSchema = new Schema({
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
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        index: true,
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
ItemSchema.index({ organizationId: 1 });
ItemSchema.index({ sku: 1 });
ItemSchema.index({ category: 1 });
export const Item = mongoose.model('Item', ItemSchema);
//# sourceMappingURL=item.model.js.map