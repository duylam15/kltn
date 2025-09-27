import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthUser {
    id: number;
    roleId: number;
    email: string;
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }

    const token = auth.substring("Bearer ".length);
    const { valid, decoded } = verifyJwt<AuthUser>(token);
    if (!valid || !decoded) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid token" });
    }

    (req as any).user = decoded;
    next();
}
