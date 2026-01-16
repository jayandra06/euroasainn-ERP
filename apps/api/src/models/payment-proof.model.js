import mongoose, { Schema } from 'mongoose';
const PaymentProofSchema = new Schema({
    rfqId: {
        type: Schema.Types.ObjectId,
        ref: 'RFQ',
        required: true,
        index: true,
    },
    quotationId: {
        type: Schema.Types.ObjectId,
        ref: 'Quotation',
        required: true,
        index: true,
    },
    customerOrganizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    vendorOrganizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    paymentAmount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'USD',
    },
    paymentDate: {
        type: Date,
        required: true,
    },
    paymentMethod: {
        type: String,
    },
    transactionReference: {
        type: String,
    },
    proofDocuments: [
        {
            fileName: String,
            fileUrl: String,
            fileType: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    status: {
        type: String,
        enum: ['pending', 'submitted', 'verified', 'approved'],
        default: 'submitted',
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    verifiedAt: {
        type: Date,
    },
    approvedAt: {
        type: Date,
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    shippingOption: {
        type: String,
        enum: ['self', 'vendor-managed'],
    },
    shippingSelectedAt: {
        type: Date,
    },
    awbTrackingNumber: {
        type: String,
    },
    shippingContactName: {
        type: String,
    },
    shippingContactEmail: {
        type: String,
    },
    shippingContactPhone: {
        type: String,
    },
    // Vendor-managed shipping details (submitted by vendor)
    vendorAWBTrackingNumber: {
        type: String,
    },
    vendorShippingContactName: {
        type: String,
    },
    vendorShippingContactEmail: {
        type: String,
    },
    vendorShippingContactPhone: {
        type: String,
    },
    vendorShippingSubmittedAt: {
        type: Date,
    },
    vendorShippingSubmittedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Index for efficient queries
PaymentProofSchema.index({ rfqId: 1, quotationId: 1 });
PaymentProofSchema.index({ customerOrganizationId: 1 });
PaymentProofSchema.index({ vendorOrganizationId: 1 });
export const PaymentProof = mongoose.model('PaymentProof', PaymentProofSchema);
//# sourceMappingURL=payment-proof.model.js.map