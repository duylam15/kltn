"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = validateUser;
exports.signAccessToken = signAccessToken;
exports.issueRefreshToken = issueRefreshToken;
exports.rotateRefreshToken = rotateRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const ms_1 = __importDefault(require("ms"));
const client_1 = require("../../../prisma/client");
const jwt_1 = require("../../../utils/jwt");
const accessTtl = (process.env.ACCESS_TOKEN_TTL || "15m");
const refreshTtl = process.env.REFRESH_TOKEN_TTL || "7d";
async function validateUser(studentCode, password) {
    if (!studentCode)
        return null; // 👈 tránh gọi Prisma với undefined/null
    const user = await client_1.prisma.user.findUnique({
        where: { studentCode }, // phải chắc chắn studentCode có giá trị
    });
    if (!user)
        return null;
    const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isValid)
        return null;
    return user;
}
function signAccessToken(user) {
    // Use the raw TTL string (e.g. "15m") directly; jsonwebtoken accepts duration strings.
    return (0, jwt_1.signJwt)({ id: user.id, roleId: user.roleId, studentCode: user.studentCode }, { expiresIn: accessTtl });
}
async function issueRefreshToken(userId) {
    // Dùng token ngẫu nhiên (opaque) lưu DB bằng bảng RefreshToken đã có
    const token = cryptoRandom();
    const expiresAt = new Date(Date.now() + (0, ms_1.default)(refreshTtl));
    await client_1.prisma.refreshToken.create({
        data: { userId, token, expiresAt },
    });
    return token;
}
async function rotateRefreshToken(oldToken) {
    const found = await client_1.prisma.refreshToken.findUnique({
        where: { token: oldToken },
    });
    if (!found || found.revokedAt || found.expiresAt < new Date())
        return null;
    // rotate
    await client_1.prisma.refreshToken.update({
        where: { token: oldToken },
        data: { revokedAt: new Date() },
    });
    const newToken = await issueRefreshToken(found.userId);
    return { userId: found.userId, refreshToken: newToken };
}
async function revokeRefreshToken(token) {
    await client_1.prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}
function cryptoRandom(len = 64) {
    const bytes = require("crypto").randomBytes(len);
    return bytes.toString("base64url");
}
