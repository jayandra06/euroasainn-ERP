import { Router } from 'express';
import { assignRoleController } from '../controllers/assign-role.controller';
// import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// router.use(authMiddleware);   // uncomment later when auth is ready

// GET all users
router.get('/users', assignRoleController.listUsers.bind(assignRoleController));

// GET all roles
router.get('/roles', assignRoleController.listRoles.bind(assignRoleController));

// ASSIGN/CHANGE ROLE
router.put('/assign/:userId', assignRoleController.assignRole.bind(assignRoleController));

// REMOVE ROLE (RESET)
router.delete('/assign/:userId', assignRoleController.removeRole.bind(assignRoleController));

export default router;
