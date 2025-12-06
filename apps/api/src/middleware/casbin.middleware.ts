// apps/api/src/middleware/casbin.middleware.ts
import { Request, Response, NextFunction } from "express";
import { getCasbinEnforcer } from "../config/casbin";
import { User } from "../models/user.model";

export function casbinMiddleware(obj: string, act: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let user: any = req.user;

      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized" });
      }

      // Always fetch fresh user from DB (token might have old role)
      const freshUser = await User.findById(user.userId || user._id).lean();

      if (!freshUser) {
        return res
          .status(401)
          .json({ success: false, error: "User not found" });
      }

      user = {
        ...user,
        role: freshUser.role,
        portalType: freshUser.portalType,
      };

      const enforcer = await getCasbinEnforcer();

      const userId =
        user._id?.toString() ||
        user.id?.toString() ||
        user.userId?.toString();

      if (!userId) {
        console.error("❌ ERROR: userId missing in req.user:", user);
        return res.status(500).json({
          success: false,
          error: "Invalid authentication: userId missing",
        });
      }

      const sub = userId;
      const org = "*";
      const portal = `${user.portalType}_portal`;
      const role = user.role;

      // Debug (keep while developing; remove/disable in prod if noisy)
      console.log("========== CASBIN DEBUG START ==========");
      console.log("➡ Request Input:", {
        sub,
        obj,
        act,
        org,
        portal,
        role,
        user,
      });

      console.log("\n➡ Policies (p):");
      console.log(await enforcer.getPolicy());

      console.log("\n➡ Grouping Policies:");
      console.log("g :", await enforcer.getGroupingPolicy());
      console.log("g2:", await enforcer.getNamedGroupingPolicy("g2"));
      console.log("g3:", await enforcer.getNamedGroupingPolicy("g3"));
      console.log("g4:", await enforcer.getNamedGroupingPolicy("g4"));
      console.log("========== CASBIN DEBUG END ==========\n");

      // r = sub, obj, act, org, portal, role
      const allowed = await enforcer.enforce(
        sub,
        obj,
        act,
        org,
        portal,
        role
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: `Access Denied for ${obj}:${act}`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
