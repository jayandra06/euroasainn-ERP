import mongoose from 'mongoose';
import { RFQ, IRFQ } from '../models/rfq.model';
import { v4 as uuidv4 } from 'uuid';
import { licenseService } from './license.service';
import { organizationService } from './organization.service';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';

export class RFQService {
  generateRFQNumber(): string {
    return `RFQ-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  async createRFQ(
    organizationId: string,
    data: Partial<IRFQ>,
    senderType: 'admin' | 'customer',
    recipientVendorIds: string[]
  ) {
    // Check license limit
    await licenseService.checkUsageLimit(organizationId, 'employees');

    // Validate recipient vendor IDs
    if (!recipientVendorIds || recipientVendorIds.length === 0) {
      throw new Error('At least one vendor must be selected');
    }

    // Convert vendor IDs to ObjectIds
    const vendorObjectIds = recipientVendorIds.map((id) => new mongoose.Types.ObjectId(id));

    const rfq = new RFQ({
      ...data,
      organizationId,
      senderType,
      senderId: new mongoose.Types.ObjectId(organizationId),
      recipientVendorIds: vendorObjectIds,
      rfqNumber: this.generateRFQNumber(),
    });

    await rfq.save();
    return rfq;
  }

  async getRFQs(organizationId: string, filters?: any) {
    const query: any = { organizationId };
    if (filters?.status) {
      query.status = filters.status;
    }
    return await RFQ.find(query).populate('vesselId', 'name imoNumber type');
  }

  async getRFQById(rfqId: string, organizationId: string) {
    const rfq = await RFQ.findOne({ _id: rfqId, organizationId }).populate('vesselId', 'name imoNumber type');
    if (!rfq) {
      throw new Error('RFQ not found');
    }
    return rfq;
  }

  async updateRFQ(rfqId: string, organizationId: string, data: Partial<IRFQ>) {
    const rfq = await RFQ.findOne({ _id: rfqId, organizationId });
    if (!rfq) {
      throw new Error('RFQ not found');
    }

    Object.assign(rfq, data);
    await rfq.save();
    return rfq;
  }

  async deleteRFQ(rfqId: string, organizationId: string) {
    const rfq = await RFQ.findOneAndDelete({ _id: rfqId, organizationId });
    if (!rfq) {
      throw new Error('RFQ not found');
    }
    return { success: true };
  }

  /**
   * Get RFQs for a vendor (vendor's inbox)
   * Returns RFQs where the vendor is in recipientVendorIds
   */
  async getRFQsForVendor(vendorOrganizationId: string, filters?: any) {
    const query: any = {
      recipientVendorIds: new mongoose.Types.ObjectId(vendorOrganizationId),
    };
    
    if (filters?.status) {
      query.status = filters.status;
    }

    const rfqs = await RFQ.find(query)
      .populate('vesselId', 'name imoNumber type')
      .populate('senderId', 'name type') // Populate sender organization
      .sort({ createdAt: -1 });

    return rfqs;
  }

  /**
   * Get available vendors for RFQ creation
   * - Admin: returns only admin-invited vendors
   * - Customer: returns only customer-invited vendors (visible to that customer)
   */
  async getAvailableVendorsForRFQ(requesterOrganizationId: string, requesterPortalType: PortalType) {
    const filters: any = {
      requesterPortalType,
    };

    if (requesterPortalType === PortalType.CUSTOMER) {
      filters.customerOrganizationId = requesterOrganizationId;
    }
    // For admin/tech, no customerOrganizationId filter - they see all admin-invited vendors

    const vendors = await organizationService.getOrganizations(
      OrganizationType.VENDOR,
      PortalType.VENDOR,
      filters
    );

    // Filter to only admin-invited vendors for admin/tech, customer-invited for customers
    if (requesterPortalType === PortalType.ADMIN || requesterPortalType === PortalType.TECH) {
      return vendors.filter((v: any) => v.isAdminInvited === true);
    } else {
      // For customers, return vendors they have access to (customer-invited or admin-invited with visibility)
      return vendors.filter((v: any) => {
        // Customer-invited vendors
        if (!v.isAdminInvited && v.invitedByOrganizationId?.toString() === requesterOrganizationId) {
          return true;
        }
        // Admin-invited vendors visible to this customer
        if (v.isAdminInvited && v.visibleToCustomerIds?.some((id: any) => id.toString() === requesterOrganizationId)) {
          return true;
        }
        return false;
      });
    }
  }
}

export const rfqService = new RFQService();
