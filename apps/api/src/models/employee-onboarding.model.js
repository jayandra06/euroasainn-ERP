import mongoose, { Schema } from 'mongoose';
const EmployeeOnboardingSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        index: true,
    },
    invitationToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    phoneCountryCode: {
        type: String,
        required: true,
        trim: true,
        default: '+1',
    },
    profilePhoto: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    zipCode: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine1: {
        type: String,
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true,
    },
    ifscOrSwift: {
        type: String,
        required: true,
        trim: true,
    },
    bankName: {
        type: String,
        required: true,
        trim: true,
    },
    passport: {
        type: String,
        trim: true,
    },
    nationalId: {
        type: String,
        trim: true,
    },
    drivingLicense: {
        type: String,
        trim: true,
    },
    pan: {
        type: String,
        trim: true,
    },
    ssn: {
        type: String,
        trim: true,
    },
    identityDocumentType: {
        type: String,
        trim: true,
    },
    paymentIdentityType: {
        type: String,
        trim: true,
    },
    paymentIdentityDocument: {
        type: String,
        trim: true,
    },
    nomineeName: {
        type: String,
        trim: true,
    },
    nomineeRelation: {
        type: String,
        trim: true,
    },
    nomineePhone: {
        type: String,
        trim: true,
    },
    nomineePhoneCountryCode: {
        type: String,
        trim: true,
        default: '+1',
    },
    status: {
        type: String,
        enum: ['submitted', 'approved', 'rejected'],
        default: 'submitted',
        index: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    approvedAt: {
        type: Date,
    },
    rejectedAt: {
        type: Date,
    },
    rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
EmployeeOnboardingSchema.index({ employeeId: 1 });
EmployeeOnboardingSchema.index({ invitationToken: 1 });
EmployeeOnboardingSchema.index({ organizationId: 1, status: 1 });
EmployeeOnboardingSchema.index({ email: 1 });
export const EmployeeOnboarding = mongoose.model('EmployeeOnboarding', EmployeeOnboardingSchema);
//# sourceMappingURL=employee-onboarding.model.js.map