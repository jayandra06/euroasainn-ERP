import { Organization, IOrganization } from '../models/organization.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export class OrganizationService {
  async createOrganization(data: {
    name: string;
    type: OrganizationType;
    portalType: PortalType;
    metadata?: Record<string, any>;
  }) {
    const organization = new Organization(data);
    await organization.save();
    return organization;
  }

  async getOrganizations(type?: OrganizationType, portalType?: PortalType, filters?: any) {
    const query: any = {};

    // Exclude admin organizations by default (they're platform owner, not managed here)
    // Only include customer and vendor organizations
    query.type = { $in: [OrganizationType.CUSTOMER, OrganizationType.VENDOR] };

    // If a specific type is requested, filter to that type
    if (type && (type === OrganizationType.CUSTOMER || type === OrganizationType.VENDOR)) {
      query.type = type;
    }

    if (portalType) {
      query.portalType = portalType;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Optimize query: only select necessary fields and use lean() for better performance
    const organizations = await Organization.find(query)
      .select('name type portalType isActive licenseKey createdAt')
      .lean()
      .exec();
    
    return organizations;
  }

  async getOrganizationById(orgId: string) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return organization;
  }

  async updateOrganization(orgId: string, data: Partial<IOrganization>) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    Object.assign(organization, data);
    await organization.save();
    return organization;
  }

  async deleteOrganization(orgId: string) {
    const organization = await Organization.findByIdAndDelete(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    return { success: true };
  }
}

export const organizationService = new OrganizationService();
