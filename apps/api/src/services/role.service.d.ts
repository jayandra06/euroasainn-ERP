import mongoose from "mongoose";
import { IRole } from "../models/role.model";
import { PortalType } from "@euroasiann/shared";
declare class RoleService {
    listRoles(filter: {
        portalType?: PortalType;
        organizationId: string;
    }): Promise<(mongoose.FlattenMaps<IRole> & Required<{
        _id: mongoose.FlattenMaps<unknown>;
    }> & {
        __v: number;
    })[]>;
    createRole(data: {
        name: string;
        portalType: PortalType;
        permissions?: string[];
        description?: string;
        organizationId: string;
    }): Promise<mongoose.Document<unknown, {}, IRole, {}, {}> & IRole & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateRole(roleId: string, data: Partial<IRole>): Promise<mongoose.Document<unknown, {}, IRole, {}, {}> & IRole & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteRole(roleId: string, organizationId: string): Promise<boolean>;
}
export declare const roleService: RoleService;
export {};
//# sourceMappingURL=role.service.d.ts.map