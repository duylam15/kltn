// utils/cookie.ts
import { Response } from "express";
import ms, { StringValue } from "ms";

export function setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
) {
    const isDev = process.env.NODE_ENV !== "production";

    // ✅ Cast về StringValue (type của ms)
    const accessTTL = (process.env.ACCESS_TOKEN_TTL || "15m") as StringValue;
    const refreshTTL = (process.env.REFRESH_TOKEN_TTL || "7d") as StringValue;

    res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? "lax" : "strict",
        maxAge: ms(accessTTL), // ✅ Giờ TypeScript hiểu đúng
    });

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? "lax" : "strict",
        maxAge: ms(refreshTTL), // ✅ Type-safe
    });
}

export function clearAuthCookies(res: Response) {
    const isDev = process.env.NODE_ENV !== "production";

    res.clearCookie("access_token", {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? "lax" : "strict",
    });

    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: !isDev,
        sameSite: isDev ? "lax" : "strict",
    });
}
