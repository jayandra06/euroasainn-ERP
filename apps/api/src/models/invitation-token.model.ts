import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export type InvitationStatus = 'pending' | 'used' | 'revoked' | 'expired';

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
  status: InvitationStatus;
  revokedAt?: Date;
  resendCount: number;
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
    status: {
      type: String,
      enum: ['pending', 'used', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

InvitationTokenSchema.index({ token: 1, used: 1 });
InvitationTokenSchema.index({ email: 1, used: 1 });
InvitationTokenSchema.index({ organizationId: 1, status: 1 });
InvitationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InvitationToken = mongoose.model<IInvitationToken>('InvitationToken', InvitationTokenSchema);


