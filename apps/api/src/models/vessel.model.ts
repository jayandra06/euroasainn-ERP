import mongoose, { Schema, Document } from 'mongoose';

export interface IVessel extends Document {
  organizationId: mongoose.Types.ObjectId;
  businessUnitId?: mongoose.Types.ObjectId;
  name: string;
  type: string;
  imoNumber?: string;
  exVesselName?: string;
  flag?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const VesselSchema = new Schema<IVessel>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    businessUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessUnit',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    imoNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    exVesselName: {
      type: String,
      trim: true,
    },
    flag: {
      type: String,
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

VesselSchema.index({ organizationId: 1 });
VesselSchema.index({ businessUnitId: 1 });
VesselSchema.index({ imoNumber: 1 });

export const Vessel = mongoose.model<IVessel>('Vessel', VesselSchema);
