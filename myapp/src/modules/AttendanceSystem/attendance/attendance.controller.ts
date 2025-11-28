import { Request, Response } from "express";
import * as attendanceService from "./attendance.service";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import { getClientIp, getIpGeo, haversineMeters } from "../../../common/net.utils";
import { verify } from "../../../common/hmac";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { totp } from "otplib";  
import { prisma } from "../../../prisma/client";

const SECRET = process.env.ATTENDANCE_HMAC_SECRET || "dev-secret";



// cấu hình mặc định cho toàn hệ thống (có thể chuyển .env)
const DEFAULT_TOTP_PERIOD = 10;  // 10 giây
const DEFAULT_TOTP_DIGITS = 6;

// ===== helper sinh secret base32 mạnh
function generateTotpSecretBase32() {
  // 20 bytes random -> base32 (tương thích otplib)
  return Buffer.from(crypto.randomBytes(20)).toString("base64") // raw
    .replace(/[^A-Z2-7]/gi, "A")                                // normalize
    .slice(0, 32)                                               // 32 chars
    .toUpperCase();                                             // base32-like
}

/* ===================== ====================================
 * 1) TẠO PHIÊN ĐIỂM DANH (bổ sung secret TOTP)
 * ========================================================= */
export async function createSession(req: Request, res: Response) {
  try {
    const {
      sectionId,
      name,
      expiresAt,
      latitude,
      longitude,
      radius,
      requireDeviceCheck,
      maxCheckInsPerIP,
      sessionScore,            // ⬅️ thêm
    } = req.body;

    const sessionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const totpSecretBase32 = generateTotpSecretBase32();

    const session = await prisma.attendanceSession.create({
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
        sessionScore:
          sessionScore !== undefined && sessionScore !== null
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
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}


/* =========================================================
 * 1a) API CHỈ GV DÙNG: LẤY SECRET TOTP CỦA 1 SESSION
 * ========================================================= */
export async function getSessionTotpConfig(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const s = await prisma.attendanceSession.findUnique({
      where: { id },
      select: { totpSecretBase32: true, totpPeriod: true, totpDigits: true }
    });
    if (!s || !s.totpSecretBase32) {
      return res.status(404).json({ success:false, message: "Không có TOTP cho phiên" });
    }
    return res.json({
      success:true,
      totp: {
        secretBase32: s.totpSecretBase32,
        period: s.totpPeriod || DEFAULT_TOTP_PERIOD,
        digits: s.totpDigits || DEFAULT_TOTP_DIGITS,
      }
    });
  } catch (err:any) {
    return res.status(500).json({ success:false, message: err.message });
  }
}


/* =========================================================
 * 1b) Lấy mã TOTP hiện tại cho session (dùng trong QR động)
 * ========================================================= */
export async function getSessionCurrentTotp(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const sess = await prisma.attendanceSession.findUnique({ where: { id }});
    if (!sess) return res.json({ success: false, message: "Session not found" });

    totp.options = { digits: 6, step: 10 };

    const token = generateTotpSecretBase32();

    return res.json({
      success: true,
      token,
      period: 10
    });
  } catch (err: any) {
    return res.json({ success: false, message: err.message });
  }
}


/* =========================================================
 * 2. KÝ PAYLOAD TẠM (HMAC)
 * ========================================================= */
export async function signPayload(req: Request, res: Response) {
  try {
    const { base } = req.body;
    if (!base) {
      return res.status(400).json({ success: false, message: "Thiếu base string để ký" });
    }
    const signature = crypto.createHmac("sha256", SECRET).update(base).digest("hex");
    return res.json({ success: true, signature });
  } catch (err: any) {
    console.error("❌ signPayload error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 3. CẤP NONCE
 * ========================================================= */
export async function issueNonce(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const value = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    await prisma.attendanceNonce.create({
      data: { sessionId: session.id, value, expiresAt, used: false },
    });

    return res.json({ success: true, nonce: value, expiresAt });
  } catch (err: any) {
    console.error("❌ issueNonce error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 4. SV CHECK-IN (kiểm accuracy + distance + IP-Geo + deviceId)
 * ========================================================= */
export async function checkIn(req: Request, res: Response) {
  try {
    const {
      sessionId,
      studentCode,
      scannedToken,
      latitude,
      longitude,
      accuracy,
      deviceId,
      nonce,
      payloadSig,
    } = req.body;

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
        message: `Không thể xác định vị trí chính xác (Sai số: ${
          Number.isFinite(accNum) ? Math.round(accNum) + "m" : "N/A"
        } > ${MAX_ALLOWED_ACCURACY}m). Vui lòng tắt->bật lại Wi-Fi THỬ.`,
      });
    }

      // -- Lấy session & secret
    const sessionDb = await prisma.attendanceSession.findUnique({
      where: { id: Number(sessionId) },
    });
    if (!sessionDb) return res.status(404).json({ success:false, message:"Session not found" });

    // ✅ TOTP chỉ kiểm khi client có gửi scannedToken
if (sessionDb.totpSecretBase32 && scannedToken) {
  totp.options = {
    step: sessionDb.totpPeriod || DEFAULT_TOTP_PERIOD,
    digits: sessionDb.totpDigits || DEFAULT_TOTP_DIGITS,
  };
  const isValidToken = (totp as any).verify({
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
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const ua = new UAParser(userAgent).getResult();
    const deviceInfo = `${ua.os.name ?? ""} ${ua.os.version ?? ""} | ${ua.browser.name ?? ""} ${ua.browser.version ?? ""}`;

    // 2) Nonce
    const found = await prisma.attendanceNonce.findUnique({ where: { value: nonce } });
    if (!found || found.used || found.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Nonce invalid or expired." });
    }

    // 3) Verify HMAC
    const base = [sessionId, latitude, longitude, accuracy, nonce].join("|");
    if (!verify(base, payloadSig)) {
      return res.status(400).json({ success: false, message: "Signature mismatch." });
    }

    // 4) Session
    const session = await prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({ success: false, message: "Buổi điểm danh đã hết hạn." });
    }

    // 5) Student
    const student = await prisma.student.findUnique({ where: { studentCode }, include: { user: true } });
    if (!student) return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });

    // 6) Enrollment
    const enrolled = await prisma.sectionEnrollment.findFirst({
      where: { sectionId: session.sectionId, studentId: student.id },
    });
    if (!enrolled) return res.status(400).json({ success: false, message: "Sinh viên không thuộc học phần này" });

    // 7) Đã điểm danh?
    const existing = await prisma.attendance.findFirst({
      where: { sessionId: session.id, studentId: student.id },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Bạn đã điểm danh rồi", data: existing });
    }

    // 8) Chống spam theo IP
    const ipCheckCount = await prisma.attendance.count({
      where: { sessionId: session.id, ipAddress },
    });
  

    // 9) GPS trong bán kính
    let distance: number | null = null;
    let isValid = true;
    let status: "present" | "late" | "absent" = "present";

    if (session.latitude && session.longitude && session.radius) {
      distance = haversineMeters(session.latitude, session.longitude, Number(latitude), Number(longitude));
      const inRadius = distance <= (session.radius ?? 50);
      if (!inRadius) isValid = false;
    }

    // 10) So sánh IP vs GPS
    const ipGeo = getIpGeo(ipAddress);
    let ipVsGpsKm: number | null = null;
    if (ipGeo) ipVsGpsKm = haversineMeters(Number(latitude), Number(longitude), ipGeo.lat, ipGeo.lon) / 1000;
    const suspiciousByIpGeo = ipVsGpsKm !== null && ipVsGpsKm > 50;
    if (suspiciousByIpGeo) isValid = false;

    // 11) DEVICE trong session (không cho 1 device dùng cho SV khác)
    if (!deviceId) {
      return res.status(400).json({ success: false, message: "Thiếu deviceId. Không thể điểm danh." });
    }
    const existingDeviceInSession = await prisma.deviceFingerprint.findFirst({
      where: { sessionId: session.id, deviceId },
    });
    if (existingDeviceInSession && existingDeviceInSession.studentId !== student.id) {
      const owner = await prisma.student.findUnique({
        where: { id: existingDeviceInSession.studentId },
        select: { studentCode: true },
      });
      return res.status(403).json({
        success: false,
        message: "Thiết bị này đã được dùng để điểm danh bởi sinh viên khác trong buổi này!",
        warning: owner ? `Thiết bị đã dùng bởi MSSV: ${owner.studentCode}` : undefined,
      });
    }
    await prisma.deviceFingerprint.upsert({
      where: { uniq_session_device: { sessionId: session.id, deviceId } },
      update: { studentId: student.id, userAgent },
      create: { studentId: student.id, sessionId: session.id, deviceId, userAgent },
    });

 // 12) Điểm cho buổi này = sessionScore của session
const baseScore =
  (session as any).sessionScore !== undefined &&
  (session as any).sessionScore !== null
    ? Number((session as any).sessionScore)
    : 10;

const score = baseScore; // không phụ thuộc status / rule / trễ nữa


    // 13) Lưu attendance
    const attendance = await prisma.attendance.create({
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
    await prisma.attendanceNonce.update({ where: { value: nonce }, data: { used: true } });
    await prisma.attendanceLog.create({
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

  } catch (err: any) {
    console.error("❌ Error in checkIn:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 4b. MANUAL CHECK-IN (GV)
 * ========================================================= */
export async function manualCheckIn(req: Request, res: Response) {
  try {
    const { sessionId, studentCode, teacherId, note, status } = req.body;
    if (!sessionId || !studentCode || !teacherId) {
      return res.status(400).json({ success: false, message: "sessionId, studentCode, teacherId là bắt buộc" });
    }

    const session = await prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const student = await prisma.student.findUnique({ where: { studentCode }, include: { user: true } });
    if (!student) return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });

    const enrolled = await prisma.sectionEnrollment.findFirst({
      where: { sectionId: session.sectionId, studentId: student.id },
    });
    if (!enrolled) return res.status(400).json({ success: false, message: "Sinh viên không thuộc học phần này" });

    const existed = await prisma.attendance.findFirst({
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

let finalStatus: "present" | "late" | "absent" =
  (status as any) || "present";

const baseScore =
  (session as any).sessionScore !== undefined &&
  (session as any).sessionScore !== null
    ? Number((session as any).sessionScore)
    : 10;

const score = baseScore;


    const attendance = await prisma.attendance.create({
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

    await prisma.attendanceLog.create({
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
  } catch (err: any) {
    console.error("❌ manualCheckIn error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 4c. HỦY ĐIỂM DANH
 * ========================================================= */
export async function cancelAttendance(req: Request, res: Response) {
  try {
    const { sessionId, studentCode, teacherId, reason } = req.body;
    if (!sessionId || !studentCode || !teacherId) {
      return res.status(400).json({ success: false, message: "sessionId, studentCode, teacherId là bắt buộc" });
    }

    const session = await prisma.attendanceSession.findUnique({ where: { id: Number(sessionId) } });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const student = await prisma.student.findUnique({ where: { studentCode } });
    if (!student) return res.status(404).json({ success: false, message: "Sinh viên không tồn tại" });

    const attendance = await prisma.attendance.findFirst({
      where: { sessionId: session.id, studentId: student.id },
    });
    if (!attendance) return res.status(404).json({ success: false, message: "Chưa có bản ghi để hủy" });

    await prisma.attendance.delete({ where: { id: attendance.id } });

    await prisma.attendanceLog.create({
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
  } catch (err: any) {
    console.error("❌ cancelAttendance error:", err);
    const code = err.statusCode === 404 ? 404 : 400;
    return res.status(code).json({ success: false, message: err.message || "Bad request" });
  }
}

/* =========================================================
 * 5. GV CHỈNH ĐIỂM DANH THỦ CÔNG
 * ========================================================= */
export async function adjustAttendance(req: Request, res: Response) {
  try {
    const { attendanceId } = req.params;
    const { status, score, adjustedBy } = req.body;

    const attendance = await prisma.attendance.findUnique({
      where: { id: Number(attendanceId) },
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: "Attendance not found" });
    }

    const updated = await prisma.attendance.update({
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
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/* =========================================================
 * 6. LẤY DANH SÁCH CẢNH BÁO GIAN LẬN THEO SESSION
 * ========================================================= */
export async function getWarningAttendances(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    const warnings = await prisma.attendance.findMany({
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
  } catch (err: any) {
    console.error("❌ getWarningAttendances error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * (Helper cũ, bạn có thể bỏ nếu không còn dùng)
 * ========================================================= */
function extractDeviceInfo(userAgent: string): string {
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "Mac";
  return "Unknown";
}

function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
export async function listAllSessions(req: Request, res: Response) {
  try {
    const sessions = await prisma.attendanceSession.findMany({
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
  } catch (err: any) {
    console.error("❌ listAllSessions error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 8. LIỆT KÊ SESSION THEO LỚP (SECTION)
 * ========================================================= */
export async function listSessions(req: Request, res: Response) {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const sessions = await attendanceService.getAttendanceSessions(sectionId);

    // set status = "warning" nếu SV đứng ngoài bán kính
    const updated = sessions.map((session: any) => {
      if (!session.latitude || !session.longitude) return session;

      const radius = session.radius || 50;
      const attendances = session.attendances.map((a: any) => {
        let status = a.status;
        let distance: number | null = null;

        if (a.latitude && a.longitude) {
          distance = getDistanceFromLatLonInM(
            session.latitude,
            session.longitude,
            a.latitude,
            a.longitude
          );
          if (distance > radius) {
            status = "warning";
          }
        }

        return { ...a, distance, status };
      });

      return { ...session, attendances };
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("❌ listSessions error:", err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
}

/* =========================================================
 * 9. CHI TIẾT 1 SESSION
 * ========================================================= */
export async function getSession(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        attendances: {
          include: { student: { include: { user: true } } },
          orderBy: { checkedInAt: 'desc' }
        }
      }
    });

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

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
    sessionScore: (session as any).sessionScore,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* =========================================================
 * 10. CẬP NHẬT THÔNG TIN PHIÊN ĐIỂM DANH
 * ========================================================= */
export async function updateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, expiresAt, radius, sessionScore } = req.body; // ⬅️ nhận thêm

    const session = await prisma.attendanceSession.findUnique({
      where: { id: Number(id) },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const updates: any = {
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

    const updated = await prisma.attendanceSession.update({
      where: { id: Number(id) },
      data: updates,
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("❌ updateSession error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}



/* =========================================================
 * 11. XOÁ 1 PHIÊN ĐIỂM DANH
 * ========================================================= */
export async function deleteSession(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await attendanceService.deleteAttendanceSession(id);
    return res.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("❌ deleteSession error:", err);
    const code = err.statusCode === 404 ? 404 : 400;
    return res.status(code).json({ success: false, message: err.message || "Bad request" });
  }
}