"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieLogger = cookieLogger;
function cookieLogger(req, res, next) {
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, value) {
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
