import mongoose from "mongoose";
import { IUser } from "../models/user.model";
import { PortalType } from "../../../../packages/shared/src/types/index";
export declare class UserService {
    createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        portalType: PortalType;
        role: string;
        organizationId: string;
    }): Promise<IUser & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getUsers(portalType: PortalType, organizationId: string, filters?: any): Promise<(mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getUserById(userId: string): Promise<mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateUser(userId: string, data: Partial<IUser>): Promise<IUser & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteUser(userId: string): Promise<{
        success: boolean;
    }>;
    inviteUser(data: {
        email: string;
        firstName: string;
        lastName: string;
        portalType: PortalType;
        role: string;
        roleId?: string;
        organizationId: string;
    }): Promise<{
        temporaryPassword: string;
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
        _id: unknown;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: mongoose.Collection;
        db: mongoose.Connection;
        errors?: mongoose.Error.ValidationError;
        id?: any;
        isNew: boolean;
        schema: mongoose.Schema;
        __v: number;
    }>;
    resetUserTemporaryPassword(email: string, portalType: PortalType): Promise<{
        user: IUser & Required<{
            _id: unknown;
        }> & {
            __v: number;
        };
        temporaryPassword: string;
    }>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map