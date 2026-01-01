import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      deviceIdFromCookie?: string;
    }
  }
}

export function deviceIdCookie(req: Request, res: Response, next: NextFunction) {
  const COOKIE_NAME = "device_id";

  let deviceId = req.cookies?.[COOKIE_NAME] as string | undefined;

  if (!deviceId) {
    deviceId = crypto.randomUUID();

    // ⚠️ local dev: nếu chạy http thì KHÔNG set secure=true
    res.cookie(COOKIE_NAME, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,          // production https => true
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 năm
      path: "/",
    });
  }

  req.deviceIdFromCookie = deviceId;
  next();
}
