import mongoose, { Document } from 'mongoose';
export interface IModel extends Document {
    name: string;
    description?: string;
    brandId?: mongoose.Types.ObjectId;
    status: 'active' | 'pending';
    createdBy?: mongoose.Types.ObjectId;
    organizationId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Model: mongoose.Model<IModel, {}, {}, {}, mongoose.Document<unknown, {}, IModel, {}, {}> & IModel & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=model.model.d.ts.map