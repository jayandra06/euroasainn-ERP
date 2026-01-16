import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerVendorInvitation extends Document {
  customerOrganizationId: mongoose.Types.ObjectId;
  vendorEmail: string;
  vendorName: string;
  vendorFirstName?: string;
  vendorLastName?: string;
  vendorOrganizationId?: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  invitationToken: string;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerVendorInvitationSchema = new Schema<ICustomerVendorInvitation>(
  {
    customerOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    vendorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    vendorFirstName: {
      type: String,
    },
    vendorLastName: {
      type: String,
    },
    vendorOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
    invitationToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
CustomerVendorInvitationSchema.index({ customerOrganizationId: 1, vendorEmail: 1, status: 1 });

export const CustomerVendorInvitation = mongoose.model<ICustomerVendorInvitation>(
  'CustomerVendorInvitation',
  CustomerVendorInvitationSchema
);








