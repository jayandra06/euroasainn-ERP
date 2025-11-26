import mongoose, { Schema, Document } from 'mongoose';

export interface IModel extends Document {
  name: string;
  description?: string;
  brandId?: mongoose.Types.ObjectId; // Optional link to brand
  status: 'active' | 'pending';
  createdBy?: mongoose.Types.ObjectId; // User who created it
  organizationId?: mongoose.Types.ObjectId; // Vendor organization if created by vendor
  isGlobal: boolean; // If true, visible to all. If false, only for specific organization
  createdAt: Date;
  updatedAt: Date;
}

const ModelSchema = new Schema<IModel>(
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
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
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
      default: true, // Admin-created models are global by default
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ModelSchema.index({ name: 1, isGlobal: 1 });
ModelSchema.index({ organizationId: 1, status: 1 });
ModelSchema.index({ brandId: 1 });
ModelSchema.index({ status: 1 });

export const Model = mongoose.model<IModel>('Model', ModelSchema);

