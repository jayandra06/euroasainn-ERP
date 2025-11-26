import mongoose from 'mongoose';
import { Organization, IOrganization } from '../models/organization.model';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export class OrganizationService {
  async createOrganization(data: {
    name: string;
    type: OrganizationType;
    portalType: PortalType;
    metadata?: Record<string, any>;
    invitedBy?: 'admin' | 'tech' | 'customer';
    invitedByOrganizationId?: string;
  }) {
    const organizationData: any = {
      name: data.name,
      type: data.type,
      portalType: data.portalType,
      metadata: data.metadata,
    };

    // If it's a vendor organization, track invitation details
    if (data.type === OrganizationType.VENDOR) {
      if (data.invitedBy === 'admin' || data.invitedBy === 'tech') {
        organizationData.invitedBy = data.invitedBy;
        organizationData.isAdminInvited = true;
        // Admin-invited vendors are not visible to customers by default
        organizationData.visibleToCustomerIds = [];
      } else if (data.invitedBy === 'customer' && data.invitedByOrganizationId) {
        organizationData.invitedBy = 'customer';
        organizationData.invitedByOrganizationId = new mongoose.Types.ObjectId(data.invitedByOrganizationId);
        organizationData.isAdminInvited = false;
        // Customer-invited vendors are visible only to that customer
        organizationData.visibleToCustomerIds = [new mongoose.Types.ObjectId(data.invitedByOrganizationId)];
      }
    }

    const organization = new Organization(organizationData);
    await organization.save();
    return organization;
  }

  async getOrganizations(
    type?: OrganizationType,
    portalType?: PortalType,
    filters?: {
      isActive?: boolean;
      customerOrganizationId?: string; // For filtering vendors visible to a specific customer
      requesterPortalType?: PortalType; // Who is requesting (admin/tech can see all, customers see filtered)
    }
  ) {
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

    // Visibility rules for vendors:
    // - Admin/Tech can see all vendors
    // - Customers can only see:
    //   1. Vendors they invited (visibleToCustomerIds contains their orgId OR invitedByOrganizationId matches)
    //   2. Vendors that were admin-invited AND the customer also invited (visibleToCustomerIds contains their orgId)
    if (type === OrganizationType.VENDOR && filters?.requesterPortalType) {
      const requesterPortal = filters.requesterPortalType;
      
      // If requester is admin or tech, they can see all vendors (no filtering)
      if (requesterPortal === PortalType.ADMIN || requesterPortal === PortalType.TECH) {
        // No additional filtering - show all vendors
      } else if (requesterPortal === PortalType.CUSTOMER && filters?.customerOrganizationId) {
        // Customer can only see vendors where:
        // 1. They are in visibleToCustomerIds, OR
        // 2. The vendor was invited by this customer (invitedByOrganizationId matches)
        const customerOrgId = new mongoose.Types.ObjectId(filters.customerOrganizationId);
        query.$or = [
          { visibleToCustomerIds: customerOrgId },
          { invitedByOrganizationId: customerOrgId },
        ];
      }
    }

    // Optimize query: only select necessary fields and use lean() for better performance
    const organizations = await Organization.find(query)
      .select('name type portalType isActive licenseKey createdAt invitedBy isAdminInvited visibleToCustomerIds invitedByOrganizationId')
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

  /**
   * Add a customer to the visible list of an admin-invited vendor
   * This is called when a customer invites a vendor that was already invited by admin
   */
  async addCustomerToVendorVisibility(vendorId: string, customerOrganizationId: string) {
    const vendor = await Organization.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    if (vendor.type !== OrganizationType.VENDOR) {
      throw new Error('Organization is not a vendor');
    }

    const customerOrgId = new mongoose.Types.ObjectId(customerOrganizationId);

    // If vendor is admin-invited, add customer to visible list
    if (vendor.isAdminInvited) {
      if (!vendor.visibleToCustomerIds) {
        vendor.visibleToCustomerIds = [];
      }

      // Check if customer is already in the list
      const isAlreadyVisible = vendor.visibleToCustomerIds.some(
        (id) => id.toString() === customerOrganizationId
      );

      if (!isAlreadyVisible) {
        vendor.visibleToCustomerIds.push(customerOrgId);
        await vendor.save();
      }
    } else {
      // If vendor was customer-invited, update the visible list
      if (!vendor.visibleToCustomerIds) {
        vendor.visibleToCustomerIds = [];
      }

      const isAlreadyVisible = vendor.visibleToCustomerIds.some(
        (id) => id.toString() === customerOrganizationId
      );

      if (!isAlreadyVisible) {
        vendor.visibleToCustomerIds.push(customerOrgId);
        await vendor.save();
      }
    }

    return vendor;
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
