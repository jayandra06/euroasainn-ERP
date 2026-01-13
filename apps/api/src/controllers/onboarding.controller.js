import { onboardingService } from '../services/onboarding.service';
import { invitationService } from '../services/invitation.service';
import { logger } from '../config/logger';
export class OnboardingController {
    async getInvitationByToken(req, res) {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Invitation token is required',
                });
            }
            const invitation = await invitationService.getInvitationByToken(token);
            // If this is a vendor invitation, check if it was invited by a customer
            let invitedByCustomerName = null;
            if (invitation.organizationType === 'vendor' && invitation.organizationId) {
                const { Organization } = await import('../models/organization.model');
                const vendorOrg = await Organization.findById(invitation.organizationId);
                if (vendorOrg?.invitedByOrganizationId) {
                    const customerOrg = await Organization.findById(vendorOrg.invitedByOrganizationId);
                    invitedByCustomerName = customerOrg?.name || null;
                }
            }
            res.status(200).json({
                success: true,
                data: {
                    email: invitation.email,
                    organizationType: invitation.organizationType,
                    organizationId: invitation.organizationId,
                    expiresAt: invitation.expiresAt,
                    invitedByCustomerName,
                },
            });
        }
        catch (error) {
            logger.error('Get invitation error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Invalid or expired invitation token',
            });
        }
    }
    async submitCustomerOnboarding(req, res) {
        try {
            const { token, ...onboardingData } = req.body;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Invitation token is required',
                });
            }
            const onboarding = await onboardingService.submitCustomerOnboarding(onboardingData, token);
            res.status(201).json({
                success: true,
                data: onboarding,
                message: 'Customer onboarding submitted successfully',
            });
        }
        catch (error) {
            logger.error('Submit customer onboarding error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to submit customer onboarding',
            });
        }
    }
    async submitVendorOnboarding(req, res) {
        try {
            const { token, ...onboardingData } = req.body;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: 'Invitation token is required',
                });
            }
            const onboarding = await onboardingService.submitVendorOnboarding(onboardingData, token);
            res.status(201).json({
                success: true,
                data: onboarding,
                message: 'Vendor onboarding submitted successfully',
            });
        }
        catch (error) {
            logger.error('Submit vendor onboarding error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to submit vendor onboarding',
            });
        }
    }
    async getCustomerOnboardings(req, res) {
        try {
            const filters = {};
            if (req.query.organizationId) {
                filters.organizationId = req.query.organizationId;
            }
            if (req.query.status) {
                filters.status = req.query.status;
            }
            const onboardings = await onboardingService.getCustomerOnboardings(filters);
            res.status(200).json({
                success: true,
                data: onboardings,
            });
        }
        catch (error) {
            logger.error('Get customer onboardings error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get customer onboardings',
            });
        }
    }
    async getVendorOnboardings(req, res) {
        try {
            const filters = {};
            if (req.query.organizationId) {
                filters.organizationId = req.query.organizationId;
            }
            if (req.query.status) {
                filters.status = req.query.status;
            }
            const onboardings = await onboardingService.getVendorOnboardings(filters);
            res.status(200).json({
                success: true,
                data: onboardings,
            });
        }
        catch (error) {
            logger.error('Get vendor onboardings error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to get vendor onboardings',
            });
        }
    }
    async getCustomerOnboardingById(req, res) {
        try {
            const { id } = req.params;
            const onboarding = await onboardingService.getCustomerOnboardingById(id);
            res.status(200).json({
                success: true,
                data: onboarding,
            });
        }
        catch (error) {
            logger.error('Get customer onboarding error:', error);
            res.status(404).json({
                success: false,
                error: error.message || 'Customer onboarding not found',
            });
        }
    }
    async getVendorOnboardingById(req, res) {
        try {
            const { id } = req.params;
            const onboarding = await onboardingService.getVendorOnboardingById(id);
            res.status(200).json({
                success: true,
                data: onboarding,
            });
        }
        catch (error) {
            logger.error('Get vendor onboarding error:', error);
            res.status(404).json({
                success: false,
                error: error.message || 'Vendor onboarding not found',
            });
        }
    }
    async approveCustomerOnboarding(req, res) {
        try {
            const { id } = req.params;
            logger.info(`📥 Received request to approve customer onboarding: ${id}`);
            const onboarding = await onboardingService.approveCustomerOnboarding(id);
            res.status(200).json({
                success: true,
                data: {
                    ...onboarding.toObject(),
                    organizationId: onboarding.organizationId,
                },
                message: 'Customer onboarding approved successfully. License has been created automatically.',
            });
        }
        catch (error) {
            logger.error('❌ Approve customer onboarding error:', error);
            logger.error(`   Error message: ${error.message}`);
            logger.error(`   Error stack: ${error.stack}`);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to approve customer onboarding',
            });
        }
    }
    async rejectCustomerOnboarding(req, res) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;
            const onboarding = await onboardingService.rejectCustomerOnboarding(id, rejectionReason);
            res.status(200).json({
                success: true,
                data: onboarding,
                message: 'Customer onboarding rejected successfully',
            });
        }
        catch (error) {
            logger.error('Reject customer onboarding error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to reject customer onboarding',
            });
        }
    }
    async approveVendorOnboarding(req, res) {
        try {
            const { id } = req.params;
            const onboarding = await onboardingService.approveVendorOnboarding(id);
            res.status(200).json({
                success: true,
                data: {
                    ...onboarding.toObject(),
                    organizationId: onboarding.organizationId,
                },
                message: 'Vendor onboarding approved successfully. License has been created automatically.',
            });
        }
        catch (error) {
            logger.error('Approve vendor onboarding error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to approve vendor onboarding',
            });
        }
    }
    async rejectVendorOnboarding(req, res) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;
            const onboarding = await onboardingService.rejectVendorOnboarding(id, rejectionReason);
            res.status(200).json({
                success: true,
                data: onboarding,
                message: 'Vendor onboarding rejected successfully',
            });
        }
        catch (error) {
            logger.error('Reject vendor onboarding error:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to reject vendor onboarding',
            });
        }
    }
}
export const onboardingController = new OnboardingController();
//# sourceMappingURL=onboarding.controller.js.map