import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentProof extends Document {
  rfqId: mongoose.Types.ObjectId;
  quotationId: mongoose.Types.ObjectId;
  customerOrganizationId: mongoose.Types.ObjectId; // Customer who made payment
  vendorOrganizationId: mongoose.Types.ObjectId; // Vendor who receives payment
  // Payment Information
  paymentAmount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod?: string; // Bank Transfer, Wire Transfer, etc.
  transactionReference?: string;
  // Payment Proof Documents/Images
  proofDocuments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  // Status
  status: 'pending' | 'submitted' | 'verified' | 'approved';
  submittedAt: Date;
  verifiedAt?: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId; // Vendor user who approved
  // Shipping
  shippingOption?: 'self' | 'vendor-managed'; // Selected by customer
  shippingSelectedAt?: Date;
  // Self-managed shipping details (submitted by customer)
  awbTrackingNumber?: string;
  shippingContactName?: string;
  shippingContactEmail?: string;
  shippingContactPhone?: string;
  // Vendor-managed shipping details (submitted by vendor)
  vendorAWBTrackingNumber?: string;
  vendorShippingContactName?: string;
  vendorShippingContactEmail?: string;
  vendorShippingContactPhone?: string;
  vendorShippingSubmittedAt?: Date;
  vendorShippingSubmittedBy?: mongoose.Types.ObjectId; // Vendor user who submitted
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentProofSchema = new Schema<IPaymentProof>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PaymentProofSchema.index({ rfqId: 1, quotationId: 1 });
PaymentProofSchema.index({ customerOrganizationId: 1 });
PaymentProofSchema.index({ vendorOrganizationId: 1 });

export const PaymentProof = mongoose.model<IPaymentProof>(
  'PaymentProof',
  PaymentProofSchema
);

