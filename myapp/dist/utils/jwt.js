"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwt = signJwt;
exports.verifyJwt = verifyJwt;
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const privateKey = fs_1.default.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, "utf8");
const publicKey = fs_1.default.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, "utf8");
function signJwt(payload, options = {}) {
    return jsonwebtoken_1.default.sign(payload, privateKey, {
        algorithm: "RS256",
        ...(options || {}),
    });
}
function verifyJwt(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, publicKey, { algorithms: ["RS256"] });
        return { valid: true, expired: false, decoded };
    }
    catch (e) {
        return {
            valid: false,
            expired: e?.name === "TokenExpiredError",
            decoded: null,
        };
    }
}
