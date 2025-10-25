import { Request, Response } from "express";
import * as attendanceService from "./attendance.service";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { prisma } from "@/prisma/client";
import { randomBytes } from "crypto";
import {
  getClientIp,
  getIpGeo,
  haversineMeters,
} from "../../../common/net.utils";
import { verify } from "../../../common/hmac";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const SECRET = process.env.ATTENDANCE_HMAC_SECRET || "dev-secret";

/* =========================================================
 * 1. TẠO PHIÊN ĐIỂM DANH (attendanceSession) + QR
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
    } = req.body;

    const sectionIdNum = Number(sectionId);
    if (!sectionIdNum || Number.isNaN(sectionIdNum)) {
      return res
        .status(400)
        .json({ success: false, message: "sectionId required" });
    }

    // Tạo mã session random kiểu ABCD1234
    const sessionCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    const session = await prisma.attendanceSession.create({
      data: {
        sectionId: sectionIdNum,
        sessionCode,
        name: name || null,
        latitude: latitude || null,
        longitude: longitude || null,
        radius: radius || 50,
        requireDeviceCheck: requireDeviceCheck ?? true,
        maxCheckInsPerIP: maxCheckInsPerIP || 3,
        // Thời điểm hết hạn điểm danh (giá trị do giảng viên chọn)
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Link điểm danh cho sinh viên (FE dùng sessionId để gửi check-in)
    const checkInUrl = `http://localhost:5173/diemdanh?sessionId=${session.id}`;

    // Sinh QR code file .png và lưu đường dẫn
    const uploadsDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const qrPath = path.join(uploadsDir, `${session.id}.png`);
    await QRCode.toFile(qrPath, checkInUrl);

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { qrCodeUrl: `/uploads/${session.id}.png` },
    });

    return res.json({
      success: true,
      data: updatedSession,
      link: checkInUrl,
    });
  } catch (err: any) {
    console.error("❌ createSession error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 2. KÝ PAYLOAD TẠM (HMAC) - FE gọi trước khi check-in
 *    FE: gửi "base" -> server ký -> trả chữ ký
 *    LƯU Ý: Với flow an toàn hơn, bạn có thể ký ở FE bằng
 *    1 endpoint auth riêng thay vì public, tuỳ mô hình bảo mật.
 * ========================================================= */
export async function signPayload(req: Request, res: Response) {
  try {
    const { base } = req.body;
    if (!base) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu base string để ký" });
    }
    const signature = crypto
      .createHmac("sha256", SECRET)
      .update(base)
      .digest("hex");
    return res.json({ success: true, signature });
  } catch (err: any) {
    console.error("❌ signPayload error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 3. CẤP NONCE (một lần dùng, TTL ngắn ~60s)
 *    FE sẽ gọi trước check-in để xin nonce.
 * ========================================================= */
export async function issueNonce(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    const session = await prisma.attendanceSession.findUnique({
      where: { id: Number(sessionId) },
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // TTL 60s kể từ bây giờ
    const value = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await prisma.attendanceNonce.create({
      data: {
        sessionId: session.id,
        value,
        expiresAt,
        used: false,
      },
    });

    return res.json({
      success: true,
      nonce: value,
      expiresAt,
    });
  } catch (err: any) {
    console.error("❌ issueNonce error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 4. SINH VIÊN CHECK-IN (CHỐNG GIAN LẬN)
 * ========================================================= */
export async function checkIn(req: Request, res: Response) {
  try {
    const {
      sessionId,
      studentCode,
      latitude,
      longitude,
      accuracy,
      deviceId,
      nonce,
      payloadSig,
    } = req.body;

    /* ---------------------------
     * 0) Validate input cơ bản
     * --------------------------- */
    if (!sessionId || !studentCode) {
      return res.status(400).json({
        success: false,
        message: "sessionId và studentCode là bắt buộc",
      });
    }
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Vị trí GPS là bắt buộc để điểm danh",
      });
    }
    if (!nonce || !payloadSig) {
      return res.status(400).json({
        success: false,
        message: "Thiếu nonce hoặc payloadSig",
      });
    }

    /* ---------------------------
     * 1) Lấy IP & User-Agent
     * --------------------------- */
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const ua = new UAParser(userAgent).getResult();
    const deviceInfo = `${ua.os.name ?? ""} ${ua.os.version ?? ""} | ${
      ua.browser.name ?? ""
    } ${ua.browser.version ?? ""}`;

    /* ---------------------------
     * 2) Kiểm tra nonce
     *    - còn hạn?
     *    - chưa dùng?
     * --------------------------- */
    const found = await prisma.attendanceNonce.findUnique({
      where: { value: nonce },
    });
    if (!found || found.used || found.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Nonce invalid or expired." });
    }

    /* ---------------------------
     * 3) Verify chữ ký HMAC payloadSig
     *    FE ký base = `${sessionId}|${latitude}|${longitude}|${accuracy}|${nonce}`
     * --------------------------- */
    const base = [sessionId, latitude, longitude, accuracy, nonce].join("|");
    if (!verify(base, payloadSig)) {
      return res
        .status(400)
        .json({ success: false, message: "Signature mismatch." });
    }

    /* ---------------------------
     * 4) Lấy session và check thời hạn expiresAt
     * --------------------------- */
    const session = await prisma.attendanceSession.findUnique({
      where: { id: Number(sessionId) },
    });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // Nếu session có expiresAt thì không cho điểm danh sau thời điểm đó
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
      return res.status(410).json({
        success: false,
        message: "Buổi điểm danh đã hết hạn (đã quá thời gian expiresAt).",
      });
    }

    /* ---------------------------
     * 5) Tìm sinh viên theo studentCode
     * --------------------------- */
    const student = await prisma.student.findUnique({
      where: { studentCode },
      include: { user: true },
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Sinh viên không tồn tại",
      });
    }

    /* ---------------------------
     * 6) Kiểm tra sinh viên có thuộc section không
     * --------------------------- */
    const enrolled = await prisma.sectionEnrollment.findFirst({
      where: {
        sectionId: session.sectionId,
        studentId: student.id,
      },
    });
    if (!enrolled) {
      return res.status(400).json({
        success: false,
        message: "Sinh viên không thuộc học phần này",
      });
    }

    /* ---------------------------
     * 7) Kiểm tra đã điểm danh chưa
     * --------------------------- */
    const existing = await prisma.attendance.findFirst({
      where: {
        sessionId: session.id,
        studentId: student.id,
      },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã điểm danh rồi",
        data: existing,
      });
    }

    /* ---------------------------
     * 8) Chống gian lận theo IP
     *    - cùng 1 IP không được spam quá nhiều
     * --------------------------- */
    const ipCheckCount = await prisma.attendance.count({
      where: {
        sessionId: session.id,
        ipAddress,
      },
    });
    if (ipCheckCount >= (session.maxCheckInsPerIP || 3)) {
      return res.status(400).json({
        success: false,
        message: `IP này đã điểm danh ${ipCheckCount} lần. Nghi vấn gian lận!`,
        isValid: false,
      });
    }

    /* ---------------------------
     * 9) Kiểm tra GPS trong bán kính lớp
     * --------------------------- */
    let distance: number | null = null;
    let isValid = true;
    let status: "present" | "late" | "absent" = "present";

    if (session.latitude && session.longitude && session.radius) {
      distance = haversineMeters(
        session.latitude,
        session.longitude,
        Number(latitude),
        Number(longitude)
      );
      const inRadius = distance <= (session.radius ?? 50);
      if (!inRadius) {
        isValid = false;
      }
    }

    /* ---------------------------
     * 10) So sánh vị trí IP vs GPS
     *      - nếu lệch quá xa => nghi ngờ share toạ độ giả
     * --------------------------- */
    const ipGeo = getIpGeo(ipAddress); // { lat, lon, country, city } | null
    let ipVsGpsKm: number | null = null;
    if (ipGeo) {
      ipVsGpsKm =
        haversineMeters(
          Number(latitude),
          Number(longitude),
          ipGeo.lat,
          ipGeo.lon
        ) / 1000;
    }
    const suspiciousByIpGeo = ipVsGpsKm !== null && ipVsGpsKm > 50; // > 50km khác nhau
    if (suspiciousByIpGeo) {
      isValid = false;
    }

    /* ---------------------------
     * 11) Ràng buộc deviceId (thiết bị)
     *      - nếu thiết bị mới, ta lưu fingerprint
     *      - nếu không gửi deviceId => nghi vấn
     * --------------------------- */
    let deviceTrusted = true;
    if (deviceId) {
      const existed = await prisma.deviceFingerprint.findUnique({
        where: {
          studentId_deviceId: {
            studentId: student.id,
            deviceId: deviceId,
          },
        },
      });

      if (!existed) {
        // Thiết bị lần đầu xuất hiện => lưu lại
        await prisma.deviceFingerprint.create({
          data: {
            studentId: student.id,
            deviceId: deviceId,
            userAgent,
          },
        });

        // Nếu bạn muốn "thiết bị lạ lần đầu = cảnh báo", bật dòng dưới:
        // deviceTrusted = false;
      }
    } else {
      deviceTrusted = false; // không gửi deviceId
    }

    if (!deviceTrusted) {
      isValid = false;
    }

    /* ---------------------------
     * 12) TÍNH ĐIỂM CHUYÊN CẦN
     * --------------------------- */
    let score = 10; // mặc định
    // 12.1. Lấy rule chấm điểm của lớp
    const scoreRules = await prisma.attendanceScoreRule.findMany({
      where: { sectionId: session.sectionId },
    });
    const matchedRule = scoreRules.find((r) => r.status === status);
    if (matchedRule) {
      score = matchedRule.score;
    } else {
      // fallback
      if (status === "present") score = 10;
    }

    // 12.2. Giảm điểm nếu bị coi là nghi vấn / đứng quá xa
    if (!isValid && distance !== null) {
      const extraDistance = distance - (session.radius || 50);
      const penalty = Math.min(extraDistance / 100, 3); // mỗi 100m trừ 1đ, tối đa trừ 3
      score = Math.max(score - penalty, 0);
    }

    // 12.3. Điểm danh trễ (tính từ lúc session tạo ra)
    const now = new Date();
    const sessionStart = new Date(session.createdAt);
    const minutesLate = Math.floor(
      (now.getTime() - sessionStart.getTime()) / (1000 * 60)
    );

    if (minutesLate > 15 && minutesLate <= 30) {
      status = "late";
      score = Math.max(score - 2, 0);
    } else if (minutesLate > 30) {
      status = "late";
      score = Math.max(score - 4, 0);
    }

    // Làm tròn 1 chữ số thập phân
    score = Math.round(score * 10) / 10;

    /* ---------------------------
     * 13) TẠO BẢN GHI attendance
     * --------------------------- */
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
      include: {
        student: { include: { user: true } },
      },
    });

    /* ---------------------------
     * 14) Đánh dấu nonce đã dùng + ghi log forensic
     * --------------------------- */
    await prisma.attendanceNonce.update({
      where: { value: nonce },
      data: { used: true },
    });

    await prisma.attendanceLog.create({
      data: {
        studentId: student.id,
        sessionId: session.id,
        ipAddress,
        userAgent,
        ipCountry: ipGeo?.country,
        ipCity: ipGeo?.city,
        flags: JSON.stringify({
          ipVsGpsKm,
          suspiciousByIpGeo,
          deviceTrusted,
        }),
        note: isValid ? null : "Suspicious attendance (geo/device).",
      },
    });

    /* ---------------------------
     * 15) Response trả về FE
     * --------------------------- */
    return res.json({
      success: true,
      message: isValid
        ? "Điểm danh thành công"
        : "Điểm danh thành công nhưng có cảnh báo",
      data: attendance,
      warning: !isValid
        ? `Lệch vị trí / thiết bị không khớp. Khoảng cách: ${
            distance?.toFixed?.(0) ?? "?"
          }m.`
        : null,
      scoreInfo: {
        score,
        status,
        minutesLate,
        appliedRule: matchedRule
          ? `Quy tắc: ${matchedRule.score}`
          : "Mặc định",
      },
    });
  } catch (err: any) {
    console.error("❌ Error in checkIn:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 5. GV CHỈNH ĐIỂM DANH THỦ CÔNG (ví dụ xác nhận ngoại lệ)
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
 *    Có tính cả status "warning" nếu ngoài bán kính
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
    const id = parseInt(req.params.id);
    const session = await attendanceService.getAttendanceSessionById(id);
    return res.json({ success: true, data: session });
  } catch (err: any) {
    console.error("❌ getSession error:", err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
}

/* =========================================================
 * 10. CẬP NHẬT THÔNG TIN PHIÊN ĐIỂM DANH (VD: đổi tên, đổi expiresAt)
 * ========================================================= */
export async function updateSession(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, expiresAt } = req.body;

    const session = await prisma.attendanceSession.findUnique({
      where: { id: Number(id) },
    });
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: Number(id) },
      data: {
        name,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("❌ updateSession error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}

/* =========================================================
 * 11. XOÁ 1 PHIÊN ĐIỂM DANH
 * ========================================================= */
export async function deleteSession(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await attendanceService.deleteAttendanceSession(id);
    return res.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    console.error("❌ deleteSession error:", err);
    return res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
}
