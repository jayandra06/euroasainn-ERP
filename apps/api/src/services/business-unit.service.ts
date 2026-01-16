import { BusinessUnit, IBusinessUnit } from '../models/business-unit.model';
import { licenseService } from './license.service';

export class BusinessUnitService {
  async createBusinessUnit(organizationId: string, data: Partial<IBusinessUnit>) {
    // License validation removed - create business unit without license checks
    const businessUnit = new BusinessUnit({
      ...data,
      organizationId,
    });

    await businessUnit.save();
    
    // Try to increment usage if license exists, but don't fail if it doesn't
    try {
      await licenseService.incrementUsage(organizationId, 'businessUnits');
    } catch (usageError: any) {
      // Log but don't fail business unit creation if usage increment fails
      console.warn('Failed to increment business unit usage (license may not exist):', usageError.message);
    }
    
    return businessUnit;
  }

  async getBusinessUnits(organizationId: string, filters?: any) {
    const query: any = { organizationId };
    if (filters?.parentUnitId) {
      query.parentUnitId = filters.parentUnitId;
    }
    return await BusinessUnit.find(query);
  }

  async getBusinessUnitById(unitId: string, organizationId: string) {
    const unit = await BusinessUnit.findOne({ _id: unitId, organizationId });
    if (!unit) {
      throw new Error('Business unit not found');
    }
    return unit;
  }

  async updateBusinessUnit(unitId: string, organizationId: string, data: Partial<IBusinessUnit>) {
    const unit = await BusinessUnit.findOne({ _id: unitId, organizationId });
    if (!unit) {
      throw new Error('Business unit not found');
    }

    Object.assign(unit, data);
    await unit.save();
    return unit;
  }

  async deleteBusinessUnit(unitId: string, organizationId: string) {
    const unit = await BusinessUnit.findOneAndDelete({ _id: unitId, organizationId });
    if (!unit) {
      throw new Error('Business unit not found');
    }
    await licenseService.decrementUsage(organizationId, 'businessUnits');
    return { success: true };
  }
}

export const businessUnitService = new BusinessUnitService();
