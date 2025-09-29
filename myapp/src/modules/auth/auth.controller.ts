import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../prisma/client";
import {
    signAccessToken,
    validateUser,
    issueRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
} from "./auth.service";
import { AuthRequest } from "../../middlewares/auth";
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export async function register(req: Request, res: Response) {
    try {
        const { email, password, fullName, roleId } = req.body;

        const existed = await prisma.user.findUnique({ where: { email } });
        if (existed)
            return res
                .status(409)
                .json({ success: false, message: "Email already registered" });

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: { email, passwordHash, fullName, roleId: roleId ?? 100 },
            select: { id: true, email: true, fullName: true, roleId: true },
        });

        return res.json({ success: true, message: "Registered", data: user });
    } catch (e) {
        return res
            .status(500)
            .json({ success: false, message: "Register failed" });
    }
}

export async function login(req: Request, res: Response) {
    const { studentCode, password } = req.body;

    const user = await validateUser(studentCode, password);
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

    const accessToken = signAccessToken({
        id: user.id,
        roleId: user.roleId,
        studentCode: user.studentCode,
    });
    const refreshToken = await issueRefreshToken(user.id);

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

export async function refresh(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res
                .status(400)
                .json({ success: false, message: "Missing refresh token" });

        const rotated = await rotateRefreshToken(refreshToken);
        if (!rotated)
            return res
                .status(401)
                .json({ success: false, message: "Invalid refresh token" });

        const user = await prisma.user.findUnique({
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

        const accessToken = signAccessToken({
            id: user.id,
            roleId: user.roleId,
            studentCode: user.studentCode,
        });

        return res.json({
            success: true,
            data: { accessToken, refreshToken: rotated.refreshToken },
        });
    } catch {
        return res
            .status(500)
            .json({ success: false, message: "Refresh failed" });
    }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies["refresh_token"]; // 👈 lấy từ cookie
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
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
  } catch (e) {
    console.error("Logout error:", e);
    return res
      .status(500)
      .json({ success: false, message: "Logout failed" });
  }
}

export async function me(req: AuthRequest, res: Response) {
    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }

    try {
        const user = await prisma.user.findUnique({
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
                    permissions: user.role.permissions.map(
                        (rp) => rp.permission
                    ),
                },
            },
        });
    } catch (e) {
        console.error("Me error:", e);
        return res
            .status(500)
            .json({ success: false, message: "Error fetching user" });
    }
}

