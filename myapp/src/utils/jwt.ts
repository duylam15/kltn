import fs from "fs";
import jwt, { SignOptions } from "jsonwebtoken";

const privateKey = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH!, "utf8");
const publicKey  = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH!, "utf8");


interface TokenPayload {
    userId: number;
    email?: string;
    role: string;
}

export function signJwt(
  payload: object,
  options: SignOptions = {}
) {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    ...(options || {}),
  });
}

export function verifyJwt<T = any>(token: string): { valid: boolean; expired: boolean; decoded: T | null } {
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as T;
    return { valid: true, expired: false, decoded };
  } catch (e: any) {
    return {
      valid: false,
      expired: e?.name === "TokenExpiredError",
      decoded: null,
    };
  }
}