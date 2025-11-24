import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { logger } from '../config/logger';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to check if user's organization has active payment
 * Blocks access if payment is not active
 */
export async function paymentStatusMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
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
    const user = await User.findById(userId);
    
    if (!user || !user.organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Organization not found. Please complete your onboarding first.',
      });
    }

    // Check payment status
    const { hasActivePayment } = await paymentService.checkOrganizationPaymentStatus(
      user.organizationId.toString()
    );

    if (!hasActivePayment) {
      return res.status(403).json({
        success: false,
        error: 'Payment required. Please complete your subscription payment to access the portal.',
        requiresPayment: true,
      });
    }

    // Payment is active, allow access
    next();
  } catch (error: any) {
    logger.error('Payment status middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment status',
    });
  }
}

