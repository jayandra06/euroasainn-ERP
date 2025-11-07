import { Response, NextFunction } from 'express';
import { licenseService } from '../services/license.service';
import { AuthRequest } from './auth.middleware';
import { logger } from '../config/logger';

export async function validateLicense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.organizationId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Tech and Admin portals don't need license validation
    if (req.user.portalType === 'tech' || req.user.portalType === 'admin') {
      return next();
    }

    // Validate license for customer/vendor portals
    await licenseService.validateLicense(req.user.organizationId);

    next();
  } catch (error: any) {
    logger.error('License validation error:', error);
    res.status(403).json({
      success: false,
      error: error.message || 'License validation failed',
    });
  }
}






