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
exports.listStudentAttendance = listStudentAttendance;
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
    return client_1.prisma.attendanceSession.delete({ where: { id } });
}
//Danh sách điểm danh của 1 sinh viên trong 1 lớp học phần
async function listStudentAttendance(sectionId, studentId) {
    const records = await client_1.prisma.attendance.findMany({
        where: { studentId, session: { sectionId } },
        include: {
            session: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    expiresAt: true,
                },
            },
        },
        orderBy: { sessionId: "asc" },
    });
    return records.map((a) => ({
        attendanceId: a.id,
        sessionId: a.sessionId,
        sessionName: a.session?.name ?? `Session #${a.sessionId}`,
        createdAt: a.session?.createdAt,
        expiresAt: a.session?.expiresAt,
        status: a.status,
    }));
}
