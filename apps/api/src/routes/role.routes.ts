import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleController } from '../controllers/role.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', roleController.listRoles.bind(roleController));
router.post('/', roleController.createRole.bind(roleController));
router.put('/:id', roleController.updateRole.bind(roleController));

export default router;




