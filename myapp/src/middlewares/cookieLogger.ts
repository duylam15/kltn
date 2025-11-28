import { Request, Response, NextFunction } from "express";

export function cookieLogger(req: Request, res: Response, next: NextFunction) {
    const originalSetHeader = res.setHeader.bind(res);
    
    res.setHeader = function (name: string, value: any) {
        if (name.toLowerCase() === "set-cookie") {
            console.log("🍪 Setting Cookie:", value);
        }
        return originalSetHeader(name, value);
    };
    
    console.log("📨 Incoming Request:", {
        method: req.method,
        path: req.path,
        cookies: req.cookies,
        hasCookieHeader: !!req.headers.cookie,
    });
    
    next();
}