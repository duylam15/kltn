import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: any;
}

export const checkRole = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Giả sử bạn đã có user từ middleware authentication trước đó
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { role: true },
            });

            if (!user || !user.role) {
                return res.status(403).json({ message: "No role assigned" });
            }

            if (!allowedRoles.includes(user.role.name)) {
                return res
                    .status(403)
                    .json({ message: "Forbidden - Insufficient role" });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: "Error checking role", error });
        }
    };
};
