import mongoose, { Schema, Document } from 'mongoose';
import { PortalType } from '@euroasiann/shared';

export interface IRole extends Document {
  name: string;
  key: string;
  portalType: PortalType;
  permissions: string[];
  description?: string;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    portalType: {
      type: String,
      enum: Object.values(PortalType),
      required: true,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RoleSchema.index({ name: 1, portalType: 1 }, { unique: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);









