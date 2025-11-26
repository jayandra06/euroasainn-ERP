import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  status: 'active' | 'pending';
  createdBy?: mongoose.Types.ObjectId; // User who created it
  organizationId?: mongoose.Types.ObjectId; // Vendor organization if created by vendor
  isGlobal: boolean; // If true, visible to all. If false, only for specific organization
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
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
      default: true, // Admin-created categories are global by default
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ name: 1, isGlobal: 1 });
CategorySchema.index({ organizationId: 1, status: 1 });
CategorySchema.index({ status: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

