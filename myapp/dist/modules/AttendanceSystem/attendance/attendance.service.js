"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAttendanceSession = createAttendanceSession;
exports.checkInAttendance = checkInAttendance;
exports.getAttendanceSessions = getAttendanceSessions;
exports.getAttendanceSessionById = getAttendanceSessionById;
exports.deleteAttendanceSession = deleteAttendanceSession;
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("../../../prisma/client");
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function createAttendanceSession(sectionId, latitude, longitude) {
    const sessionCode = crypto_1.default.randomUUID();
    const qrPath = path_1.default.join(__dirname, `../../../uploads/${sessionCode}.png`);
    if (!fs_1.default.existsSync(path_1.default.dirname(qrPath))) {
        fs_1.default.mkdirSync(path_1.default.dirname(qrPath), { recursive: true });
    }
    await qrcode_1.default.toFile(qrPath, sessionCode);
    return client_1.prisma.attendanceSession.create({
        data: {
            sectionId,
            sessionCode,
            qrCodeUrl: `/uploads/${sessionCode}.png`,
            latitude,
            longitude,
        },
    });
}
async function checkInAttendance(sessionCode, studentCode, lat, lon) {
    const session = await client_1.prisma.attendanceSession.findUnique({
        where: { sessionCode },
    });
    if (!session)
        throw new Error("Session not found");
    const student = await client_1.prisma.student.findUnique({
        where: { studentCode },
    });
    if (!student)
        throw new Error("Student not found");
    const enrolled = await client_1.prisma.sectionEnrollment.findUnique({
        where: {
            sectionId_studentId: {
                sectionId: session.sectionId,
                studentId: student.id,
            },
        },
    });
    if (!enrolled)
        throw new Error("Student not enrolled in this section");
    const distance = calculateDistance(session.latitude, session.longitude, lat, lon);
    const status = distance <= (session.radius ?? 50) ? "present" : "warning";
    return client_1.prisma.attendance.create({
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
async function getAttendanceSessions(sectionId) {
    return client_1.prisma.attendanceSession.findMany({
        where: { sectionId },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getAttendanceSessionById(id) {
    return client_1.prisma.attendanceSession.findUnique({
        where: { id },
        include: {
            attendances: { include: { student: { include: { user: true } } } },
        },
    });
}
async function deleteAttendanceSession(id) {
    // kiểm tra tồn tại trước
    const exists = await client_1.prisma.attendanceSession.findUnique({ where: { id } });
    if (!exists) {
        const err = new Error("Session not found");
        err.statusCode = 404;
        throw err;
    }
    await client_1.prisma.$transaction(async (tx) => {
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
            const uploadsDir = path_1.default.join(__dirname, "../../../uploads");
            const filename = path_1.default.basename(exists.qrCodeUrl);
            const filePath = path_1.default.join(uploadsDir, filename);
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
        }
    }
    catch { /* ignore file errors */ }
    return true;
}
