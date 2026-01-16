import mongoose, { Schema, Document } from 'mongoose';

export interface IPart extends Document {
  name: string;
  partNumber: string;
  description?: string;
  priceUSD: number;
  stockQuantity: number;
  subCategoryId: mongoose.Types.ObjectId;
  status: 'active' | 'pending';
  createdBy?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PartSchema = new Schema<IPart>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    partNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priceUSD: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PartSchema.index({ subCategoryId: 1, partNumber: 1 });
PartSchema.index({ partNumber: 1 });
PartSchema.index({ organizationId: 1, status: 1 });
PartSchema.index({ status: 1 });

export const Part = mongoose.model<IPart>('Part', PartSchema);
