import { Quotation, IQuotation } from '../models/quotation.model';
import { v4 as uuidv4 } from 'uuid';

export class QuotationService {
  generateQuotationNumber(): string {
    return `QUO-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  async createQuotation(organizationId: string, data: Partial<IQuotation>) {
    const { emailService } = await import('./email.service');
    const { RFQ } = await import('../models/rfq.model');
    const { Organization } = await import('../models/organization.model');
    const { User } = await import('../models/user.model');
    const { logger } = await import('../config/logger');
    const mongoose = await import('mongoose');
    
    // Transform items from frontend format to model format
    // Frontend sends: { description, requiredQty, quotedPrice, offeredQty, offeredQuality }
    // Model expects: { itemId, quantity, unitPrice, total }
    let transformedItems: any[] = [];
    if (data.items && Array.isArray(data.items)) {
      transformedItems = data.items.map((item: any) => {
        // If item already has the model format, use it
        if (item.itemId && item.quantity && item.unitPrice !== undefined && item.total !== undefined) {
          return item;
        }
        
        // Otherwise, transform from frontend format
        const quantity = Number(item.offeredQty) || Number(item.requiredQty) || Number(item.quantity) || 0;
        const unitPrice = Number(item.quotedPrice) || Number(item.unitPrice) || 0;
        const total = quantity * unitPrice;
        
        // Create a dummy ObjectId for itemId (since we don't have actual Item references)
        // The actual item details are stored in metadata
        const dummyItemId = new mongoose.Types.ObjectId();
        
        return {
          itemId: dummyItemId,
          quantity: Math.max(0, quantity), // Ensure non-negative
          unitPrice: Math.max(0, unitPrice), // Ensure non-negative
          total: Math.max(0, total), // Ensure non-negative
        };
      });
    }
    
    // Extract metadata items (frontend format) to store separately
    const metadataItems = data.items || [];
    const metadataTerms = (data as any).metadata?.terms || {};
    
    const quotation = new Quotation({
      ...data,
      organizationId,
      quotationNumber: this.generateQuotationNumber(),
      status: data.status || 'submitted',
      items: transformedItems, // Use transformed items for model validation
      metadata: {
        ...(data.metadata || {}),
        items: metadataItems, // Store original frontend format in metadata
        terms: metadataTerms, // Store terms in metadata
      },
    });

    await quotation.save();

    // Send email to customer with quotation details
    try {
      if (quotation.rfqId) {
        const rfq = await RFQ.findById(quotation.rfqId)
          .populate('organizationId', 'name')
          .lean();
        
        if (rfq && rfq.organizationId) {
          // Get customer organization admin users
          const customerOrgId = (rfq.organizationId as any)._id || rfq.organizationId;
          const customerUsers = await User.find({
            organizationId: customerOrgId,
            portalType: 'customer',
            role: 'customer_admin',
          }).limit(1);

          if (customerUsers.length > 0) {
            const customerUser = customerUsers[0];
            const vendorOrg = await Organization.findById(organizationId).lean();
            
            await emailService.sendQuotationNotificationEmail({
              to: customerUser.email,
              firstName: customerUser.firstName || 'Customer',
              lastName: customerUser.lastName || 'Admin',
              vendorOrganizationName: (vendorOrg as any)?.name || 'Vendor',
              quotationNumber: quotation.quotationNumber,
              rfqNumber: rfq.rfqNumber || 'N/A',
              quotationLink: `${process.env.CUSTOMER_PORTAL_URL || 'http://localhost:3000'}/rfqs/${quotation.rfqId}`,
              quotationDetails: {
                items: quotation.metadata?.items || [],
                terms: quotation.metadata?.terms || {},
                totalAmount: quotation.totalAmount,
                currency: quotation.currency,
              },
            });
            
            logger.info(`✅ Quotation notification email sent to ${customerUser.email} for RFQ ${rfq.rfqNumber}`);
          }
        }
      }
    } catch (emailError: any) {
      logger.error(`❌ Failed to send quotation email: ${emailError.message}`);
      // Don't throw - quotation is already saved
    }

    return quotation;
  }

  async getQuotations(organizationId: string, filters?: any) {
    const query: any = { organizationId };
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.rfqId) {
      query.rfqId = filters.rfqId;
    }
    return await Quotation.find(query);
  }

  /**
   * Get quotation by RFQ ID for a specific vendor
   * Returns the quotation if it exists, null otherwise
   */
  async getQuotationByRFQIdForVendor(rfqId: string, vendorOrganizationId: string) {
    const mongoose = await import('mongoose');
    const rfqObjectId = new mongoose.Types.ObjectId(rfqId);
    const vendorObjectId = new mongoose.Types.ObjectId(vendorOrganizationId);
    
    const quotation = await Quotation.findOne({
      rfqId: rfqObjectId,
      organizationId: vendorObjectId,
    })
      .lean();
    
    if (!quotation) {
      return null;
    }
    
    // Transform to match frontend expectations
    return {
      _id: quotation._id,
      quotationNumber: quotation.quotationNumber,
      title: quotation.title,
      description: quotation.description,
      status: quotation.status,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      submittedAt: quotation.createdAt,
      items: quotation.metadata?.items || quotation.items?.map((item: any) => ({
        description: item.description || '-',
        requiredQty: item.requiredQty || item.quantity || 0,
        quotedPrice: item.quotedPrice || item.unitPrice || 0,
        offeredQty: item.offeredQty || item.quantity || 0,
        offeredQuality: item.offeredQuality || 'Standard',
      })) || [],
      terms: quotation.metadata?.terms || {
        creditType: quotation.metadata?.creditType,
        paymentTerm: quotation.metadata?.paymentTerm,
        insuranceTerm: quotation.metadata?.insuranceTerm,
        taxTerm: quotation.metadata?.taxTerm,
        transportTerm: quotation.metadata?.transportTerm,
        deliveryTerm: quotation.metadata?.deliveryTerm,
        packingTerm: quotation.metadata?.packingTerm,
        currency: quotation.currency,
      },
    };
  }

  async getQuotationById(quotationId: string, organizationId: string) {
    const quotation = await Quotation.findOne({ _id: quotationId, organizationId });
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    return quotation;
  }

  async updateQuotation(quotationId: string, organizationId: string, data: Partial<IQuotation>) {
    const quotation = await Quotation.findOne({ _id: quotationId, organizationId });
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    Object.assign(quotation, data);
    await quotation.save();
    return quotation;
  }

  async deleteQuotation(quotationId: string, organizationId: string) {
    const quotation = await Quotation.findOneAndDelete({ _id: quotationId, organizationId });
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    return { success: true };
  }

  /**
   * Create an admin quotation (special offer)
   * Admin quotations don't have organizationId, they're marked with isAdminOffer: true
   */
  async createAdminQuotation(data: Partial<IQuotation>) {
    const mongoose = await import('mongoose');
    
    // Transform items from frontend format to model format
    let transformedItems: any[] = [];
    if (data.items && Array.isArray(data.items)) {
      transformedItems = data.items.map((item: any) => {
        if (item.itemId && item.quantity && item.unitPrice !== undefined && item.total !== undefined) {
          return item;
        }
        
        const quantity = Number(item.offeredQty) || Number(item.requiredQty) || Number(item.quantity) || 0;
        const unitPrice = Number(item.quotedPrice) || Number(item.unitPrice) || 0;
        const total = quantity * unitPrice;
        const dummyItemId = new mongoose.Types.ObjectId();
        
        return {
          itemId: dummyItemId,
          quantity: Math.max(0, quantity),
          unitPrice: Math.max(0, unitPrice),
          total: Math.max(0, total),
        };
      });
    }
    
    const metadataItems = data.items || [];
    const metadataTerms = (data as any).metadata?.terms || {};
    
    // For admin quotations, we use a special organizationId or null
    // We'll use a dummy ObjectId to satisfy the schema requirement
    const adminOrgId = new mongoose.Types.ObjectId('000000000000000000000000'); // Dummy admin org ID
    
    const quotation = new Quotation({
      ...data,
      organizationId: adminOrgId, // Dummy org ID for admin
      quotationNumber: this.generateQuotationNumber(),
      status: data.status || 'submitted',
      items: transformedItems,
      isAdminOffer: true, // Mark as admin offer
      metadata: {
        ...(data.metadata || {}),
        items: metadataItems,
        terms: metadataTerms,
      },
    });

    await quotation.save();
    return quotation;
  }

  /**
   * Get admin quotation by RFQ ID
   */
  async getQuotationByRFQIdForAdmin(rfqId: string) {
    const quotation = await Quotation.findOne({
      rfqId: rfqId,
      isAdminOffer: true,
    })
      .lean();
    
    if (!quotation) {
      return null;
    }
    
    // Transform to match frontend expectations
    return {
      _id: quotation._id,
      quotationNumber: quotation.quotationNumber,
      title: quotation.title,
      description: quotation.description,
      status: quotation.status,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      submittedAt: quotation.createdAt,
      isAdminOffer: quotation.isAdminOffer,
      items: quotation.metadata?.items || quotation.items?.map((item: any) => ({
        description: item.description || '-',
        requiredQty: item.requiredQty || item.quantity || 0,
        quotedPrice: item.quotedPrice || item.unitPrice || 0,
        offeredQty: item.offeredQty || item.quantity || 0,
        offeredQuality: item.offeredQuality || 'Standard',
      })) || [],
      terms: quotation.metadata?.terms || {
        creditType: quotation.metadata?.creditType,
        paymentTerm: quotation.metadata?.paymentTerm,
        insuranceTerm: quotation.metadata?.insuranceTerm,
        taxTerm: quotation.metadata?.taxTerm,
        transportTerm: quotation.metadata?.transportTerm,
        deliveryTerm: quotation.metadata?.deliveryTerm,
        packingTerm: quotation.metadata?.packingTerm,
        currency: quotation.currency,
      },
    };
  }

  /**
   * Get all quotations for a specific RFQ (for customer portal)
   * Returns quotations from all vendors for the given RFQ, plus admin quotations
   */
  async getQuotationsByRFQId(rfqId: string) {
    const mongoose = await import('mongoose');
    const rfqObjectId = new mongoose.Types.ObjectId(rfqId);
    
    const quotations = await Quotation.find({ rfqId: rfqObjectId })
      .populate('organizationId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    // Transform quotations to match frontend expectations
    return quotations.map((q: any) => ({
      _id: q._id,
      quotationNumber: q.quotationNumber,
      vendorOrganizationId: q.isAdminOffer ? {
        _id: null,
        name: 'Admin Special Offer',
      } : {
        _id: q.organizationId?._id || q.organizationId,
        name: q.organizationId?.name || 'Unknown Vendor',
      },
      isAdminOffer: q.isAdminOffer || false, // Include isAdminOffer field
      status: q.status || 'submitted',
      submittedAt: q.createdAt,
      items: q.metadata?.items || q.items?.map((item: any) => ({
        description: item.description || item.itemId?.name || '-',
        requiredQty: item.requiredQty || item.quantity || 0,
        quotedPrice: item.quotedPrice || item.unitPrice || 0,
        offeredQty: item.offeredQty || item.quantity || 0,
        offeredQuality: item.offeredQuality || 'Standard',
      })) || [],
      terms: q.metadata?.terms || {
        creditType: q.metadata?.creditType,
        paymentTerm: q.metadata?.paymentTerm,
        insuranceTerm: q.metadata?.insuranceTerm,
        taxTerm: q.metadata?.taxTerm,
        transportTerm: q.metadata?.transportTerm,
        deliveryTerm: q.metadata?.deliveryTerm,
        packingTerm: q.metadata?.packingTerm,
        currency: q.currency || q.metadata?.currency,
      },
      totalAmount: q.totalAmount,
      currency: q.currency,
    }));
  }

  /**
   * Finalize an offer (customer selects a vendor quotation)
   * Updates quotation status to 'finalized' and RFQ status to 'ordered'
   * Sends email notification to vendor to submit banking details
   */
  async finalizeOffer(quotationId: string, customerOrganizationId: string) {
    const { RFQ } = await import('../models/rfq.model');
    const { Organization } = await import('../models/organization.model');
    const { User } = await import('../models/user.model');
    const { logger } = await import('../config/logger');
    const { emailService } = await import('./email.service');
    
    // Find the quotation
    const quotation = await Quotation.findById(quotationId)
      .populate('organizationId', 'name');
    
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    // Verify the quotation belongs to an RFQ that belongs to this customer
    let rfq: any = null;
    if (quotation.rfqId) {
      rfq = await RFQ.findById(quotation.rfqId)
        .populate('organizationId', 'name');
      if (!rfq) {
        throw new Error('RFQ not found');
      }
      
      // Verify the RFQ belongs to the customer organization
      // Handle both populated object and ObjectId cases
      const rfqOrgId = rfq.organizationId?._id 
        ? rfq.organizationId._id.toString() 
        : rfq.organizationId?.toString();
      const customerOrgIdStr = customerOrganizationId.toString();
      
      if (rfqOrgId !== customerOrgIdStr) {
        logger.warn(`Permission denied: RFQ orgId (${rfqOrgId}) !== Customer orgId (${customerOrgIdStr})`);
        throw new Error('You do not have permission to finalize this offer');
      }

      // Update RFQ status to 'ordered'
      rfq.status = 'ordered';
      await rfq.save();
      logger.info(`✅ RFQ ${rfq.rfqNumber} status updated to 'ordered'`);
    }

    // Update quotation status to 'finalized'
    quotation.status = 'finalized';
    await quotation.save();
    
    logger.info(`✅ Quotation ${quotation.quotationNumber} finalized by customer ${customerOrganizationId}`);
    
    // Send email notification to vendor
    try {
      const vendorOrganizationId = quotation.organizationId?._id || quotation.organizationId;
      if (vendorOrganizationId) {
        // Get vendor organization details
        const vendorOrg = await Organization.findById(vendorOrganizationId).lean();
        const vendorOrgName = (vendorOrg as any)?.name || 'Vendor';
        
        // Get customer organization details
        const customerOrg = await Organization.findById(customerOrganizationId).lean();
        const customerOrgName = (customerOrg as any)?.name || 'Customer';
        
        // Get vendor admin users
        const vendorUsers = await User.find({
          organizationId: vendorOrganizationId,
          role: 'vendor_admin',
        }).limit(5); // Send to up to 5 vendor admins
        
        if (vendorUsers.length > 0) {
          // Get vendor portal URL
          const vendorPortalUrl = process.env.VENDOR_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4400';
          const quotationLink = `${vendorPortalUrl}/rfqs/${quotation.rfqId}`;
          
          // Calculate total amount
          const totalAmount = quotation.totalAmount || 
            (quotation.items?.reduce((sum: number, item: any) => 
              sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0) || 0);
          
          // Send email to each vendor admin
          for (const vendorUser of vendorUsers) {
            try {
              await emailService.sendQuotationFinalizedEmail({
                to: vendorUser.email,
                firstName: vendorUser.firstName || 'Vendor',
                lastName: vendorUser.lastName || 'Admin',
                vendorOrganizationName: vendorOrgName,
                quotationNumber: quotation.quotationNumber,
                rfqNumber: rfq?.rfqNumber || 'N/A',
                customerOrganizationName: customerOrgName,
                quotationLink,
                totalAmount,
                currency: quotation.currency || 'USD',
              });
              
              logger.info(`✅ Quotation finalized email sent to ${vendorUser.email} for quotation ${quotation.quotationNumber}`);
            } catch (emailError: any) {
              logger.error(`❌ Failed to send finalized email to ${vendorUser.email}: ${emailError.message}`);
              // Continue with other users even if one fails
            }
          }
        } else {
          logger.warn(`⚠️ No vendor admin users found for organization ${vendorOrganizationId} to send finalized email`);
        }
      }
    } catch (emailError: any) {
      logger.error(`❌ Failed to send quotation finalized email: ${emailError.message}`);
      // Don't throw - quotation is already finalized
    }
    
    return quotation;
  }
}

export const quotationService = new QuotationService();
