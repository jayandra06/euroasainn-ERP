import { Router } from "express";
import { permissionController } from "../controllers/permission.controller";
const router = Router();
// router.use(authMiddleware);
// GET /api/v1/permissions?portalType=tech
router.get("/", permissionController.getPermissions.bind(permissionController));
export default router;
//# sourceMappingURL=permission.routes.js.map