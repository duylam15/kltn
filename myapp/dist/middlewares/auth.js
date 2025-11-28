"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
const jwt_1 = require("../utils/jwt");
function verifyAccessToken(req, res, next) {
    const token = req.cookies["access_token"];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token",
            code: "NO_TOKEN",
        });
    }
    const { valid, expired, decoded } = (0, jwt_1.verifyJwt)(token);
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
