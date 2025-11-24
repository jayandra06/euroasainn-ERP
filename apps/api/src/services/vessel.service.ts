import { Vessel, IVessel } from '../models/vessel.model';
import { licenseService } from './license.service';

export class VesselService {
  async createVessel(organizationId: string, data: Partial<IVessel>) {
    // Check license limit
    const canCreate = await licenseService.checkUsageLimit(organizationId, 'vessels');
    if (!canCreate) {
      throw new Error('Vessel limit exceeded');
    }

    const vessel = new Vessel({
      ...data,
      organizationId,
    });

    await vessel.save();
    await licenseService.incrementUsage(organizationId, 'vessels');
    return vessel;
  }

  async getVessels(organizationId: string, _filters?: any) {
    const query: any = { organizationId };
    return await Vessel.find(query);
  }

  async getVesselById(vesselId: string, organizationId: string) {
    const vessel = await Vessel.findOne({ _id: vesselId, organizationId });
    if (!vessel) {
      throw new Error('Vessel not found');
    }
    return vessel;
  }

  async updateVessel(vesselId: string, organizationId: string, data: Partial<IVessel>) {
    const vessel = await Vessel.findOne({ _id: vesselId, organizationId });
    if (!vessel) {
      throw new Error('Vessel not found');
    }

    Object.assign(vessel, data);
    await vessel.save();
    return vessel;
  }

  async deleteVessel(vesselId: string, organizationId: string) {
    const vessel = await Vessel.findOneAndDelete({ _id: vesselId, organizationId });
    if (!vessel) {
      throw new Error('Vessel not found');
    }
    await licenseService.decrementUsage(organizationId, 'vessels');
    return { success: true };
  }
}

export const vesselService = new VesselService();
