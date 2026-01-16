import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { permissionController } from "../controllers/permission.controller";

const router = Router();

// Enable auth middleware for permissions route
router.use(authMiddleware);

// GET /api/v1/permissions?portalType=vendor
router.get("/", permissionController.getPermissions.bind(permissionController));

export default router;
