import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, PortalType } from '@euroasiann/shared';

export interface IInvitationToken extends Document {
  token: string;
  email: string;
  organizationId?: mongoose.Types.ObjectId;
  organizationType: OrganizationType;
  portalType: PortalType;
  role: string;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationTokenSchema = new Schema<IInvitationToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    organizationType: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
    },
    portalType: {
      type: String,
      enum: Object.values(PortalType),
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

InvitationTokenSchema.index({ token: 1, used: 1 });
InvitationTokenSchema.index({ email: 1, used: 1 });
InvitationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvitationToken = mongoose.model<IInvitationToken>('InvitationToken', InvitationTokenSchema);

