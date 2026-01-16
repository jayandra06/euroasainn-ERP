import mongoose, { Document } from "mongoose";
import { PortalType } from "@euroasiann/shared";
export interface IRole extends Document {
    name: string;
    key: string;
    portalType: PortalType;
    permissions: string[];
    organizationId?: mongoose.Types.ObjectId;
    description?: string;
    isSystem?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Role: mongoose.Model<IRole, {}, {}, {}, mongoose.Document<unknown, {}, IRole, {}, {}> & IRole & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=role.model.d.ts.map