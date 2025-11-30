import mongoose, { Schema, Document } from 'mongoose';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';

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
  preferences?: {
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
  };
  securityQuestion?: string;
  securityAnswer?: string;
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
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
      },
      timeFormat: {
        type: String,
        enum: ['12h', '24h'],
        default: '12h',
      },
    },
    securityQuestion: {
      type: String,
    },
    securityAnswer: {
      type: String,
      select: false, // Don't return in queries by default
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1, portalType: 1 });
UserSchema.index({ organizationId: 1, portalType: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
