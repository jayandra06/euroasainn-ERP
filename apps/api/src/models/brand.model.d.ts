import mongoose, { Document } from 'mongoose';
export interface IBrand extends Document {
    name: string;
    description?: string;
    status: 'active' | 'pending';
    createdBy?: mongoose.Types.ObjectId;
    organizationId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Brand: mongoose.Model<IBrand, {}, {}, {}, mongoose.Document<unknown, {}, IBrand, {}, {}> & IBrand & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=brand.model.d.ts.map