import { Vessel, IVessel } from '../models/vessel.model';
import { licenseService } from './license.service';

export class VesselService {
  async createVessel(organizationId: string, data: Partial<IVessel>) {
    // License validation removed - create vessel without license checks
    const vessel = new Vessel({
      ...data,
      organizationId,
    });

    await vessel.save();
    
    // Try to increment usage if license exists, but don't fail if it doesn't
    try {
      await licenseService.incrementUsage(organizationId, 'vessels');
    } catch (usageError: any) {
      // Log but don't fail vessel creation if usage increment fails (no license or other error)
      console.warn('Failed to increment vessel usage (license may not exist):', usageError.message);
    }
    
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
    // Try to decrement usage if license exists, but don't fail if it doesn't
    try {
      await licenseService.decrementUsage(organizationId, 'vessels');
    } catch (usageError: any) {
      // Log but don't fail vessel deletion if usage decrement fails
      console.warn('Failed to decrement vessel usage (license may not exist):', usageError.message);
    }
    return { success: true };
  }
}

export const vesselService = new VesselService();
