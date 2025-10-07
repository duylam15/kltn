import { NextFunction } from "express";
import { Response } from "express";
import { verifyJwt } from "../utils/jwt";
import { AuthRequest } from "./auth";

export function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    let token = req.cookies?.access_token || req.cookies?.token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });
    }

    const { valid, expired, decoded } = verifyJwt(token);
    if (!valid || !decoded) {
        return res.status(401).json({
            success: false,
            message: expired ? "Token expired" : "Invalid token",
        });
    }

    req.user = {
        id: (decoded as any).userId,
        email: (decoded as any).email,
        role: (decoded as any).role,
    };
    next();
}
