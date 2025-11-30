import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  organizationId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string; // Employee role (e.g., Captain, Engineer, Deck Officer, etc.)
  businessUnitId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
    },
    department: {
      type: String,
    },
    role: {
      type: String,
      trim: true,
    },
    businessUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessUnit',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

EmployeeSchema.index({ organizationId: 1, email: 1 });
EmployeeSchema.index({ businessUnitId: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
