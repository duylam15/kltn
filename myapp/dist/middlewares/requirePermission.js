"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = void 0;
const jwt_1 = require("../utils/jwt");
const client_1 = require("../prisma/client");
const requirePermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const token = req.cookies?.access_token;
            if (!token)
                return res.status(401).json({ message: "Missing token" });
            const { valid, decoded } = (0, jwt_1.verifyJwt)(token);
            if (!valid || !decoded)
                return res.status(401).json({ message: "Invalid token" });
            const userId = decoded.userId || decoded.id;
            const user = await client_1.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: {
                        include: {
                            permissions: { include: { permission: true } },
                        },
                    },
                },
            });
            if (!user)
                return res.status(401).json({ message: "User not found" });
            req.user = user;
            const userPermissions = user.role.permissions.map((rp) => rp.permission.name);
            const ok = permissions.some((p) => userPermissions.includes(p));
            if (!ok) {
                return res.status(403).json({
                    message: `Forbidden – require one of: ${permissions.join(", ")}`,
                });
            }
            next();
        }
        catch (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    };
};
exports.requirePermission = requirePermission;
