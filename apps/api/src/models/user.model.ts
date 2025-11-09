import mongoose, { Schema, Document } from 'mongoose';
import { PortalType } from '@euroasiann/shared';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  portalType: PortalType;
  role: string;
  roleId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
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
    portalType: {
      type: String,
      enum: Object.values(PortalType),
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      index: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1, portalType: 1 });
UserSchema.index({ organizationId: 1, portalType: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
