import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeOnboarding extends Document {
  employeeId?: mongoose.Types.ObjectId;
  invitationToken: string;
  organizationId: mongoose.Types.ObjectId;
  
  // Basic Information
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string; // Country code for phone (e.g., +91, +1)
  profilePhoto?: string; // File path or URL
  
  // Address
  country: string;
  state: string;
  city: string;
  zipCode: string;
  addressLine1?: string;
  addressLine2?: string;
  
  // Bank Details
  accountNumber: string;
  ifscOrSwift: string;
  bankName: string;
  
  // Identity Documents (country-based)
  identityDocumentType?: string; // Selected identity document type (e.g., 'aadhaar', 'pan', 'passport', 'drivingLicense', 'ssn', 'nationalId')
  passport?: string; // File path or URL
  nationalId?: string; // File path or URL (Aadhaar for India, National ID for other countries)
  drivingLicense?: string; // File path or URL
  pan?: string; // File path or URL (PAN for India)
  ssn?: string; // File path or URL (SSN for USA)
  
  // Payment Identity (separate from identity documents)
  paymentIdentityType?: string; // Payment identity type (e.g., 'pan', 'taxId', 'ssn')
  paymentIdentityDocument?: string; // File path or URL for payment identity document
  
  // Nominee Details
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  nomineePhoneCountryCode?: string; // Country code for nominee phone (e.g., +91, +1)
  
  // Status
  status: 'submitted' | 'approved' | 'rejected';
  
  // Timestamps
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  approvedBy?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeOnboardingSchema = new Schema<IEmployeeOnboarding>(
  {
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
  },
  {
    timestamps: true,
  }
);

EmployeeOnboardingSchema.index({ employeeId: 1 });
EmployeeOnboardingSchema.index({ invitationToken: 1 });
EmployeeOnboardingSchema.index({ organizationId: 1, status: 1 });
EmployeeOnboardingSchema.index({ email: 1 });

export const EmployeeOnboarding = mongoose.model<IEmployeeOnboarding>('EmployeeOnboarding', EmployeeOnboardingSchema);

