import mongoose, { Schema } from 'mongoose';
const RFQSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    rfqNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        default: 'draft',
        index: true,
    },
    dueDate: {
        type: Date,
    },
    vesselId: {
        type: Schema.Types.ObjectId,
        ref: 'Vessel',
    },
    brand: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    categories: {
        type: [String],
        default: [],
    },
    supplyPort: {
        type: String,
        trim: true,
    },
    senderType: {
        type: String,
        enum: ['admin', 'customer'],
        required: true,
        index: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    recipientVendorIds: {
        type: [Schema.Types.ObjectId],
        ref: 'Organization',
        required: true,
        default: [],
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
RFQSchema.index({ organizationId: 1, status: 1 });
RFQSchema.index({ rfqNumber: 1 });
RFQSchema.index({ senderType: 1, senderId: 1 });
RFQSchema.index({ recipientVendorIds: 1 }); // For vendor queries
export const RFQ = mongoose.model('RFQ', RFQSchema);
//# sourceMappingURL=rfq.model.js.map