import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export interface AuthRequest extends Request {
    user?: any;
}

export function verifyAccessToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const token = req.cookies["access_token"];
    if (!token) {
        return res.status(401).json({ success: false, message: "No token" });
    }

    const { valid, expired, decoded } = verifyJwt(token);

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: expired ? "Token expired" : "Invalid token",
        });
    }

    req.user = decoded;
    next();
}
