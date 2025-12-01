import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));
router.get('/me', authMiddleware, authController.getMe.bind(authController));
router.post('/change-password', authMiddleware, authController.changePassword.bind(authController));
router.put('/preferences', authMiddleware, authController.updatePreferences.bind(authController));
router.put('/security-question', authMiddleware, authController.updateSecurityQuestion.bind(authController));

export default router;
