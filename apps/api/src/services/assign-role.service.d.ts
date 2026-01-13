import mongoose from "mongoose";
import { IUser } from "../models/user.model";
declare class AssignRoleService {
    listUsers(portalType: string, organizationId: string): Promise<any[]>;
    listRoles(portalType: string, organizationId: string): Promise<any[]>;
    assignRole(userId: string, roleId: string, organizationId: string): Promise<(mongoose.FlattenMaps<IUser> & Required<{
        _id: mongoose.FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
    removeRole(userId: string, organizationId: string): Promise<(mongoose.FlattenMaps<IUser> & Required<{
        _id: mongoose.FlattenMaps<unknown>;
    }> & {
        __v: number;
    }) | null>;
}
export declare const assignRoleService: AssignRoleService;
export {};
//# sourceMappingURL=assign-role.service.d.ts.map