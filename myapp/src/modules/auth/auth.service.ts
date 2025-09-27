import bcrypt from "bcrypt";
import { prisma } from "../../prisma/client"; // chỉnh path theo dự án của bạn
import { signJwt } from "../../utils/jwt";
import ms from "ms";
import type { SignOptions } from "jsonwebtoken";

const accessTtl: SignOptions["expiresIn"] = (process.env.ACCESS_TOKEN_TTL || "15m") as SignOptions["expiresIn"];
type MsStringValue = Exclude<Parameters<typeof ms>[0], number>;
const refreshTtl: MsStringValue = (process.env.REFRESH_TOKEN_TTL as MsStringValue) || "7d";

export async function validateUser(studentCode: string, password: string) {
    if (!studentCode) return null; // 👈 tránh gọi Prisma với undefined/null

    const user = await prisma.user.findUnique({
        where: { studentCode }, // phải chắc chắn studentCode có giá trị
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
}

export function signAccessToken(user: {
    id: number;
    roleId: number;
    studentCode: string;
}) {
    // Use the raw TTL string (e.g. "15m") directly; jsonwebtoken accepts duration strings.
    return signJwt(
        { id: user.id, roleId: user.roleId, studentCode: user.studentCode },
        { expiresIn: accessTtl }
    );
}

export async function issueRefreshToken(userId: number) {
    // Dùng token ngẫu nhiên (opaque) lưu DB bằng bảng RefreshToken đã có
    const token = cryptoRandom();
    const expiresAt = new Date(Date.now() + ms(refreshTtl));

    await prisma.refreshToken.create({
        data: { userId, token, expiresAt },
    });

    return token;
}

export async function rotateRefreshToken(oldToken: string) {
    const found = await prisma.refreshToken.findUnique({
        where: { token: oldToken },
    });
    if (!found || found.revokedAt || found.expiresAt < new Date()) return null;

    // rotate
    await prisma.refreshToken.update({
        where: { token: oldToken },
        data: { revokedAt: new Date() },
    });

    const newToken = await issueRefreshToken(found.userId);
    return { userId: found.userId, refreshToken: newToken };
}

export async function revokeRefreshToken(token: string) {
    await prisma.refreshToken.updateMany({
        where: { token, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}

function cryptoRandom(len = 64) {
    const bytes = require("crypto").randomBytes(len);
    return bytes.toString("base64url");
}
