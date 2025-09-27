import { Request, Response } from "express";
import * as attendanceService from "./attendance.service";
import { prisma } from "../../prisma/client";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// Tạo session + QR code
export async function createSession(req: Request, res: Response) {
  try {
    const { sectionId, name, expiresAt, latitude, longitude, radius } = req.body; 
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
        latitude: latitude || null,       // 👈 thêm vào
        longitude: longitude || null,     // 👈 thêm vào
        radius: radius || 70,             // 👈 cho phép client chọn bán kính
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    const checkInUrl = `http://localhost:5173/diemdanh?sessionId=${session.id}`;

    const uploadsDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

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

// Sinh viên check-in
export async function checkIn(req: Request, res: Response) {
    try {
        const { sessionId, studentCode, latitude, longitude } = req.body;

        if (!sessionId || !studentCode) {
            return res.status(400).json({
                success: false,
                message: "sessionId và studentCode là bắt buộc",
            });
        }

        // Tìm session
        const session = await prisma.attendanceSession.findUnique({
            where: { id: Number(sessionId) },
        });
        if (!session) {
            return res
                .status(404)
                .json({ success: false, message: "Session không tồn tại" });
        }

        // Tìm student
        const student = await prisma.student.findUnique({
            where: { studentCode },
            include: { user: true },
        });
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Sinh viên không tồn tại" });
        }

        // Kiểm tra sinh viên có trong lớp không
        const enrolled = await prisma.sectionEnrollment.findFirst({
            where: { sectionId: session.sectionId, studentId: student.id },
        });
        if (!enrolled) {
            return res.status(400).json({
                success: false,
                message: "Sinh viên không thuộc học phần này",
            });
        }

        // Xác định trạng thái điểm danh
        let status: "present" | "warning" | "late" = "present";
        let distance: number | null = null;

        // Nếu có vị trí thì tính khoảng cách
        if (
            latitude &&
            longitude &&
            session.latitude &&
            session.longitude &&
            session.radius
        ) {
            distance = getDistanceFromLatLonInM(
                session.latitude,
                session.longitude,
                latitude,
                longitude
            );
            if (distance > session.radius) {
                status = "warning"; // vẫn điểm danh nhưng cảnh báo
            }
        }

        // Nếu có expiresAt và đã quá hạn
        if (session.expiresAt && new Date() > session.expiresAt) {
            status = "late";
        }

        // Kiểm tra đã điểm danh chưa
        const existing = await prisma.attendance.findFirst({
            where: { sessionId: session.id, studentId: student.id },
        });
        if (existing) {
            return res.json({
                success: true,
                message: "Đã điểm danh trước đó",
                data: existing,
            });
        }

        // Tạo record điểm danh
        const attendance = await prisma.attendance.create({
            data: {
                sessionId: session.id,
                studentId: student.id,
                status,
                latitude,
                longitude,
                distance,
            },
            include: { student: { include: { user: true } } },
        });

        res.json({
            success: true,
            message: "Điểm danh thành công",
            data: attendance,
        });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}


// Utility: tính khoảng cách Haversine
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // bán kính Trái đất (m)
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
    const sessions = await attendanceService.getAttendanceSessions(sectionId);

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
      return res.status(404).json({ success: false, message: "Session not found" });
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
