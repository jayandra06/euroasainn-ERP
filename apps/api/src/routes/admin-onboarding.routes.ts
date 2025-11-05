import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { PortalType } from '@euroasiann/shared';

const router = Router();

// Admin routes (auth required) - for viewing onboarding data
router.use(authMiddleware);
router.use(requirePortal(PortalType.ADMIN));

router.get('/customer-onboardings', onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get('/vendor-onboardings', onboardingController.getVendorOnboardings.bind(onboardingController));
router.get('/customer-onboardings/:id', onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get('/vendor-onboardings/:id', onboardingController.getVendorOnboardingById.bind(onboardingController));

export default router;

