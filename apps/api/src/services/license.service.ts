import { License, ILicense } from '../models/license.model';
import { LicenseStatus, OrganizationType } from '../../../../packages/shared/src/types/index.ts';
import { v4 as uuidv4 } from 'uuid';

export class LicenseService {
  generateLicenseKey(): string {
    return `LIC-${uuidv4().toUpperCase().replace(/-/g, '')}`;
  }

  async createLicense(data: {
    organizationId: string;
    organizationType: OrganizationType;
    expiresAt: Date;
    usageLimits: {
      users?: number;
      vessels?: number;
      items?: number;
      employees?: number;
      businessUnits?: number;
    };
  }) {
    const licenseKey = this.generateLicenseKey();

    const license = new License({
      licenseKey,
      organizationId: data.organizationId,
      organizationType: data.organizationType,
      status: LicenseStatus.ACTIVE,
      expiresAt: data.expiresAt,
      usageLimits: data.usageLimits,
      currentUsage: {
        users: 0,
        vessels: 0,
        items: 0,
        employees: 0,
        businessUnits: 0,
      },
    });

    await license.save();
    return license;
  }

  async getLicenses(organizationId?: string, filters?: any) {
    const query: any = {};

    if (organizationId) {
      query.organizationId = organizationId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    const licenses = await License.find(query);
    return licenses;
  }

  async getLicenseByKey(licenseKey: string) {
    const license = await License.findOne({ licenseKey });
    if (!license) {
      throw new Error('License not found');
    }
    return license;
  }

  async validateLicense(organizationId: string): Promise<ILicense> {
    const license = await License.findOne({
      organizationId,
      status: LicenseStatus.ACTIVE,
      expiresAt: { $gt: new Date() },
    });

    if (!license) {
      throw new Error('No valid license found');
    }

    // Check expiry
    if (new Date() > license.expiresAt) {
      license.status = LicenseStatus.EXPIRED;
      await license.save();
      throw new Error('License has expired');
    }

    return license;
  }

  async checkUsageLimit(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits'): Promise<boolean> {
    const license = await this.validateLicense(organizationId);

    const limit = license.usageLimits[resource] || 0;
    const current = license.currentUsage[resource] || 0;

    if (limit === 0) {
      return true; // No limit
    }

    return current < limit;
  }

  async incrementUsage(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits', amount: number = 1) {
    const license = await License.findOne({ organizationId });
    if (!license) {
      throw new Error('License not found');
    }

    const current = license.currentUsage[resource] || 0;
    license.currentUsage[resource] = current + amount;
    await license.save();
  }

  async decrementUsage(organizationId: string, resource: 'users' | 'vessels' | 'items' | 'employees' | 'businessUnits', amount: number = 1) {
    const license = await License.findOne({ organizationId });
    if (!license) {
      throw new Error('License not found');
    }

    const current = license.currentUsage[resource] || 0;
    license.currentUsage[resource] = Math.max(0, current - amount);
    await license.save();
  }

  async updateLicenseStatus(licenseId: string, status: LicenseStatus) {
    const license = await License.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    license.status = status;
    await license.save();
    return license;
  }
}

export const licenseService = new LicenseService();
