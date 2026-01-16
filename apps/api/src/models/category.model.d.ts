import mongoose, { Document } from 'mongoose';
export interface ICategory extends Document {
    name: string;
    description?: string;
    status: 'active' | 'pending';
    createdBy?: mongoose.Types.ObjectId;
    organizationId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Category: mongoose.Model<ICategory, {}, {}, {}, mongoose.Document<unknown, {}, ICategory, {}, {}> & ICategory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=category.model.d.ts.map