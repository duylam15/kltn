// middlewares/requirePermission.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client";

export function requirePermission(module: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const role = await prisma.role.findUnique({
            where: { id: user.roleId },
        });
        if (!role || !role.permissions) {
            return res
                .status(403)
                .json({ success: false, message: "No permissions" });
        }

        const perms = role.permissions as any;

        // Nếu role có wildcard ["*"] thì cho qua
        if (Array.isArray(perms) && perms.includes("*")) {
            return next();
        }

        // Nếu là dạng module-based
        if (perms.modules) {
            const modules = perms.modules || {};
            const allowed = modules[module] || [];
            if (allowed.includes(action)) {
                return next();
            }
        }

        return res.status(403).json({ success: false, message: "Forbidden" });
    };
}
