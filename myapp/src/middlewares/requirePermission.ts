import { verifyJwt } from "../utils/jwt";
import { prisma } from "../prisma/client";
import { NextFunction, Response } from "express";

export const requirePermission = (permissions: string[]) => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies?.access_token;
            if (!token)
                return res.status(401).json({ message: "Missing token" });

            const { valid, decoded } = verifyJwt(token);
            if (!valid || !decoded)
                return res.status(401).json({ message: "Invalid token" });

            const userId = decoded.userId || decoded.id;

            const user = await prisma.user.findUnique({
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

            const userPermissions = user.role.permissions.map(
                (rp: any) => rp.permission.name
            );

            const ok = permissions.some((p) => userPermissions.includes(p));

            if (!ok) {
                return res.status(403).json({
                    message: `Forbidden – require one of: ${permissions.join(
                        ", "
                    )}`,
                });
            }

            next();
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    };
};
