import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export interface IOrganization extends Document {
  name: string;
  type: OrganizationType;
  portalType: PortalType;
  isActive: boolean;
  licenseKey?: string;
  // Vendor invitation tracking
  invitedBy?: 'admin' | 'tech' | 'customer'; // Who invited this vendor
  invitedByOrganizationId?: mongoose.Types.ObjectId; // Customer organization that invited (if customer invited)
  isAdminInvited?: boolean; // True if invited by admin/tech
  visibleToCustomerIds?: mongoose.Types.ObjectId[]; // Array of customer organization IDs that can see this vendor
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
    // Vendor invitation tracking
    invitedBy: {
      type: String,
      enum: ['admin', 'tech', 'customer'],
      index: true,
    },
    invitedByOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    isAdminInvited: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibleToCustomerIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    }],
  },
  {
    timestamps: true,
  }
);

OrganizationSchema.index({ name: 1, type: 1 });
OrganizationSchema.index({ type: 1, isActive: 1 });
OrganizationSchema.index({ isAdminInvited: 1, type: 1 });
OrganizationSchema.index({ visibleToCustomerIds: 1 });
OrganizationSchema.index({ invitedByOrganizationId: 1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
