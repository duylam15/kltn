"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const client_1 = require("../prisma/client");
function requirePermission(module, action) {
    return async (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }
        const role = await client_1.prisma.role.findUnique({
            where: { id: user.roleId },
            include: { permissions: true },
        });
        if (!role || !role.permissions) {
            return res
                .status(403)
                .json({ success: false, message: "No permissions" });
        }
        const perms = role.permissions;
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
