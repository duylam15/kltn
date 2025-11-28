"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = requireUser;
const jwt_1 = require("../utils/jwt");
function requireUser(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }
    const token = auth.substring("Bearer ".length);
    const { valid, decoded } = (0, jwt_1.verifyJwt)(token);
    if (!valid || !decoded) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
}
