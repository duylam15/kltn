import crypto from "crypto";
const SECRET = process.env.ATTENDANCE_HMAC_SECRET || "dev-secret";

export function sign(data: string) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}
export function verify(data: string, signature: string) {
  return sign(data) === signature;
}
