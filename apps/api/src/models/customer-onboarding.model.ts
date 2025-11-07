import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerOnboarding extends Document {
  organizationId?: mongoose.Types.ObjectId;
  invitationToken?: string;
  
  // Company Details
  companyName: string;
  contactPerson: string;
  email: string;
  
  // Phone Numbers
  mobileCountryCode: string;
  mobilePhone: string;
  deskCountryCode: string;
  deskPhone: string;
  
  // Address
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  
  // Vessel Count
  vessels: number;
  
  // Tax Info
  taxId: string;
  
  // Banking Details
  accountName: string;
  bankName: string;
  iban: string;
  swift?: string;
  
  // Invoicing Details
  invoiceEmail: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingProvince: string;
  billingPostal: string;
  billingCountry: string;
  
  // Status
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const CustomerOnboardingSchema = new Schema<ICustomerOnboarding>(
  {
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
  },
  {
    timestamps: true,
  }
);

CustomerOnboardingSchema.index({ organizationId: 1, status: 1 });
CustomerOnboardingSchema.index({ email: 1 });
CustomerOnboardingSchema.index({ invitationToken: 1 });

export const CustomerOnboarding = mongoose.model<ICustomerOnboarding>('CustomerOnboarding', CustomerOnboardingSchema);



