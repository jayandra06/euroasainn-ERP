import mongoose, { Schema } from 'mongoose';
const CustomerOnboardingSchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        index: true,
    },
    invitationToken: {
        type: String,
        index: true,
    },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, index: true },
    mobileCountryCode: { type: String, required: true },
    mobilePhone: { type: String, required: true },
    deskCountryCode: { type: String, required: true },
    deskPhone: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    vessels: { type: Number, required: true, min: 1 },
    taxId: { type: String, required: true },
    accountName: { type: String, required: true },
    bankName: { type: String, required: true },
    iban: { type: String, required: true },
    swift: { type: String },
    invoiceEmail: { type: String, required: true },
    billingAddress1: { type: String, required: true },
    billingAddress2: { type: String },
    billingCity: { type: String, required: true },
    billingProvince: { type: String, required: true },
    billingPostal: { type: String, required: true },
    billingCountry: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed', 'approved', 'rejected'],
        default: 'pending',
        index: true,
    },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
}, {
    timestamps: true,
});
CustomerOnboardingSchema.index({ organizationId: 1, status: 1 });
CustomerOnboardingSchema.index({ email: 1 });
CustomerOnboardingSchema.index({ invitationToken: 1 });
export const CustomerOnboarding = mongoose.model('CustomerOnboarding', CustomerOnboardingSchema);
//# sourceMappingURL=customer-onboarding.model.js.map