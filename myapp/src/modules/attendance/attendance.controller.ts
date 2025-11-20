import { NextFunction, Request, Response } from "express";
import * as attendanceService from "./attendance.service";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { prisma } from "@/prisma/client";
import { listStudentAttendance } from "./attendance.service";
import catchAsync from "@/utils/catchAsync";
import ApiError from "@/utils/ApiError";
import { sendResponse } from "@/utils/response";

// Tạo session + QR code
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
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        const checkInUrl = `http://localhost:5173/diemdanh?sessionId=${session.id}`;

        const uploadsDir = path.join(__dirname, "../../../uploads");
        if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });

        const qrPath = path.join(uploadsDir, `${session.id}.png`);
        await QRCode.toFile(qrPath, checkInUrl);

        const updatedSession = await prisma.attendanceSession.update({
            where: { id: session.id },
            data: { qrCodeUrl: `/uploads/${session.id}.png` },
        });

        res.json({ success: true, data: updatedSession, link: checkInUrl });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// 🔥 Sinh viên check-in với chống gian lận
export async function checkIn(req: Request, res: Response) {
    try {
        const { sessionId, studentCode, latitude, longitude } = req.body;

        if (!sessionId || !studentCode) {
            return res.status(400).json({
                success: false,
                message: "sessionId và studentCode là bắt buộc",
            });
        }

        // 1️⃣ Lấy thông tin thiết bị và IP
        const ipAddress =
            (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
            req.socket.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        const deviceInfo = extractDeviceInfo(userAgent);
        [];

        // 2️⃣ Tìm session
        const session = await prisma.attendanceSession.findUnique({
            where: { id: Number(sessionId) },
        });
        if (!session) {
            return res
                .status(404)
                .json({ success: false, message: "Session không tồn tại" });
        }

        // 3️⃣ Kiểm tra session hết hạn
        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "Session điểm danh đã hết hạn",
            });
        }

        // 4️⃣ Tìm student
        const student = await prisma.student.findUnique({
            where: { studentCode },
            include: { user: true },
        });
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Sinh viên không tồn tại" });
        }

        // 5️⃣ Kiểm tra sinh viên có trong lớp không
        const enrolled = await prisma.sectionEnrollment.findFirst({
            where: { sectionId: session.sectionId, studentId: student.id },
        });
        if (!enrolled) {
            return res.status(400).json({
                success: false,
                message: "Sinh viên không thuộc học phần này",
            });
        }

        // 6️⃣ Kiểm tra đã điểm danh chưa
        const existing = await prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId: student.id },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã điểm danh rồi",
                data: existing,
            });
        }

        // 7️⃣ 🔥 CHỐNG GIAN LẬN: Kiểm tra số lần điểm danh từ cùng IP
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

        // 8️⃣ 🔥 CHỐNG GIAN LẬN: Kiểm tra vị trí
        let status: "present" | "warning" | "late" | "absent" = "present";
        let distance: number | null = null;
        let isValid = true;

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

        if (session.latitude && session.longitude && session.radius) {
            distance = getDistanceFromLatLonInM(
                session.latitude,
                session.longitude,
                latitude,
                longitude
            );

            if (distance > session.radius) {
                status = "warning";
                isValid = false; // Đánh dấu không hợp lệ nếu ngoài phạm vi
            }
        }

        // 9️⃣ 🔥 CHỐNG GIAN LẬN: Kiểm tra thiết bị (nếu bật)
        if (session.requireDeviceCheck && session.allowedDevices) {
            const allowedList = session.allowedDevices as string[];
            if (!allowedList.includes(deviceInfo)) {
                return res.status(400).json({
                    success: false,
                    message: "Thiết bị của bạn chưa được đăng ký",
                });
            }
        }

        // 🔟 🔥 TÍNH ĐIỂM TỰ ĐỘNG
        let score = 10; // Điểm mặc định

        // 1. Lấy quy tắc chấm điểm của section
        const scoreRules = await prisma.attendanceScoreRule.findMany({
            where: { sectionId: session.sectionId },
        });

        // 2. Tìm quy tắc phù hợp với status
        const rule = scoreRules.find((r) => r.status === status);
        if (rule) {
            score = rule.score;
        } else {
            // Quy tắc mặc định nếu không có trong DB
            switch (status) {
                case "present":
                    score = 10;
                    break;
            }
        }

        // 3. Điều chỉnh điểm nếu không hợp lệ (ngoài phạm vi)
        if (!isValid && distance) {
            // Giảm điểm theo khoảng cách
            const extraDistance = distance - (session.radius || 50);
            const penalty = Math.min(extraDistance / 100, 3); // Mỗi 100m trừ 1 điểm, tối đa trừ 3
            score = Math.max(score - penalty, 0);
        }

        // 4. Kiểm tra điểm danh muộn (dựa vào thời gian tạo session)
        const now = new Date();
        const sessionStart = new Date(session.createdAt);
        const minutesLate = Math.floor(
            (now.getTime() - sessionStart.getTime()) / (1000 * 60)
        );

        if (minutesLate > 15 && minutesLate <= 30) {
            // Muộn 15-30 phút
            status = "late";
            score = Math.max(score - 2, 0);
        } else if (minutesLate > 30) {
            // Muộn > 30 phút
            status = "late";
            score = Math.max(score - 4, 0);
        }

        // Làm tròn điểm 1 chữ số thập phân
        score = Math.round(score * 10) / 10;

        // 1️⃣1️⃣ Tạo record điểm danh
        const attendance = await prisma.attendance.create({
            data: {
                sessionId: session.id,
                studentId: student.id,
                status,
                latitude,
                longitude,
                distance,
                ipAddress,
                deviceInfo,
                userAgent,
                isValid,
                score, // 🔥 Lưu điểm vào DB
            },
            include: { student: { include: { user: true } } },
        });

        // 🔔 Gửi cảnh báo cho GV nếu nghi vấn gian lận
        if (!isValid) {
            console.warn(
                `⚠️ Nghi vấn gian lận: Student ${studentCode}, Distance: ${distance}m, IP: ${ipAddress}, Score: ${score}`
            );
        }

        // 1️⃣2️⃣ Log chi tiết
        console.log(`✅ Check-in successful:`, {
            student: studentCode,
            status,
            score,
            distance: distance?.toFixed(2),
            minutesLate,
            isValid,
        });

        res.json({
            success: true,
            message: isValid
                ? "Điểm danh thành công"
                : "Điểm danh thành công nhưng có cảnh báo",
            data: attendance,
            warning: !isValid
                ? `Bạn ở ngoài phạm vi lớp học (${distance?.toFixed(
                      0
                  )}m). Điểm: ${score}/10`
                : null,
            scoreInfo: {
                score,
                status,
                minutesLate,
                appliedRule: rule
                    ? `Quy tắc của GV: ${rule.score} điểm`
                    : "Quy tắc mặc định",
            },
        });
    } catch (err: any) {
        console.error("❌ Error in checkIn:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// 🔥 GV chỉnh điểm danh
export async function adjustAttendance(req: Request, res: Response) {
    try {
        const { attendanceId } = req.params;
        const { status, score, note, adjustedBy } = req.body;

        // Kiểm tra quyền (adjustedBy phải là giảng viên)
        // TODO: Implement role check

        const attendance = await prisma.attendance.findUnique({
            where: { id: Number(attendanceId) },
        });

        if (!attendance) {
            return res
                .status(404)
                .json({ success: false, message: "Attendance not found" });
        }

        const updated = await prisma.attendance.update({
            where: { id: Number(attendanceId) },
            data: {
                status: status || attendance.status,
                score: score ?? attendance.score,
                adjustedBy: adjustedBy || null,
                adjustedAt: new Date(),
                isValid: true, // GV xác nhận là hợp lệ
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

// 🔥 Lấy danh sách điểm danh có cảnh báo
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

        res.json({ success: true, data: warnings });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Utility: Extract device info từ User-Agent
function extractDeviceInfo(userAgent: string): string {
    // Simple extraction, có thể dùng thư viện như `ua-parser-js`
    if (userAgent.includes("iPhone")) return "iPhone";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "Mac";
    return "Unknown";
}

// Utility: tính khoảng cách Haversine
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

// Lấy tất cả session điểm danh
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

        res.json({ success: true, data: sessions });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// Controller
export async function listSessions(req: Request, res: Response) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const sessions = await attendanceService.getAttendanceSessions(
            sectionId
        );

        // Map lại để tính status "warning" nếu ngoài bán kính
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

        res.json({ success: true, data: updated });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

export async function getSession(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const session = await attendanceService.getAttendanceSessionById(id);
        res.json({ success: true, data: session });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Sửa QR Session
export async function updateSession(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { name, expiresAt } = req.body;

        // check tồn tại
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

        res.json({ success: true, data: updated });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

export async function deleteSession(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await attendanceService.deleteAttendanceSession(id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// Danh sách điểm danh của 1 sinh viên trong 1 lớp học phần
export const listBySection = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const studentId = Number(req.params.studentId);

        if (isNaN(sectionId) || isNaN(studentId)) {
            return next(new ApiError(400, "Invalid params"));
        }

        const items = await listStudentAttendance(sectionId, studentId);

        return sendResponse(res, {
            success: true,
            data: items,
        });
    }
);
