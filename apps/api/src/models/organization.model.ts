import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export interface IOrganization extends Document {
  name: string;
  type: OrganizationType;
  portalType: PortalType;
  isActive: boolean;
  licenseKey?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
      index: true,
    },
    portalType: {
      type: String,
      enum: Object.values(PortalType),
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    licenseKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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

OrganizationSchema.index({ name: 1, type: 1 });
OrganizationSchema.index({ type: 1, isActive: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
