import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  type: 'branding' | 'regional' | 'email-templates' | 'sms-templates';
  data: Record<string, any>;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    type: {
      type: String,
      enum: ['branding', 'regional', 'email-templates', 'sms-templates'],
      required: true,
      unique: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);






