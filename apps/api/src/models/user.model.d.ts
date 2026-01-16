import mongoose, { Document } from "mongoose";
import { PortalType } from "../../../../packages/shared/src/types/index.ts";
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    portalType: PortalType;
    role: string;
    roleName: string;
    roleId?: mongoose.Types.ObjectId;
    organizationId: mongoose.Types.ObjectId;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    casbinSubject: string;
    casbinOrg: string;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=user.model.d.ts.map