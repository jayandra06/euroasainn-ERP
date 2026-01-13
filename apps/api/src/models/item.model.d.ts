import mongoose, { Document } from 'mongoose';
export interface IItem extends Document {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    category?: string;
    unitPrice: number;
    currency: string;
    stockQuantity?: number;
    sku?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Item: mongoose.Model<IItem, {}, {}, {}, mongoose.Document<unknown, {}, IItem, {}, {}> & IItem & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=item.model.d.ts.map