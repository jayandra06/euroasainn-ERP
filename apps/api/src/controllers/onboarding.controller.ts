import { Request, Response } from 'express';
import { onboardingService } from '../services/onboarding.service';
import { invitationService } from '../services/invitation.service';
import { logger } from '../config/logger';

export class OnboardingController {
  async getInvitationByToken(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invitation token is required',
        });
      }

      const invitation = await invitationService.getInvitationByToken(token);

      res.status(200).json({
        success: true,
        data: {
          email: invitation.email,
          organizationType: invitation.organizationType,
          organizationId: invitation.organizationId,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error: any) {
      logger.error('Get invitation error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Invalid or expired invitation token',
      });
    }
  }

  async submitCustomerOnboarding(req: Request, res: Response) {
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
    } catch (error: any) {
      logger.error('Submit customer onboarding error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to submit customer onboarding',
      });
    }
  }

  async submitVendorOnboarding(req: Request, res: Response) {
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
    } catch (error: any) {
      logger.error('Submit vendor onboarding error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to submit vendor onboarding',
      });
    }
  }

  async getCustomerOnboardings(req: Request, res: Response) {
    try {
      const filters: any = {};
      if (req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      const onboardings = await onboardingService.getCustomerOnboardings(filters);

      res.status(200).json({
        success: true,
        data: onboardings,
      });
    } catch (error: any) {
      logger.error('Get customer onboardings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get customer onboardings',
      });
    }
  }

  async getVendorOnboardings(req: Request, res: Response) {
    try {
      const filters: any = {};
      if (req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }

      const onboardings = await onboardingService.getVendorOnboardings(filters);

      res.status(200).json({
        success: true,
        data: onboardings,
      });
    } catch (error: any) {
      logger.error('Get vendor onboardings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get vendor onboardings',
      });
    }
  }

  async getCustomerOnboardingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const onboarding = await onboardingService.getCustomerOnboardingById(id);

      res.status(200).json({
        success: true,
        data: onboarding,
      });
    } catch (error: any) {
      logger.error('Get customer onboarding error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Customer onboarding not found',
      });
    }
  }

  async getVendorOnboardingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const onboarding = await onboardingService.getVendorOnboardingById(id);

      res.status(200).json({
        success: true,
        data: onboarding,
      });
    } catch (error: any) {
      logger.error('Get vendor onboarding error:', error);
      res.status(404).json({
        success: false,
        error: error.message || 'Vendor onboarding not found',
      });
    }
  }
}

export const onboardingController = new OnboardingController();

