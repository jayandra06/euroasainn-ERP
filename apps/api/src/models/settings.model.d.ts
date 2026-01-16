import mongoose, { Document } from 'mongoose';
export interface ISettings extends Document {
    type: 'branding' | 'regional' | 'email-templates' | 'sms-templates';
    data: Record<string, any>;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
    createdAt: Date;
}
export declare const Settings: mongoose.Model<ISettings, {}, {}, {}, mongoose.Document<unknown, {}, ISettings, {}, {}> & ISettings & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=settings.model.d.ts.map