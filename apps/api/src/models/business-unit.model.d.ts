import mongoose, { Document } from 'mongoose';
export interface IBusinessUnit extends Document {
    organizationId: mongoose.Types.ObjectId;
    name: string;
    code?: string;
    description?: string;
    parentUnitId?: mongoose.Types.ObjectId;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BusinessUnit: mongoose.Model<IBusinessUnit, {}, {}, {}, mongoose.Document<unknown, {}, IBusinessUnit, {}, {}> & IBusinessUnit & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=business-unit.model.d.ts.map