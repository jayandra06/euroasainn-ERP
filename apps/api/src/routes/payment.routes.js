import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
const router = Router();
// All payment routes require authentication
router.use(authMiddleware);
// Create payment
router.post('/', paymentController.createPayment.bind(paymentController));
// Get payments by user
router.get('/user', paymentController.getPaymentsByUser.bind(paymentController));
// Get payments by organization
router.get('/organization/:organizationId', paymentController.getPaymentsByOrganization.bind(paymentController));
// Get payment by ID
router.get('/:id', paymentController.getPaymentById.bind(paymentController));
// Check payment status for current user's organization
router.get('/status/check', paymentController.checkPaymentStatus.bind(paymentController));
// Update payment status (for admin/webhook use)
router.put('/:id/status', paymentController.updatePaymentStatus.bind(paymentController));
// Verify payment after Razorpay checkout
router.post('/verify', paymentController.verifyPayment.bind(paymentController));
// Webhook endpoint (no auth required - will be secured with webhook secret in production)
router.post('/webhook', paymentController.handlePaymentWebhook.bind(paymentController));
export default router;
//# sourceMappingURL=payment.routes.js.map