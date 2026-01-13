import mongoose from 'mongoose';
import { RFQ } from '../models/rfq.model';
import { v4 as uuidv4 } from 'uuid';
import { organizationService } from './organization.service';
import { OrganizationType, PortalType } from '../../../../packages/shared/src/types/index.ts';
import { VendorOnboarding } from '../models/vendor-onboarding.model';
import { emailService } from './email.service';
import { logger } from '../config/logger';
export class RFQService {
    generateRFQNumber() {
        return `RFQ-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
    async createRFQ(organizationId, data, senderType, recipientVendorIds) {
        // License validation removed - RFQ creation does not require a license
        // Validate recipient vendor IDs
        if (!recipientVendorIds || recipientVendorIds.length === 0) {
            throw new Error('At least one vendor must be selected');
        }
        // Convert vendor IDs to ObjectIds
        const vendorObjectIds = recipientVendorIds.map((id) => new mongoose.Types.ObjectId(id));
        // Separate direct RFQ fields from metadata fields
        const { hullNo, serialNumber, subCategory, equipmentTags, drawingNumber, preferredQuality, typeOfIncoterms, typeOfLogisticContainer, createdDate, leadDate, remarks, items, ...directRFQFields } = data;
        // Build metadata object with ALL fields (preserve even empty values)
        const metadata = {
            ...(data.metadata || {}),
        };
        // Store all form fields in metadata
        if (hullNo !== undefined) {
            metadata.hullNo = hullNo;
            metadata.hullNumber = hullNo;
        }
        if (serialNumber !== undefined)
            metadata.serialNumber = serialNumber;
        if (subCategory !== undefined)
            metadata.subCategory = subCategory;
        if (equipmentTags !== undefined)
            metadata.equipmentTags = equipmentTags;
        if (drawingNumber !== undefined)
            metadata.drawingNumber = drawingNumber;
        if (preferredQuality !== undefined)
            metadata.preferredQuality = preferredQuality;
        if (typeOfIncoterms !== undefined) {
            metadata.typeOfIncoterms = typeOfIncoterms;
            metadata.incoterms = typeOfIncoterms;
        }
        if (typeOfLogisticContainer !== undefined) {
            metadata.typeOfLogisticContainer = typeOfLogisticContainer;
            metadata.logisticContainer = typeOfLogisticContainer;
        }
        if (createdDate !== undefined)
            metadata.createdDate = createdDate;
        if (leadDate !== undefined)
            metadata.leadDate = leadDate;
        if (remarks !== undefined)
            metadata.remarks = remarks;
        if (items !== undefined && Array.isArray(items)) {
            metadata.items = items;
        }
        // Build RFQ data with direct fields
        const rfqData = {
            ...directRFQFields,
            organizationId,
            senderType,
            senderId: new mongoose.Types.ObjectId(organizationId),
            recipientVendorIds: vendorObjectIds,
            rfqNumber: this.generateRFQNumber(),
            metadata,
            status: data.status || 'sent', // Set status to 'sent' when RFQ is created and sent to vendors
        };
        const rfq = new RFQ(rfqData);
        await rfq.save();
        // Send email notifications to all selected vendors
        try {
            await this.sendRFQNotificationsToVendors(rfq);
        }
        catch (emailError) {
            // Log error but don't fail RFQ creation if email sending fails
            logger.error(`Failed to send RFQ notification emails: ${emailError.message}`);
        }
        return rfq;
    }
    /**
     * Send RFQ notification emails to all recipient vendors
     */
    async sendRFQNotificationsToVendors(rfq) {
        try {
            const { Organization } = await import('../models/organization.model');
            const { User } = await import('../models/user.model');
            // Get sender organization name
            const senderOrg = await Organization.findById(rfq.senderId);
            const customerOrgName = senderOrg?.name || 'Customer Organization';
            // Get vendor portal URL
            const vendorPortalUrl = process.env.VENDOR_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4400';
            const rfqLink = `${vendorPortalUrl}/rfqs/${rfq._id}`;
            // Get all vendor organizations
            const vendorOrgs = await Organization.find({
                _id: { $in: rfq.recipientVendorIds }
            });
            logger.info(`📧 Sending RFQ notifications to ${vendorOrgs.length} vendors for RFQ ${rfq.rfqNumber}`);
            // Send email to each vendor's admin user
            const emailPromises = vendorOrgs.map(async (vendorOrg) => {
                try {
                    // Find the admin user for this vendor organization (prefer vendor_admin, fallback to any user)
                    let adminUser = await User.findOne({
                        organizationId: vendorOrg._id,
                        portalType: PortalType.VENDOR,
                        role: 'vendor_admin',
                    }).sort({ createdAt: 1 }); // Get the first admin user
                    // If no admin user found, try to find any user in the vendor organization
                    if (!adminUser || !adminUser.email) {
                        adminUser = await User.findOne({
                            organizationId: vendorOrg._id,
                            portalType: PortalType.VENDOR,
                        }).sort({ createdAt: 1 }); // Get the first user
                    }
                    if (!adminUser || !adminUser.email) {
                        logger.warn(`⚠️ No user found for vendor organization ${vendorOrg.name} (${vendorOrg._id})`);
                        return;
                    }
                    const firstName = adminUser.firstName || 'Vendor';
                    const lastName = adminUser.lastName || 'Admin';
                    await emailService.sendRFQNotificationEmail({
                        to: adminUser.email,
                        firstName,
                        lastName,
                        customerOrganizationName: customerOrgName,
                        rfqNumber: rfq.rfqNumber,
                        rfqTitle: rfq.title || 'RFQ',
                        rfqLink,
                    });
                    logger.info(`✅ RFQ notification email sent to ${adminUser.email} for vendor ${vendorOrg.name}`);
                }
                catch (vendorEmailError) {
                    logger.error(`❌ Failed to send RFQ email to vendor ${vendorOrg.name}: ${vendorEmailError.message}`);
                    // Continue with other vendors even if one fails
                }
            });
            await Promise.allSettled(emailPromises);
            logger.info(`✅ Completed sending RFQ notifications for RFQ ${rfq.rfqNumber}`);
        }
        catch (error) {
            logger.error(`❌ Error in sendRFQNotificationsToVendors: ${error.message}`);
            throw error;
        }
    }
    async getRFQs(organizationId, filters) {
        const query = { organizationId };
        if (filters?.status) {
            query.status = filters.status;
        }
        return await RFQ.find(query).populate('vesselId', 'name imoNumber type');
    }
    async getRFQById(rfqId, organizationId) {
        const query = { _id: rfqId };
        // If organizationId is provided, filter by it (for customer portal)
        // If not provided, return any RFQ (for admin portal)
        if (organizationId) {
            query.organizationId = organizationId;
        }
        const rfq = await RFQ.findOne(query)
            .populate('vesselId', 'name imoNumber type hullNumber serialNumber metadata')
            .populate('senderId', 'name type')
            .populate('recipientVendorIds', 'name type portalType')
            .lean();
        if (!rfq) {
            throw new Error('RFQ not found');
        }
        // Convert to plain object and ensure all fields are accessible
        return rfq;
    }
    async updateRFQ(rfqId, organizationId, data) {
        const rfq = await RFQ.findOne({ _id: rfqId, organizationId });
        if (!rfq) {
            throw new Error('RFQ not found');
        }
        Object.assign(rfq, data);
        await rfq.save();
        return rfq;
    }
    async deleteRFQ(rfqId, organizationId) {
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
    async getRFQsForVendor(vendorOrganizationId, filters) {
        const vendorObjectId = new mongoose.Types.ObjectId(vendorOrganizationId);
        const query = {
            recipientVendorIds: { $in: [vendorObjectId] }, // Use $in to match array field
        };
        // Map filter status values to actual RFQ status values
        if (filters?.status && filters.status !== 'all') {
            // Map vendor portal filter values to actual status values
            const statusMap = {
                'rfq-received': ['draft', 'sent'], // Draft and sent RFQs are "received" by vendor
                'quote-sent': 'quoted',
                'order-confirmed': 'ordered',
                'order-cancelled': 'cancelled',
                'order-completed': 'completed',
            };
            const mappedStatus = statusMap[filters.status] || filters.status;
            if (Array.isArray(mappedStatus)) {
                query.status = { $in: mappedStatus };
            }
            else {
                query.status = mappedStatus;
            }
        }
        logger.info(`[RFQ Service] Querying RFQs for vendor: ${vendorOrganizationId}`);
        logger.info(`[RFQ Service] Query: ${JSON.stringify(query, null, 2)}`);
        const rfqs = await RFQ.find(query)
            .populate('vesselId', 'name imoNumber type hullNumber serialNumber metadata')
            .populate('senderId', 'name type') // Populate sender organization
            .sort({ createdAt: -1 })
            .lean(); // Return plain objects for better performance
        logger.info(`[RFQ Service] Found ${rfqs.length} RFQs for vendor ${vendorOrganizationId}`);
        // Transform RFQs to include quotation status if vendor has submitted a quotation
        const { Quotation } = await import('../models/quotation.model');
        const rfqIds = rfqs.map((rfq) => rfq._id);
        let quotations = [];
        if (rfqIds.length > 0) {
            quotations = await Quotation.find({
                rfqId: { $in: rfqIds },
                organizationId: vendorObjectId,
            }).lean();
        }
        const quotationMap = new Map();
        quotations.forEach((q) => {
            const rfqIdStr = q.rfqId?.toString();
            if (rfqIdStr) {
                quotationMap.set(rfqIdStr, q.status);
            }
        });
        // Add quotation status to RFQs
        return rfqs.map((rfq) => {
            const rfqIdStr = rfq._id?.toString();
            const quotationStatus = quotationMap.get(rfqIdStr);
            // If vendor has submitted a quotation, show 'quoted' status
            if (quotationStatus === 'submitted' || quotationStatus === 'finalized') {
                return { ...rfq, status: 'quoted' };
            }
            // Otherwise, keep original status (sent/draft = RFQ Received)
            return rfq;
        });
    }
    /**
     * Get a specific RFQ for a vendor by ID
     */
    async getRFQForVendorById(rfqId, vendorOrganizationId) {
        const vendorObjectId = new mongoose.Types.ObjectId(vendorOrganizationId);
        const rfq = await RFQ.findOne({
            _id: rfqId,
            recipientVendorIds: { $in: [vendorObjectId] }, // Ensure vendor is a recipient
        })
            .populate('vesselId', 'name imoNumber type hullNumber serialNumber metadata')
            .populate('senderId', 'name type')
            .lean(); // Return plain JavaScript objects
        if (!rfq) {
            throw new Error('RFQ not found or you do not have access to this RFQ');
        }
        return rfq;
    }
    /**
     * Get all RFQs for admin portal (both from admin and customers)
     */
    async getAllRFQs(filters) {
        const query = {};
        // Map frontend filter status values to actual RFQ status values
        if (filters?.status && filters.status !== 'all') {
            const statusMap = {
                'rfq-received': ['draft', 'sent'], // Draft and sent RFQs are "received"
                'quote-sent': 'quoted',
                'order-confirmed': 'ordered',
                'order-cancelled': 'cancelled',
                'order-completed': 'completed',
            };
            const mappedStatus = statusMap[filters.status] || filters.status;
            if (Array.isArray(mappedStatus)) {
                query.status = { $in: mappedStatus };
            }
            else {
                query.status = mappedStatus;
            }
        }
        if (filters?.senderType) {
            query.senderType = filters.senderType;
        }
        const rfqs = await RFQ.find(query)
            .populate('vesselId', 'name imoNumber type')
            .populate('senderId', 'name type') // Populate sender organization
            .populate('organizationId', 'name type') // Populate organization
            .sort({ createdAt: -1 })
            .lean(); // Convert to plain objects for better performance
        return rfqs;
    }
    /**
     * Get available vendors for RFQ creation
     * - Admin: returns only admin-invited vendors with approved onboarding
     * - Customer: returns only customer-invited vendors (visible to that customer) with approved onboarding
     */
    async getAvailableVendorsForRFQ(requesterOrganizationId, requesterPortalType) {
        const filters = {
            requesterPortalType,
        };
        if (requesterPortalType === PortalType.CUSTOMER) {
            filters.customerOrganizationId = requesterOrganizationId;
        }
        // For admin/tech, no customerOrganizationId filter - they see all admin-invited vendors
        const vendors = await organizationService.getOrganizations(OrganizationType.VENDOR, PortalType.VENDOR, filters);
        // Get all vendor organization IDs
        const vendorIds = vendors.map((v) => new mongoose.Types.ObjectId(v._id || v.id));
        // Check which vendors have approved onboarding
        const approvedOnboardings = await VendorOnboarding.find({
            organizationId: { $in: vendorIds },
            status: 'approved',
        }).select('organizationId');
        const approvedVendorIds = new Set(approvedOnboardings.map((onboarding) => onboarding.organizationId?.toString()));
        // Filter vendors based on portal type and approval status
        let filteredVendors = [];
        if (requesterPortalType === PortalType.ADMIN || requesterPortalType === PortalType.TECH) {
            // For admin/tech: admin-invited vendors with approved onboarding
            filteredVendors = vendors.filter((v) => {
                const vendorId = (v._id || v.id)?.toString();
                return v.isAdminInvited === true && approvedVendorIds.has(vendorId);
            });
        }
        else {
            // For customers: vendors they have access to with approved onboarding
            filteredVendors = vendors.filter((v) => {
                const vendorId = (v._id || v.id)?.toString();
                // Must have approved onboarding
                if (!approvedVendorIds.has(vendorId)) {
                    return false;
                }
                // Customer-invited vendors
                if (!v.isAdminInvited && v.invitedByOrganizationId?.toString() === requesterOrganizationId) {
                    return true;
                }
                // Admin-invited vendors visible to this customer
                if (v.isAdminInvited && v.visibleToCustomerIds?.some((id) => id.toString() === requesterOrganizationId)) {
                    return true;
                }
                return false;
            });
        }
        return filteredVendors;
    }
}
export const rfqService = new RFQService();
//# sourceMappingURL=rfq.service.js.map