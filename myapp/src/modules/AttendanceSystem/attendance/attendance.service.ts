import QRCode from "qrcode";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { prisma } from "@/prisma/client";

function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function createAttendanceSession(
    sectionId: number,
    latitude: number,
    longitude: number
) {
    const sessionCode = crypto.randomUUID();
    const qrPath = path.join(__dirname, `../../../uploads/${sessionCode}.png`);

    if (!fs.existsSync(path.dirname(qrPath))) {
        fs.mkdirSync(path.dirname(qrPath), { recursive: true });
    }

    await QRCode.toFile(qrPath, sessionCode);

    return prisma.attendanceSession.create({
        data: {
            sectionId,
            sessionCode,
            qrCodeUrl: `/uploads/${sessionCode}.png`,
            latitude,
            longitude,
        },
    });
}

export async function checkInAttendance(
    sessionCode: string,
    studentCode: string,
    lat: number,
    lon: number
) {
    const session = await prisma.attendanceSession.findUnique({
        where: { sessionCode },
    });
    if (!session) throw new Error("Session not found");

    const student = await prisma.student.findUnique({
        where: { studentCode },
    });
    if (!student) throw new Error("Student not found");

    const enrolled = await prisma.sectionEnrollment.findUnique({
        where: {
            sectionId_studentId: {
                sectionId: session.sectionId,
                studentId: student.id,
            },
        },
    });
    if (!enrolled) throw new Error("Student not enrolled in this section");

    const distance = calculateDistance(
        session.latitude!,
        session.longitude!,
        lat,
        lon
    );
    const status = distance <= (session.radius ?? 50) ? "present" : "warning";

    return prisma.attendance.create({
        data: {
            sessionId: session.id,
            studentId: student.id,
            latitude: lat,
            longitude: lon,
            distance,
            status,
        },
        include: {
            student: { include: { user: true } },
        },
    });
}

export async function getAttendanceSessions(sectionId: number) {
    return prisma.attendanceSession.findMany({
        where: { sectionId },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getAttendanceSessionById(id: number) {
    return prisma.attendanceSession.findUnique({
        where: { id },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
    });
}



export async function deleteAttendanceSession(id: number) {
  // kiểm tra tồn tại trước
  const exists = await prisma.attendanceSession.findUnique({ where: { id } });
  if (!exists) {
    const err: any = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    // 1) Xoá các bản ghi phụ thuộc
    await tx.attendanceLog.deleteMany({ where: { sessionId: id } });
    await tx.attendanceNonce.deleteMany({ where: { sessionId: id } });
    await tx.attendance.deleteMany({ where: { sessionId: id } });

    // 2) Xoá session
    await tx.attendanceSession.delete({ where: { id } });
  });

  // 3) (không bắt buộc) dọn file QR nếu có
  try {
    if (exists.qrCodeUrl) {
      const uploadsDir = path.join(__dirname, "../../../uploads");
      const filename = path.basename(exists.qrCodeUrl);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch { /* ignore file errors */ }

  return true;
}

