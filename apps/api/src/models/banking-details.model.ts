import mongoose, { Schema, Document } from 'mongoose';

export interface IBankingDetails extends Document {
  quotationId: mongoose.Types.ObjectId;
  rfqId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId; // Vendor organization
  // Bank Information
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType?: string; // Savings, Current, etc.
  bankAddress?: string;
  bankCity?: string;
  bankCountry?: string;
  bankSwiftCode?: string;
  bankIBAN?: string;
  routingNumber?: string;
  // Additional Information
  branchName?: string;
  branchCode?: string;
  currency?: string;
  // Uploaded Documents/Images
  documents?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }>;
  // Status
  status: 'pending' | 'submitted' | 'verified';
  submittedAt?: Date;
  verifiedAt?: Date;
  // Metadata
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BankingDetailsSchema = new Schema<IBankingDetails>(
  {
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
      index: true,
    },
    rfqId: {
      type: Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['Savings', 'Current', 'Checking', 'Other'],
    },
    bankAddress: {
      type: String,
    },
    bankCity: {
      type: String,
    },
    bankCountry: {
      type: String,
    },
    bankSwiftCode: {
      type: String,
    },
    bankIBAN: {
      type: String,
    },
    routingNumber: {
      type: String,
    },
    branchName: {
      type: String,
    },
    branchCode: {
      type: String,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    documents: [
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
      enum: ['pending', 'submitted', 'verified'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
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
BankingDetailsSchema.index({ quotationId: 1, organizationId: 1 });
BankingDetailsSchema.index({ rfqId: 1 });

export const BankingDetails = mongoose.model<IBankingDetails>(
  'BankingDetails',
  BankingDetailsSchema
);








