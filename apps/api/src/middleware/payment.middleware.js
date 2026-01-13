import { paymentService } from '../services/payment.service';
import { logger } from '../config/logger';
import { OrganizationType } from '../../../../packages/shared/src/types/index.ts';
/**
 * Middleware to check if user's organization has active payment
 * Blocks access if payment is not active
 * External vendors (invited by customers) don't need payment
 */
export async function paymentStatusMiddleware(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
        }
        // Get user's organization
        const { User } = await import('../models/user.model');
        const { Organization } = await import('../models/organization.model');
        const user = await User.findById(userId);
        if (!user || !user.organizationId) {
            return res.status(403).json({
                success: false,
                error: 'Organization not found. Please complete your onboarding first.',
            });
        }
        // Check if this is a vendor organization
        const organization = await Organization.findById(user.organizationId);
        if (!organization) {
            logger.warn(`Organization not found for user ${userId}, organizationId: ${user.organizationId}`);
            return res.status(403).json({
                success: false,
                error: 'Organization not found. Please complete your onboarding first.',
            });
        }
        // Check if this is a vendor organization (use both string and enum comparison)
        const orgType = String(organization.type).toLowerCase();
        const isVendorOrg = orgType === 'vendor' || orgType === OrganizationType.VENDOR.toLowerCase();
        if (isVendorOrg) {
            // External vendors (invited by customer) don't need payment
            // Check multiple conditions to identify external vendors (in order of reliability):
            // 1. invitedBy === 'customer' (explicitly set - most reliable)
            // 2. invitedByOrganizationId exists (customer organization invited them - very reliable)
            // 3. isAdminInvited === false AND invitedBy is not 'admin' or 'tech' (not admin-invited)
            const hasInvitedByOrgId = !!(organization.invitedByOrganizationId && organization.invitedByOrganizationId.toString());
            const invitedBy = organization.invitedBy ? String(organization.invitedBy).toLowerCase() : null;
            const isAdminInvited = organization.isAdminInvited === true; // Explicitly true, not just truthy
            const isExternalVendor = invitedBy === 'customer' ||
                hasInvitedByOrgId ||
                (!isAdminInvited && invitedBy !== 'admin' && invitedBy !== 'tech');
            logger.info(`Vendor organization check - ${organization.name}: type=${orgType}, invitedBy=${invitedBy || 'undefined'}, hasInvitedByOrgId=${hasInvitedByOrgId}, isAdminInvited=${isAdminInvited}, isExternalVendor=${isExternalVendor}`);
            if (isExternalVendor) {
                logger.info(`✅ External vendor (invited by customer) - skipping payment check for organization: ${organization.name}`);
                return next(); // Allow access without payment
            }
            // Internal vendors (invited by admin/tech) need payment
            logger.info(`🔒 Internal vendor (invited by ${invitedBy || 'admin/tech'}) - checking payment status for organization: ${organization.name}`);
        }
        // Check payment status for all other organizations (customers, internal vendors)
        const { hasActivePayment } = await paymentService.checkOrganizationPaymentStatus(user.organizationId.toString());
        if (!hasActivePayment) {
            return res.status(403).json({
                success: false,
                error: 'Payment required. Please complete your subscription payment to access the portal.',
                requiresPayment: true,
            });
        }
        // Payment is active, allow access
        next();
    }
    catch (error) {
        logger.error('Payment status middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify payment status',
        });
    }
}
//# sourceMappingURL=payment.middleware.js.map