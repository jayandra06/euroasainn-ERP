import mongoose, { Schema, Document } from 'mongoose';

export interface ICatalogItem extends Document {
  impa: string;
  description: string;
  partNo?: string;
  positionNo?: string;
  alternativeNo?: string;
  brand?: string;
  model?: string;
  category?: string;
  dimensions?: string;
  uom: string;
  moq: string;
  leadTime?: string;
  price: number;
  currency: string;
  stockStatus: 'In Stock' | 'Limited' | 'Backorder' | 'Discontinued';
  vendorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogItemSchema = new Schema<ICatalogItem>(
  {
    impa: {
      type: String,
      required: [true, 'IMPA code is required'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [3, 'Description must be at least 3 characters'],
    },
    partNo: { type: String, trim: true, sparse: true },
    positionNo: { type: String, trim: true, sparse: true },
    alternativeNo: { type: String, trim: true, sparse: true },
    brand: { type: String, trim: true, sparse: true },
    model: { type: String, trim: true, sparse: true },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    dimensions: { type: String, trim: true },
    uom: {
      type: String,
      trim: true,
      default: 'PCS',
      uppercase: true,
    },
    moq: {
      type: String,
      default: '1',
      trim: true,
    },
    leadTime: {
      type: String,
      trim: true,
      default: 'Ex-stock',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'SGD', 'JPY', 'INR', 'GBP', 'AUD'],
    },
    stockStatus: {
      type: String,
      enum: ['In Stock', 'Limited', 'Backorder', 'Discontinued'],
      default: 'In Stock',
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CatalogItemSchema.index({ impa: 1, vendorId: 1 }, { unique: true });
CatalogItemSchema.index({ vendorId: 1 });
CatalogItemSchema.index({ partNo: 1, vendorId: 1 }, { sparse: true });
CatalogItemSchema.index({
  description: 'text',
  brand: 'text',
  model: 'text',
  partNo: 'text',
  impa: 'text',
});

export const CatalogItem = mongoose.model<ICatalogItem>('CatalogItem', CatalogItemSchema);