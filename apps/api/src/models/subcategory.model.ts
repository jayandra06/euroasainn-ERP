import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  status: 'active' | 'pending';
  createdBy?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
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

SubCategorySchema.index({ categoryId: 1, name: 1 });
SubCategorySchema.index({ organizationId: 1, status: 1 });
SubCategorySchema.index({ status: 1 });

export const SubCategory = mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
