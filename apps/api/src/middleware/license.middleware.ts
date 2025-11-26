import { Response, NextFunction } from 'express';
import { licenseService } from '../services/license.service';
import { AuthRequest } from './auth.middleware';
import { logger } from '../config/logger';

export async function validateLicense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Tech and Admin portals don't need license validation
    if (req.user.portalType === 'tech' || req.user.portalType === 'admin') {
      return next();
    }

    // Check if organizationId exists and is not empty
    if (!req.user.organizationId || req.user.organizationId === '') {
      logger.error('License validation failed: No organizationId in token', {
        userId: req.user.userId,
        email: req.user.email,
        portalType: req.user.portalType,
      });
      return res.status(403).json({
        success: false,
        error: 'No valid license found. User is not associated with an organization.',
      });
    }

    // Validate license for customer/vendor portals
    logger.debug('Validating license', {
      organizationId: req.user.organizationId,
      portalType: req.user.portalType,
    });
    
    await licenseService.validateLicense(req.user.organizationId);

    next();
  } catch (error: any) {
    logger.error('License validation error:', {
      error: error.message,
      organizationId: req.user?.organizationId,
      portalType: req.user?.portalType,
      userId: req.user?.userId,
    });
    res.status(403).json({
      success: false,
      error: error.message || 'License validation failed',
    });
  }
}






