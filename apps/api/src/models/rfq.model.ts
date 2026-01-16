import mongoose, { Schema, Document } from 'mongoose';

export interface IRFQ extends Document {
  organizationId: mongoose.Types.ObjectId; // Sender's organization ID
  rfqNumber: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  vesselId?: mongoose.Types.ObjectId;
  brand?: string;
  model?: string;
  category?: string;
  categories?: string[];
  supplyPort?: string;
  // RFQ sender information
  senderType: 'admin' | 'customer'; // Who sent the RFQ
  senderId: mongoose.Types.ObjectId; // Organization ID of sender (admin org or customer org)
  // RFQ recipients (vendors)
  recipientVendorIds: mongoose.Types.ObjectId[]; // Array of vendor organization IDs
  // Additional fields for RFQ details
  vesselName?: string;
  vesselExName?: string;
  imoNumber?: string;
  equipmentTags?: string;
  subCategory?: string;
  hullNo?: string;
  serialNumber?: string;
  drawingNumber?: string;
  remarks?: string;
  preferredQuality?: string;
  typeOfIncoterms?: string;
  typeOfLogisticContainer?: string;
  createdDate?: Date;
  leadDate?: string;
  items?: Array<{
    impaNo?: string;
    itemDescription: string;
    partNo?: string;
    altPartNo?: string;
    positionNo?: string;
    dimensions?: string;
    requiredQuantity: string | number;
    uom: string;
    generalRemark: string;
  }>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RFQSchema = new Schema<IRFQ>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    rfqNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: 'draft',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    vesselId: {
      type: Schema.Types.ObjectId,
      ref: 'Vessel',
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    categories: {
      type: [String],
      default: [],
    },
    supplyPort: {
      type: String,
      trim: true,
    },
    vesselName: {
      type: String,
      trim: true,
    },
    vesselExName: {
      type: String,
      trim: true,
    },
    imoNumber: {
      type: String,
      trim: true,
    },
    equipmentTags: {
      type: String,
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    hullNo: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    drawingNumber: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    preferredQuality: {
      type: String,
      trim: true,
    },
    typeOfIncoterms: {
      type: String,
      trim: true,
    },
    typeOfLogisticContainer: {
      type: String,
      trim: true,
    },
    createdDate: {
      type: Date,
    },
    leadDate: {
      type: String,
      trim: true,
    },
    items: {
      type: [
        {
          impaNo: { type: String, trim: true },
          itemDescription: { type: String, required: true, trim: true },
          partNo: { type: String, trim: true },
          altPartNo: { type: String, trim: true },
          positionNo: { type: String, trim: true },
          dimensions: { type: String, trim: true },
          requiredQuantity: { type: Schema.Types.Mixed, required: true },
          uom: { type: String, required: true, trim: true },
          generalRemark: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    senderType: {
      type: String,
      enum: ['admin', 'customer'],
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    recipientVendorIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Organization',
      required: true,
      default: [],
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

RFQSchema.index({ organizationId: 1, status: 1 });
RFQSchema.index({ rfqNumber: 1 });
RFQSchema.index({ senderType: 1, senderId: 1 });
RFQSchema.index({ recipientVendorIds: 1 }); // For vendor queries

export const RFQ = mongoose.model<IRFQ>('RFQ', RFQSchema);
