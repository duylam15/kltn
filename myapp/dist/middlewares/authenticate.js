"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    let token = req.cookies?.access_token || req.cookies?.token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });
    }
    const { valid, expired, decoded } = (0, jwt_1.verifyJwt)(token);
    if (!valid || !decoded) {
        return res.status(401).json({
            success: false,
            message: expired ? "Token expired" : "Invalid token",
        });
    }
    req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
    };
    next();
}
