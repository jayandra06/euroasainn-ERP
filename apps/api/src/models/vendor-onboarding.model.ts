import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorOnboarding extends Document {
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
  
  // Vendor Specific
  brands?: string[];
  categories?: string[];
  models?: string[];
  warehouseAddress: string;
  
  // Managing Director Details
  managingDirector: string;
  managingDirectorEmail: string;
  managingDirectorPhone: string;
  managingDirectorDeskPhone: string;
  port: string;
  
  // Sales Manager Details
  salesManager: string;
  salesManagerEmail: string;
  salesManagerPhone: string;
  salesManagerDeskPhone: string;
  
  // Logistic Service
  logisticService: string;
  
  // Status
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const VendorOnboardingSchema = new Schema<IVendorOnboarding>(
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
    brands: [{ type: String }],
    categories: [{ type: String }],
    models: [{ type: String }],
    warehouseAddress: { type: String, required: true },
    managingDirector: { type: String, required: true },
    managingDirectorEmail: { type: String, required: true },
    managingDirectorPhone: { type: String, required: true },
    managingDirectorDeskPhone: { type: String, required: true },
    port: { type: String, required: true },
    salesManager: { type: String, required: true },
    salesManagerEmail: { type: String, required: true },
    salesManagerPhone: { type: String, required: true },
    salesManagerDeskPhone: { type: String, required: true },
    logisticService: { type: String, required: true },
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

VendorOnboardingSchema.index({ organizationId: 1, status: 1 });
VendorOnboardingSchema.index({ email: 1 });
VendorOnboardingSchema.index({ invitationToken: 1 });

export const VendorOnboarding = mongoose.model<IVendorOnboarding>('VendorOnboarding', VendorOnboardingSchema);

