import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role?: string;
    };
}

export const checkPermission = (requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            // Lấy user với role và permissions
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            });

            if (!user || !user.role) {
                return res.status(403).json({
                    success: false,
                    message: "No role assigned",
                });
            }

            // Lấy danh sách permission names của user
            const userPermissions = user.role.permissions.map(
                (rp) => rp.permission.name
            );

            // ✅ Check full access (*)
            if (userPermissions.includes("*")) {
                return next();
            }

            // ✅ Check có permission được yêu cầu không
            const hasPermission = requiredPermissions.some((perm) =>
                userPermissions.includes(perm)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden - Insufficient permissions",
                    required: requiredPermissions,
                    userPermissions,
                });
            }

            next();
        } catch (error) {
            console.error("Permission check error:", error);
            res.status(500).json({
                success: false,
                message: "Error checking permission",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
};

// ✅ Middleware để check ALL permissions (AND logic)
export const checkAllPermissions = (requiredPermissions: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            });

            if (!user || !user.role) {
                return res.status(403).json({
                    success: false,
                    message: "No role assigned",
                });
            }

            const userPermissions = user.role.permissions.map(
                (rp) => rp.permission.name
            );

            if (userPermissions.includes("*")) {
                return next();
            }

            // ✅ Cần có TẤT CẢ permissions
            const hasAllPermissions = requiredPermissions.every((perm) =>
                userPermissions.includes(perm)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden - Missing required permissions",
                    required: requiredPermissions,
                    userPermissions,
                });
            }

            next();
        } catch (error) {
            console.error("Permission check error:", error);
            res.status(500).json({
                success: false,
                message: "Error checking permission",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
};
