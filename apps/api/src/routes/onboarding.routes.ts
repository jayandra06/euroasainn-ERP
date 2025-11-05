import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';

const router = Router();

// Public routes (no auth required) - for onboarding forms
router.get('/invitation', onboardingController.getInvitationByToken.bind(onboardingController));
router.post('/customer', onboardingController.submitCustomerOnboarding.bind(onboardingController));
router.post('/vendor', onboardingController.submitVendorOnboarding.bind(onboardingController));

export default router;

