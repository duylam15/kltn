"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSessionTotpConfig = getSessionTotpConfig;
exports.getSessionCurrentTotp = getSessionCurrentTotp;
exports.signPayload = signPayload;
exports.issueNonce = issueNonce;
exports.checkIn = checkIn;
exports.manualCheckIn = manualCheckIn;
exports.cancelAttendance = cancelAttendance;
exports.adjustAttendance = adjustAttendance;
exports.getWarningAttendances = getWarningAttendances;
exports.listAllSessions = listAllSessions;
exports.listSessions = listSessions;
exports.getSession = getSession;
exports.updateSession = updateSession;
exports.deleteSession = deleteSession;
const attendanceService = __importStar(require("./attendance.service"));
const crypto_1 = require("crypto");
const net_utils_1 = require("../../../common/net.utils");
const hmac_1 = require("../../../common/hmac");
const ua_parser_js_1 = require("ua-parser-js");
const crypto_2 = __importDefault(require("crypto"));
const otplib_1 = require("otplib");
const client_1 = require("../../../prisma/client");
const SECRET = process.env.ATTENDANCE_HMAC_SECRET || "dev-secret";
// cấu hình mặc định cho toàn hệ thống (có thể chuyển .env)
const DEFAULT_TOTP_PERIOD = 10; // 10 giây
const DEFAULT_TOTP_DIGITS = 6;
// ===== helper sinh secret base32 mạnh
function generateTotpSecretBase32() {
    // 20 bytes random -> base32 (tương thích otplib)
    return Buffer.from(crypto_2.default.randomBytes(20)).toString("base64") // raw
        .replace(/[^A-Z2-7]/gi, "A") // normalize
        .slice(0, 32) // 32 chars
        .toUpperCase(); // base32-like
}
/* ===================== ====================================
 * 1) TẠO PHIÊN ĐIỂM DANH (bổ sung secret TOTP)
 * ========================================================= */
async function createSession(req, res) {
    try {
        const { sectionId, name, expiresAt, latitude, longitude, radius, requireDeviceCheck, maxCheckInsPerIP, sessionScore, // ⬅️ thêm
         } = req.body;
        const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const totpSecretBase32 = generateTotpSecretBase32();
        const session = await client_1.prisma.attendanceSession.create({
            data: {
                sectionId: Number(sectionId),
                sessionCode,
                name: name || null,
                latitude: latitude ?? null,
                longitude: longitude ?? null,
                radius: radius ?? 100,
                requireDeviceCheck: requireDeviceCheck ?? true,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                // TOTP
                totpSecretBase32,
                totpPeriod: DEFAULT_TOTP_PERIOD,
                totpDigits: DEFAULT_TOTP_DIGITS,
                // ⬇️ lưu điểm của buổi
                sessionScore: sessionScore !== undefined && sessionScore !== null
                    ? Number(sessionScore)
                    : 10,
            },
        });
        return res.json({
            success: true,
            data: session,
            totp: {
                secretBase32: totpSecretBase32,
                period: DEFAULT_TOTP_PERIOD,
                digits: DEFAULT_TOTP_DIGITS,
            },
        });
    }
    catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 1a) API CHỈ GV DÙNG: LẤY SECRET TOTP CỦA 1 SESSION
 * ========================================================= */
async function getSessionTotpConfig(req, res) {
    try {
        const id = Number(req.params.id);
        const s = await client_1.prisma.attendanceSession.findUnique({
            where: { id },
            select: { totpSecretBase32: true, totpPeriod: true, totpDigits: true }
        });
        if (!s || !s.totpSecretBase32) {
            return res.status(404).json({ success: false, message: "Không có TOTP cho phiên" });
        }
        return res.json({
            success: true,
            totp: {
                secretBase32: s.totpSecretBase32,
                period: s.totpPeriod || DEFAULT_TOTP_PERIOD,
                digits: s.totpDigits || DEFAULT_TOTP_DIGITS,
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
/* =========================================================
 * 1b) Lấy mã TOTP hiện tại cho session (dùng trong QR động)
 * ========================================================= */
async function getSessionCurrentTotp(req, res) {
    try {
        const id = Number(req.params.id);
        const sess = await client_1.prisma.attendanceSession.findUnique({ where: { id } });
        if (!sess)
            return res.json({ success: false, message: "Session not found" });
        otplib_1.totp.options = { digits: 6, step: 10 };
        const token = generateTotpSecretBase32();
        return res.json({
            success: true,
            token,
            period: 10
        });
    }
    catch (err) {
        return res.json({ success: false, message: err.message });
    }
}
/* =========================================================
 * 2. KÝ PAYLOAD TẠM (HMAC)
 * ========================================================= */
async function signPayload(req, res) {
    try {
        const { base } = req.body;
        if (!base) {
            return res.status(400).json({ success: false, message: "Thiếu base string để ký" });
        }
        const signature = crypto_2.default.createHmac("sha256", SECRET).update(base).digest("hex");
        return res.json({ success: true, signature });
    }
    catch (err) {
        console.error("❌ signPayload error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 3. CẤP NONCE
 * ========================================================= */
async function issueNonce(req, res) {
    try {
        const { sessionId } = req.params;
        const session = await client_1.prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found" });
        const value = (0, crypto_1.randomBytes)(16).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 1000); // 60s
        await client_1.prisma.attendanceNonce.create({
            data: { sessionId: session.id, value, expiresAt, used: false },
        });
        return res.json({ success: true, nonce: value, expiresAt });
    }
    catch (err) {
        console.error("❌ issueNonce error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 4. SV CHECK-IN (kiểm accuracy + distance + IP-Geo + deviceId)
 * ========================================================= */
async function checkIn(req, res) {
    try {
        const { sessionId, studentCode, scannedToken, latitude, longitude, accuracy, deviceId, nonce, payloadSig, } = req.body;
        if (!sessionId || !studentCode) {
            return res.status(400).json({ success: false, message: "sessionId và studentCode là bắt buộc" });
        }
        if (latitude == null || longitude == null) {
            return res.status(400).json({ success: false, message: "Vị trí GPS là bắt buộc để điểm danh" });
        }
        // accuracy client phải <= 100m
        const MAX_ALLOWED_ACCURACY = 100;
        const accNum = Number(accuracy);
        if (!Number.isFinite(accNum) || accNum > MAX_ALLOWED_ACCURACY) {
            return res.status(400).json({
                success: false,
                message: `Không thể xác định vị trí chính xác (Sai số: ${Number.isFinite(accNum) ? Math.round(accNum) + "m" : "N/A"} > ${MAX_ALLOWED_ACCURACY}m). Vui lòng tắt->bật lại Wi-Fi THỬ.`,
            });
        }
        // -- Lấy session & secret
        const sessionDb = await client_1.prisma.attendanceSession.findUnique({
            where: { id: Number(sessionId) },
        });
        if (!sessionDb)
            return res.status(404).json({ success: false, message: "Session not found" });
        // ✅ TOTP chỉ kiểm khi client có gửi scannedToken
        if (sessionDb.totpSecretBase32 && scannedToken) {
            otplib_1.totp.options = {
                step: sessionDb.totpPeriod || DEFAULT_TOTP_PERIOD,
                digits: sessionDb.totpDigits || DEFAULT_TOTP_DIGITS,
            };
            const isValidToken = otplib_1.totp.verify({
                token: String(scannedToken),
                secret: sessionDb.totpSecretBase32,
                window: 1, // chấp nhận lệch 1 step
            });
            if (!isValidToken) {
                return res.status(400).json({
                    success: false,
                    message: "Mã QR đã hết hạn hoặc không hợp lệ. Hãy quét lại QR đang hiển thị.",
                });
            }
        }
        // Nếu không có scannedToken -> bỏ qua bước TOTP (nút bấm thuần)
        // 1) IP & UA
        const ipAddress = (0, net_utils_1.getClientIp)(req);
        const userAgent = req.headers["user-agent"] || "";
        const ua = new ua_parser_js_1.UAParser(userAgent).getResult();
        const deviceInfo = `${ua.os.name ?? ""} ${ua.os.version ?? ""} | ${ua.browser.name ?? ""} ${ua.browser.version ?? ""}`;
        // 2) Nonce
        const found = await client_1.prisma.attendanceNonce.findUnique({ where: { value: nonce } });
        if (!found || found.used || found.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: "Nonce invalid or expired." });
        }
        // 3) Verify HMAC
        const base = [sessionId, latitude, longitude, accuracy, nonce].join("|");
        if (!(0, hmac_1.verify)(base, payloadSig)) {
            return res.status(400).json({ success: false, message: "Signature mismatch." });
        }
        // 4) Session
        const session = await client_1.prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found" });
        if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
            return res.status(410).json({ success: false, message: "Buổi điểm danh đã hết hạn." });
        }
        // 5) Student
        const student = await client_1.prisma.student.findUnique({ where: { studentCode }, include: { user: true } });
        if (!student)
            return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });
        // 6) Enrollment
        const enrolled = await client_1.prisma.sectionEnrollment.findFirst({
            where: { sectionId: session.sectionId, studentId: student.id },
        });
        if (!enrolled)
            return res.status(400).json({ success: false, message: "Sinh viên không thuộc học phần này" });
        // 7) Đã điểm danh?
        const existing = await client_1.prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId: student.id },
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Bạn đã điểm danh rồi", data: existing });
        }
        // 8) Chống spam theo IP
        const ipCheckCount = await client_1.prisma.attendance.count({
            where: { sessionId: session.id, ipAddress },
        });
        // 9) GPS trong bán kính
        let distance = null;
        let isValid = true;
        let status = "present";
        if (session.latitude && session.longitude && session.radius) {
            distance = (0, net_utils_1.haversineMeters)(session.latitude, session.longitude, Number(latitude), Number(longitude));
            const inRadius = distance <= (session.radius ?? 50);
            if (!inRadius)
                isValid = false;
        }
        // 10) So sánh IP vs GPS
        const ipGeo = (0, net_utils_1.getIpGeo)(ipAddress);
        let ipVsGpsKm = null;
        if (ipGeo)
            ipVsGpsKm = (0, net_utils_1.haversineMeters)(Number(latitude), Number(longitude), ipGeo.lat, ipGeo.lon) / 1000;
        const suspiciousByIpGeo = ipVsGpsKm !== null && ipVsGpsKm > 50;
        if (suspiciousByIpGeo)
            isValid = false;
        // 11) DEVICE trong session (không cho 1 device dùng cho SV khác)
        if (!deviceId) {
            return res.status(400).json({ success: false, message: "Thiếu deviceId. Không thể điểm danh." });
        }
        const existingDeviceInSession = await client_1.prisma.deviceFingerprint.findFirst({
            where: { sessionId: session.id, deviceId },
        });
        if (existingDeviceInSession && existingDeviceInSession.studentId !== student.id) {
            const owner = await client_1.prisma.student.findUnique({
                where: { id: existingDeviceInSession.studentId },
                select: { studentCode: true },
            });
            return res.status(403).json({
                success: false,
                message: "Thiết bị này đã được dùng để điểm danh bởi sinh viên khác trong buổi này!",
                warning: owner ? `Thiết bị đã dùng bởi MSSV: ${owner.studentCode}` : undefined,
            });
        }
        await client_1.prisma.deviceFingerprint.upsert({
            where: { uniq_session_device: { sessionId: session.id, deviceId } },
            update: { studentId: student.id, userAgent },
            create: { studentId: student.id, sessionId: session.id, deviceId, userAgent },
        });
        // 12) Điểm cho buổi này = sessionScore của session
        const baseScore = session.sessionScore !== undefined &&
            session.sessionScore !== null
            ? Number(session.sessionScore)
            : 10;
        const score = baseScore; // không phụ thuộc status / rule / trễ nữa
        // 13) Lưu attendance
        const attendance = await client_1.prisma.attendance.create({
            data: {
                sessionId: session.id,
                studentId: student.id,
                status,
                latitude: Number(latitude),
                longitude: Number(longitude),
                distance,
                ipAddress,
                deviceInfo,
                userAgent,
                isValid,
                score,
            },
            include: { student: { include: { user: true } } },
        });
        // 14) Đánh dấu nonce & log
        await client_1.prisma.attendanceNonce.update({ where: { value: nonce }, data: { used: true } });
        await client_1.prisma.attendanceLog.create({
            data: {
                studentId: student.id,
                sessionId: session.id,
                ipAddress,
                userAgent,
                ipCountry: ipGeo?.country,
                ipCity: ipGeo?.city,
                flags: JSON.stringify({ ipVsGpsKm, suspiciousByIpGeo, usedTotp: Boolean(scannedToken) }),
                note: isValid ? null : "Suspicious attendance (geo/device).",
            },
        });
        return res.json({
            success: true,
            message: isValid ? "Điểm danh thành công" : "Điểm danh thành công nhưng có cảnh báo",
            data: attendance,
            warning: !isValid ? `Lệch vị trí/thiết bị. Khoảng cách: ${distance?.toFixed?.(0) ?? "?"}m.` : null,
            scoreInfo: { score, status }, // đủ dùng, không cần minutesLate/matchedRule nữa
        });
    }
    catch (err) {
        console.error("❌ Error in checkIn:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 4b. MANUAL CHECK-IN (GV)
 * ========================================================= */
async function manualCheckIn(req, res) {
    try {
        const { sessionId, studentCode, teacherId, note, status } = req.body;
        if (!sessionId || !studentCode || !teacherId) {
            return res.status(400).json({ success: false, message: "sessionId, studentCode, teacherId là bắt buộc" });
        }
        const session = await client_1.prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found" });
        const student = await client_1.prisma.student.findUnique({ where: { studentCode }, include: { user: true } });
        if (!student)
            return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });
        const enrolled = await client_1.prisma.sectionEnrollment.findFirst({
            where: { sectionId: session.sectionId, studentId: student.id },
        });
        if (!enrolled)
            return res.status(400).json({ success: false, message: "Sinh viên không thuộc học phần này" });
        const existed = await client_1.prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId: student.id },
            include: { student: { include: { user: true } } },
        });
        if (existed) {
            return res.status(200).json({
                success: true,
                message: "Sinh viên đã điểm danh trước đó",
                data: existed,
            });
        }
        let finalStatus = status || "present";
        const baseScore = session.sessionScore !== undefined &&
            session.sessionScore !== null
            ? Number(session.sessionScore)
            : 10;
        const score = baseScore;
        const attendance = await client_1.prisma.attendance.create({
            data: {
                sessionId: session.id,
                studentId: student.id,
                status: finalStatus,
                latitude: null,
                longitude: null,
                distance: null,
                ipAddress: "manual",
                deviceInfo: "Manual by teacher",
                userAgent: req.headers["user-agent"] || null,
                isValid: true,
                score,
                adjustedBy: Number(teacherId),
                adjustedAt: new Date(),
            },
            include: { student: { include: { user: true } } },
        });
        await client_1.prisma.attendanceLog.create({
            data: {
                studentId: student.id,
                sessionId: session.id,
                ipAddress: "manual",
                userAgent: req.headers["user-agent"] || "",
                ipCountry: null,
                ipCity: null,
                flags: JSON.stringify({ source: "manual", teacherId }),
                note: note || "Manual check-in by teacher",
            },
        });
        return res.json({ success: true, message: "Điểm danh thủ công thành công", data: attendance });
    }
    catch (err) {
        console.error("❌ manualCheckIn error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 4c. HỦY ĐIỂM DANH
 * ========================================================= */
async function cancelAttendance(req, res) {
    try {
        const { sessionId, studentCode, teacherId, reason } = req.body;
        if (!sessionId || !studentCode || !teacherId) {
            return res.status(400).json({ success: false, message: "sessionId, studentCode, teacherId là bắt buộc" });
        }
        const session = await client_1.prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found" });
        const student = await client_1.prisma.student.findUnique({ where: { studentCode } });
        if (!student)
            return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });
        const attendance = await client_1.prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId: student.id },
        });
        if (!attendance)
            return res.status(404).json({ success: false, message: "Chưa có bản ghi để hủy" });
        await client_1.prisma.attendance.delete({ where: { id: attendance.id } });
        await client_1.prisma.attendanceLog.create({
            data: {
                studentId: student.id,
                sessionId: session.id,
                ipAddress: "manual",
                userAgent: req.headers["user-agent"] || "",
                flags: JSON.stringify({ action: "cancel", teacherId }),
                note: reason || "Teacher cancelled attendance",
            },
        });
        return res.json({ success: true, message: "Đã hủy điểm danh", id: attendance.id, studentId: student.id });
    }
    catch (err) {
        console.error("❌ cancelAttendance error:", err);
        const code = err.statusCode === 404 ? 404 : 400;
        return res.status(code).json({ success: false, message: err.message || "Bad request" });
    }
}
/* =========================================================
 * 5. GV CHỈNH ĐIỂM DANH THỦ CÔNG
 * ========================================================= */
async function adjustAttendance(req, res) {
    try {
        const { attendanceId } = req.params;
        const { status, score, adjustedBy } = req.body;
        const attendance = await client_1.prisma.attendance.findUnique({
            where: { id: Number(attendanceId) },
        });
        if (!attendance) {
            return res.status(404).json({ success: false, message: "Attendance not found" });
        }
        const updated = await client_1.prisma.attendance.update({
            where: { id: Number(attendanceId) },
            data: {
                status: status || attendance.status,
                score: score ?? attendance.score,
                adjustedBy: adjustedBy || null,
                adjustedAt: new Date(),
                isValid: true,
            },
            include: {
                student: { include: { user: true } },
            },
        });
        res.json({
            success: true,
            message: "Đã cập nhật điểm danh",
            data: updated,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/* =========================================================
 * 6. LẤY DANH SÁCH CẢNH BÁO GIAN LẬN THEO SESSION
 * ========================================================= */
async function getWarningAttendances(req, res) {
    try {
        const { sessionId } = req.params;
        const warnings = await client_1.prisma.attendance.findMany({
            where: {
                sessionId: Number(sessionId),
                OR: [{ isValid: false }, { status: "warning" }],
            },
            include: {
                student: { include: { user: true } },
            },
            orderBy: { checkedInAt: "desc" },
        });
        return res.json({ success: true, data: warnings });
    }
    catch (err) {
        console.error("❌ getWarningAttendances error:", err);
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * (Helper cũ, bạn có thể bỏ nếu không còn dùng)
 * ========================================================= */
function extractDeviceInfo(userAgent) {
    if (userAgent.includes("iPhone"))
        return "iPhone";
    if (userAgent.includes("Android"))
        return "Android";
    if (userAgent.includes("Windows"))
        return "Windows";
    if (userAgent.includes("Mac"))
        return "Mac";
    return "Unknown";
}
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/* =========================================================
 * 7. LIỆT KÊ TOÀN BỘ PHIÊN ĐIỂM DANH (CHO ADMIN)
 * ========================================================= */
async function listAllSessions(req, res) {
    try {
        const sessions = await client_1.prisma.attendanceSession.findMany({
            include: {
                section: {
                    select: { id: true, sectionCode: true, sectionName: true },
                },
                attendances: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: { fullName: true, email: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, data: sessions });
    }
    catch (err) {
        console.error("❌ listAllSessions error:", err);
        return res
            .status(500)
            .json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 8. LIỆT KÊ SESSION THEO LỚP (SECTION)
 * ========================================================= */
async function listSessions(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const sessions = await attendanceService.getAttendanceSessions(sectionId);
        // set status = "warning" nếu SV đứng ngoài bán kính
        const updated = sessions.map((session) => {
            if (!session.latitude || !session.longitude)
                return session;
            const radius = session.radius || 50;
            const attendances = session.attendances.map((a) => {
                let status = a.status;
                let distance = null;
                if (a.latitude && a.longitude) {
                    distance = getDistanceFromLatLonInM(session.latitude, session.longitude, a.latitude, a.longitude);
                    if (distance > radius) {
                        status = "warning";
                    }
                }
                return { ...a, distance, status };
            });
            return { ...session, attendances };
        });
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error("❌ listSessions error:", err);
        return res
            .status(400)
            .json({ success: false, message: err.message || "Bad request" });
    }
}
/* =========================================================
 * 9. CHI TIẾT 1 SESSION
 * ========================================================= */
async function getSession(req, res) {
    try {
        const id = Number(req.params.id);
        const session = await client_1.prisma.attendanceSession.findUnique({
            where: { id },
            include: {
                attendances: {
                    include: { student: { include: { user: true } } },
                    orderBy: { checkedInAt: 'desc' }
                }
            }
        });
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found" });
        // Trả về TOTP config cho GV (chỉ GV được phép thấy)
        const totpConfig = session.totpSecretBase32 ? {
            secretBase32: session.totpSecretBase32,
            period: session.totpPeriod || DEFAULT_TOTP_PERIOD,
            digits: session.totpDigits || DEFAULT_TOTP_DIGITS,
        } : null;
        return res.json({
            success: true,
            data: {
                ...session,
                totpSecretBase32: session.totpSecretBase32, // ← Đảm bảo có
                totpPeriod: session.totpPeriod,
                totpDigits: session.totpDigits,
                sessionScore: session.sessionScore,
            }
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
/* =========================================================
 * 10. CẬP NHẬT THÔNG TIN PHIÊN ĐIỂM DANH
 * ========================================================= */
async function updateSession(req, res) {
    try {
        const { id } = req.params;
        const { name, expiresAt, radius, sessionScore } = req.body; // ⬅️ nhận thêm
        const session = await client_1.prisma.attendanceSession.findUnique({
            where: { id: Number(id) },
        });
        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }
        const updates = {
            name,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        };
        if (radius !== undefined && radius !== null && radius !== "") {
            const safeRadius = Math.min(Math.max(Number(radius), 20), 500);
            updates.radius = safeRadius;
        }
        if (sessionScore !== undefined && sessionScore !== null && sessionScore !== "") {
            updates.sessionScore = Number(sessionScore);
        }
        const updated = await client_1.prisma.attendanceSession.update({
            where: { id: Number(id) },
            data: updates,
        });
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error("❌ updateSession error:", err);
        return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
}
/* =========================================================
 * 11. XOÁ 1 PHIÊN ĐIỂM DANH
 * ========================================================= */
async function deleteSession(req, res) {
    try {
        const id = Number(req.params.id);
        await attendanceService.deleteAttendanceSession(id);
        return res.json({ success: true, message: "Deleted successfully" });
    }
    catch (err) {
        console.error("❌ deleteSession error:", err);
        const code = err.statusCode === 404 ? 404 : 400;
        return res.status(code).json({ success: false, message: err.message || "Bad request" });
    }
}
