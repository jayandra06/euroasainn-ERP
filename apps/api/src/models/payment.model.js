import mongoose, { Schema } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentType;
(function (PaymentType) {
    PaymentType["SUBSCRIPTION"] = "subscription";
    PaymentType["ONE_TIME"] = "one_time";
    PaymentType["RENEWAL"] = "renewal";
})(PaymentType || (PaymentType = {}));
const PaymentSchema = new Schema({
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
    portalType: {
        type: String,
        enum: Object.values(PortalType),
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    paymentType: {
        type: String,
        enum: Object.values(PaymentType),
        required: true,
        default: PaymentType.SUBSCRIPTION,
    },
    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        required: true,
        default: PaymentStatus.PENDING,
        index: true,
    },
    paymentMethod: {
        type: String,
    },
    transactionId: {
        type: String,
        index: true,
    },
    paymentGateway: {
        type: String,
    },
    gatewayResponse: {
        type: Schema.Types.Mixed,
    },
    description: {
        type: String,
    },
    subscriptionPeriod: {
        startDate: { type: Date },
        endDate: { type: Date },
    },
    licenseId: {
        type: Schema.Types.ObjectId,
        ref: 'License',
        index: true,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
}, {
    timestamps: true,
});
PaymentSchema.index({ organizationId: 1, status: 1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
export const Payment = mongoose.model('Payment', PaymentSchema);
//# sourceMappingURL=payment.model.js.map