import mongoose, { Document } from 'mongoose';
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
export declare const Vessel: mongoose.Model<IVessel, {}, {}, {}, mongoose.Document<unknown, {}, IVessel, {}, {}> & IVessel & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=vessel.model.d.ts.map