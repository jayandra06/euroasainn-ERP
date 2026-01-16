import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotation extends Document {
  organizationId: mongoose.Types.ObjectId;
  quotationNumber: string;
  rfqId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: string;
  totalAmount: number;
  currency: string;
  validUntil?: Date;
  isAdminOffer?: boolean; // Mark admin quotations as special offers
  items: Array<{
    itemId: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    rfqId: {
      type: Schema.Types.ObjectId,
      ref: 'RFQ',
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    validUntil: {
      type: Date,
    },
    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          ref: 'Item',
          required: false, // Make optional since we may use dummy IDs
        },
        quantity: {
          type: Number,
          required: true,
          min: 0, // Allow 0 for flexibility
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isAdminOffer: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

QuotationSchema.index({ organizationId: 1, status: 1 });
QuotationSchema.index({ quotationNumber: 1 });
QuotationSchema.index({ rfqId: 1 });

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
