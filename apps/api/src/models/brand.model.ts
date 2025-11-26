import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  description?: string;
  status: 'active' | 'pending';
  createdBy?: mongoose.Types.ObjectId; // User who created it
  organizationId?: mongoose.Types.ObjectId; // Vendor organization if created by vendor
  isGlobal: boolean; // If true, visible to all. If false, only for specific organization
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
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
      default: true, // Admin-created brands are global by default
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

BrandSchema.index({ name: 1, isGlobal: 1 });
BrandSchema.index({ organizationId: 1, status: 1 });
BrandSchema.index({ status: 1 });

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);

