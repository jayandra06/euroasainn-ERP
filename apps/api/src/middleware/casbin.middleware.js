import { getCasbinEnforcer } from "../config/casbin";
import { User } from "../models/user.model";
import { ROUTE_PERMISSION_MAP } from "../../../../packages/casbin-config/src/route-permission.map";
import { PERMISSION_TO_CASBIN } from "../../../../packages/casbin-config/src/permission-casbin.map";
import { redisService } from "../services/redis.service";
/* =========================
   MIDDLEWARE
========================= */
export async function casbinMiddleware(req, res, next) {
    try {
        console.log("\n================ CASBIN MIDDLEWARE START ================");
        /* =========================
           1️⃣ AUTH USER
        ========================= */
        const tokenUser = req.user;
        console.log("🧑 Token User:", tokenUser);
        if (!tokenUser) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
            });
        }
        /* =========================
           2️⃣ LOAD USER (REDIS → DB)
        ========================= */
        const userId = tokenUser.userId || tokenUser._id;
        const userCacheKey = `user:${userId}`;
        let user = null;
        // 🔹 Try Redis
        try {
            const cached = await redisService.getCache(userCacheKey);
            if (cached) {
                user = JSON.parse(cached);
                user.casbinSubject = user._id.toString();
                user.casbinOrg = user.organizationId?.toString();
                console.log("✅ User loaded from Redis:", user);
            }
        }
        catch {
            console.log("⚠️ Redis error, fallback to DB");
        }
        // 🔹 Fallback to DB
        if (!user) {
            user = (await User.findById(userId)
                .select("_id organizationId portalType role")
                .lean());
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "User not found",
                });
            }
            user.casbinSubject = user._id.toString();
            user.casbinOrg = user.organizationId?.toString();
            try {
                await redisService.setCache(userCacheKey, JSON.stringify(user), 600);
            }
            catch {
                console.log("⚠️ Failed to cache user");
            }
        }
        const sub = user.casbinSubject;
        const org = user.casbinOrg;
        const portal = `${user.portalType}_portal`;
        const role = user.role;
        console.log("🔐 Casbin Identity:", { sub, org, portal, role });
        /* =========================
           3️⃣ ROUTE → PERMISSION
        ========================= */
        const rawPath = req.baseUrl.replace(/^\/api\/v\d+\/(tech|admin|customer|vendor)/, "") +
            req.path;
        const normalizedPath = rawPath.replace(/\/[a-f0-9]{24}/g, "/:id");
        const routeKey = `${user.portalType}:${req.method} ${normalizedPath}`;
        console.log("🔑 Route Key:", routeKey);
        const permissionKey = ROUTE_PERMISSION_MAP[routeKey];
        if (!permissionKey) {
            return res.status(403).json({
                success: false,
                error: `Permission not defined for ${routeKey}`,
            });
        }
        /* =========================
           4️⃣ PERMISSION → CASBIN
        ========================= */
        const mapped = PERMISSION_TO_CASBIN[permissionKey];
        if (!mapped) {
            return res.status(403).json({
                success: false,
                error: `Permission not mapped to Casbin: ${permissionKey}`,
            });
        }
        const { obj, act } = mapped;
        /* =========================
           5️⃣ ENFORCE  🔥 FIX HERE
        ========================= */
        const enforcer = await getCasbinEnforcer();
        const allowed = await enforcer.enforce(sub, // user id
        obj, // resource
        act, // action
        org, // organization
        portal, // portal
        role // role
        );
        console.log("✅ Casbin Decision:", allowed);
        if (!allowed) {
            return res.status(403).json({
                success: false,
                error: `Access denied: ${permissionKey}`,
            });
        }
        console.log("🎉 ACCESS GRANTED");
        console.log("================ CASBIN MIDDLEWARE END ================\n");
        next();
    }
    catch (err) {
        console.error("🔥 CASBIN MIDDLEWARE ERROR:", err);
        next(err);
    }
}
//# sourceMappingURL=casbin.middleware.js.map