import mongoose, { Schema, Document } from 'mongoose';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  RENEWAL = 'renewal',
}

export interface IPayment extends Document {
  organizationId: mongoose.Types.ObjectId;
  organizationType: OrganizationType;
  portalType: PortalType;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  paymentGateway?: string;
  gatewayResponse?: any;
  description?: string;
  subscriptionPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  licenseId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    organizationType: {
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
      default: PaymentType.SUBSCRIPTION,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
      index: true,
    },
    paymentGateway: {
      type: String,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
    },
    subscriptionPeriod: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    licenseId: {
      type: Schema.Types.ObjectId,
      ref: 'License',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ organizationId: 1, status: 1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);









