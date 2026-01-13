import { IVessel } from '../models/vessel.model';
export declare class VesselService {
    createVessel(organizationId: string, data: Partial<IVessel>): Promise<import("mongoose").Document<unknown, {}, IVessel, {}, {}> & IVessel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getVessels(organizationId: string, _filters?: any): Promise<(import("mongoose").Document<unknown, {}, IVessel, {}, {}> & IVessel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getVesselById(vesselId: string, organizationId: string): Promise<import("mongoose").Document<unknown, {}, IVessel, {}, {}> & IVessel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateVessel(vesselId: string, organizationId: string, data: Partial<IVessel>): Promise<import("mongoose").Document<unknown, {}, IVessel, {}, {}> & IVessel & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    deleteVessel(vesselId: string, organizationId: string): Promise<{
        success: boolean;
    }>;
}
export declare const vesselService: VesselService;
//# sourceMappingURL=vessel.service.d.ts.map