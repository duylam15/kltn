// middlewares/requireAuth.ts
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token =
        req.cookies["access_token"] ||
        req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }

    try {
        const decoded = verifyJwt(token);
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid or expired token" });
    }
}
