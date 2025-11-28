"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    const token = req.cookies["access_token"] ||
        req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }
    try {
        const decoded = (0, jwt_1.verifyJwt)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid or expired token" });
    }
}
