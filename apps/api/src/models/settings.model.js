import mongoose, { Schema } from 'mongoose';
const SettingsSchema = new Schema({
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
}, {
    timestamps: true,
});
export const Settings = mongoose.model('Settings', SettingsSchema);
//# sourceMappingURL=settings.model.js.map