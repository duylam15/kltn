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
        return res.status(401).json({
            success: false,
            message: "No token",
            code: "NO_TOKEN",
        });
    }

    const { valid, expired, decoded } = verifyJwt(token);

    // Nếu token hết hạn, trả về status 401 với flag expired
    if (expired) {
        return res.status(401).json({
            success: false,
            message: "Token expired",
            code: "TOKEN_EXPIRED", // Frontend sẽ dựa vào này để refresh
        });
    }

    if (!valid) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            code: "INVALID_TOKEN",
        });
    }

    req.user = decoded;
    next();
}
