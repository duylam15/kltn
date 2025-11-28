"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
exports.refreshFromCookie = refreshFromCookie;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_service_1 = require("./auth.service");
const client_1 = require("../../../prisma/client");
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
async function register(req, res) {
    try {
        const { email, password, fullName, roleId } = req.body;
        const existed = await client_1.prisma.user.findUnique({ where: { email } });
        if (existed)
            return res
                .status(409)
                .json({ success: false, message: "Email already registered" });
        const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const user = await client_1.prisma.user.create({
            data: { email, passwordHash, fullName, roleId: roleId ?? 100 },
            select: { id: true, email: true, fullName: true, roleId: true },
        });
        return res.json({ success: true, message: "Registered", data: user });
    }
    catch (e) {
        return res
            .status(500)
            .json({ success: false, message: "Register failed" });
    }
}
async function login(req, res) {
    const { studentCode, password } = req.body;
    const user = await (0, auth_service_1.validateUser)(studentCode, password);
    if (!user) {
        return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
    }
    if (!user.studentCode) {
        return res
            .status(400)
            .json({ success: false, message: "Student code missing" });
    }
    const accessToken = (0, auth_service_1.signAccessToken)({
        id: user.id,
        roleId: user.roleId,
        studentCode: user.studentCode,
    });
    const refreshToken = await (0, auth_service_1.issueRefreshToken)(user.id);
    // lưu access token vào cookie HttpOnly
    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 phút
    });
    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    return res.json({
        success: true,
        message: "Logged in",
        data: {
            id: user.id,
            studentCode: user.studentCode,
            roleId: user.roleId,
        },
    });
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res
                .status(400)
                .json({ success: false, message: "Missing refresh token" });
        const rotated = await (0, auth_service_1.rotateRefreshToken)(refreshToken);
        if (!rotated)
            return res
                .status(401)
                .json({ success: false, message: "Invalid refresh token" });
        const user = await client_1.prisma.user.findUnique({
            where: { id: rotated.userId },
        });
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "User not found" });
        if (!user.studentCode) {
            return res
                .status(400)
                .json({ success: false, message: "Student code missing" });
        }
        const accessToken = (0, auth_service_1.signAccessToken)({
            id: user.id,
            roleId: user.roleId,
            studentCode: user.studentCode,
        });
        return res.json({
            success: true,
            data: { accessToken, refreshToken: rotated.refreshToken },
        });
    }
    catch {
        return res
            .status(500)
            .json({ success: false, message: "Refresh failed" });
    }
}
async function logout(req, res) {
    try {
        const refreshToken = req.cookies["refresh_token"]; // 👈 lấy từ cookie
        if (refreshToken) {
            await (0, auth_service_1.revokeRefreshToken)(refreshToken);
        }
        // Xóa cookie ở client
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res.json({ success: true, message: "Logged out" });
    }
    catch (e) {
        console.error("Logout error:", e);
        return res
            .status(500)
            .json({ success: false, message: "Logout failed" });
    }
}
async function me(req, res) {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }
    try {
        const user = await client_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                studentCode: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
                // lấy thêm thông tin teacher & student
                teacher: {
                    select: {
                        id: true,
                        teacherCode: true,
                        department: true,
                        position: true,
                        specialization: true,
                    },
                },
                student: {
                    select: {
                        id: true,
                        className: true,
                        major: true,
                        academicYear: true,
                        enrollmentYear: true,
                        status: true,
                    },
                },
            },
        });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                studentCode: user.studentCode,
                role: {
                    id: user.role.id,
                    name: user.role.name,
                    permissions: user.role.permissions.map((rp) => rp.permission),
                },
                teacher: user.teacher || null,
                student: user.student || null,
            },
        });
    }
    catch (e) {
        console.error("Me error:", e);
        return res
            .status(500)
            .json({ success: false, message: "Error fetching user" });
    }
}
// Thêm hàm này vào auth.controller.ts
async function refreshFromCookie(req, res) {
    try {
        const refreshToken = req.cookies["refresh_token"];
        console.log("🔄 Refresh token request received");
        if (!refreshToken) {
            console.log("❌ No refresh token in cookie");
            return res.status(401).json({
                success: false,
                message: "No refresh token",
                code: "NO_REFRESH_TOKEN"
            });
        }
        const rotated = await (0, auth_service_1.rotateRefreshToken)(refreshToken);
        if (!rotated) {
            console.log("❌ Refresh token invalid or expired");
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
                code: "INVALID_REFRESH_TOKEN"
            });
        }
        const user = await client_1.prisma.user.findUnique({
            where: { id: rotated.userId },
        });
        if (!user || !user.studentCode) {
            console.log("❌ User not found");
            return res.status(401).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }
        const accessToken = (0, auth_service_1.signAccessToken)({
            id: user.id,
            roleId: user.roleId,
            studentCode: user.studentCode,
        });
        // Cập nhật cookie với access token mới
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1 * 60 * 1000, // 1 phút (test)
        });
        // Cập nhật cookie với refresh token mới
        res.cookie("refresh_token", rotated.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 5 * 60 * 1000, // 5 phút (test)
        });
        console.log("✅ Tokens refreshed successfully for user:", user.id);
        return res.json({
            success: true,
            message: "Token refreshed",
            data: {
                userId: user.id,
                studentCode: user.studentCode
            }
        });
    }
    catch (error) {
        console.error("💥 Refresh token error:", error);
        return res.status(500).json({
            success: false,
            message: "Refresh failed",
            code: "REFRESH_ERROR"
        });
    }
}
