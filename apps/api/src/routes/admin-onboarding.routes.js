import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePortal } from '../middleware/portal.middleware';
import { PortalType } from '../../../../packages/shared/src/types/index.ts';
const router = Router();
// Admin routes (auth required) - for viewing onboarding data
router.use(authMiddleware);
router.use(requirePortal(PortalType.ADMIN));
router.get('/customer-onboardings', onboardingController.getCustomerOnboardings.bind(onboardingController));
router.get('/vendor-onboardings', onboardingController.getVendorOnboardings.bind(onboardingController));
router.get('/customer-onboardings/:id', onboardingController.getCustomerOnboardingById.bind(onboardingController));
router.get('/vendor-onboardings/:id', onboardingController.getVendorOnboardingById.bind(onboardingController));
router.post('/customer-onboardings/:id/approve', onboardingController.approveCustomerOnboarding.bind(onboardingController));
router.post('/customer-onboardings/:id/reject', onboardingController.rejectCustomerOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/approve', onboardingController.approveVendorOnboarding.bind(onboardingController));
router.post('/vendor-onboardings/:id/reject', onboardingController.rejectVendorOnboarding.bind(onboardingController));
export default router;
//# sourceMappingURL=admin-onboarding.routes.js.map