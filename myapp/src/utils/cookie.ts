import { Response } from "express";
import ms, { StringValue } from "ms";

export function setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
) {
    const accessTTL = (process.env.ACCESS_TOKEN_TTL || "15m") as StringValue;
    const refreshTTL = (process.env.REFRESH_TOKEN_TTL || "7d") as StringValue;

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true, // bắt buộc khi dùng HTTPS
        sameSite: "none", // cho phép cross-site
        path: "/",
        maxAge: ms(accessTTL),
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: ms(refreshTTL),
    });
}

export function clearAuthCookies(res: Response) {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: true, // phải giống lúc SET!
        sameSite: "none",
        path: "/",
    });

    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true, // phải giống lúc SET!
        sameSite: "none",
        path: "/",
    });
}
