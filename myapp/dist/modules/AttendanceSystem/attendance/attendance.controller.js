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
exports.listBySection = void 0;
exports.createSession = createSession;
exports.checkIn = checkIn;
exports.adjustAttendance = adjustAttendance;
exports.getWarningAttendances = getWarningAttendances;
exports.listAllSessions = listAllSessions;
exports.listSessions = listSessions;
exports.getSession = getSession;
exports.updateSession = updateSession;
exports.deleteSession = deleteSession;
const attendanceService = __importStar(require("./attendance.service"));
const qrcode_1 = __importDefault(require("qrcode"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("../../../prisma/client");
const attendance_service_1 = require("./attendance.service");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const response_1 = require("../../../utils/response");
// Tạo session + QR code
async function createSession(req, res) {
    try {
        const { sectionId, name, expiresAt, latitude, longitude, radius, requireDeviceCheck, maxCheckInsPerIP, } = req.body;
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
        const session = await client_1.prisma.attendanceSession.create({
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
        const uploadsDir = path_1.default.join(__dirname, "../../../uploads");
        if (!fs_1.default.existsSync(uploadsDir))
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        const qrPath = path_1.default.join(uploadsDir, `${session.id}.png`);
        await qrcode_1.default.toFile(qrPath, checkInUrl);
        const updatedSession = await client_1.prisma.attendanceSession.update({
            where: { id: session.id },
            data: { qrCodeUrl: `/uploads/${session.id}.png` },
        });
        res.json({ success: true, data: updatedSession, link: checkInUrl });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// 🔥 Sinh viên check-in với chống gian lận
async function checkIn(req, res) {
    try {
        const { sessionId, studentCode, latitude, longitude } = req.body;
        if (!sessionId || !studentCode) {
            return res.status(400).json({
                success: false,
                message: "sessionId và studentCode là bắt buộc",
            });
        }
        // 1️⃣ Lấy thông tin thiết bị và IP
        const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] ||
            req.socket.remoteAddress ||
            "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";
        const deviceInfo = extractDeviceInfo(userAgent);
        [];
        // 2️⃣ Tìm session
        const session = await client_1.prisma.attendanceSession.findUnique({
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
        const student = await client_1.prisma.student.findUnique({
            where: { studentCode },
            include: { user: true },
        });
        if (!student) {
            return res
                .status(404)
                .json({ success: false, message: "Sinh viên không tồn tại" });
        }
        // 5️⃣ Kiểm tra sinh viên có trong lớp không
        const enrolled = await client_1.prisma.sectionEnrollment.findFirst({
            where: { sectionId: session.sectionId, studentId: student.id },
        });
        if (!enrolled) {
            return res.status(400).json({
                success: false,
                message: "Sinh viên không thuộc học phần này",
            });
        }
        // 6️⃣ Kiểm tra đã điểm danh chưa
        const existing = await client_1.prisma.attendance.findFirst({
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
        const ipCheckCount = await client_1.prisma.attendance.count({
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
        let status = "present";
        let distance = null;
        let isValid = true;
        if (latitude === null ||
            latitude === undefined ||
            longitude === null ||
            longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Vị trí GPS là bắt buộc để điểm danh",
            });
        }
        if (session.latitude && session.longitude && session.radius) {
            distance = getDistanceFromLatLonInM(session.latitude, session.longitude, latitude, longitude);
            if (distance > session.radius) {
                status = "warning";
                isValid = false; // Đánh dấu không hợp lệ nếu ngoài phạm vi
            }
        }
        // 9️⃣ 🔥 CHỐNG GIAN LẬN: Kiểm tra thiết bị (nếu bật)
        if (session.requireDeviceCheck && session.allowedDevices) {
            const allowedList = session.allowedDevices;
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
        const scoreRules = await client_1.prisma.attendanceScoreRule.findMany({
            where: { sectionId: session.sectionId },
        });
        // 2. Tìm quy tắc phù hợp với status
        const rule = scoreRules.find((r) => r.status === status);
        if (rule) {
            score = rule.score;
        }
        else {
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
        const minutesLate = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60));
        if (minutesLate > 15 && minutesLate <= 30) {
            // Muộn 15-30 phút
            status = "late";
            score = Math.max(score - 2, 0);
        }
        else if (minutesLate > 30) {
            // Muộn > 30 phút
            status = "late";
            score = Math.max(score - 4, 0);
        }
        // Làm tròn điểm 1 chữ số thập phân
        score = Math.round(score * 10) / 10;
        // 1️⃣1️⃣ Tạo record điểm danh
        const attendance = await client_1.prisma.attendance.create({
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
            console.warn(`⚠️ Nghi vấn gian lận: Student ${studentCode}, Distance: ${distance}m, IP: ${ipAddress}, Score: ${score}`);
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
                ? `Bạn ở ngoài phạm vi lớp học (${distance?.toFixed(0)}m). Điểm: ${score}/10`
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
    }
    catch (err) {
        console.error("❌ Error in checkIn:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// 🔥 GV chỉnh điểm danh
async function adjustAttendance(req, res) {
    try {
        const { attendanceId } = req.params;
        const { status, score, note, adjustedBy } = req.body;
        // Kiểm tra quyền (adjustedBy phải là giảng viên)
        // TODO: Implement role check
        const attendance = await client_1.prisma.attendance.findUnique({
            where: { id: Number(attendanceId) },
        });
        if (!attendance) {
            return res
                .status(404)
                .json({ success: false, message: "Attendance not found" });
        }
        const updated = await client_1.prisma.attendance.update({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// 🔥 Lấy danh sách điểm danh có cảnh báo
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
        res.json({ success: true, data: warnings });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}
// Utility: Extract device info từ User-Agent
function extractDeviceInfo(userAgent) {
    // Simple extraction, có thể dùng thư viện như `ua-parser-js`
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
// Utility: tính khoảng cách Haversine
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
// Lấy tất cả session điểm danh
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
        res.json({ success: true, data: sessions });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Controller
async function listSessions(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const sessions = await attendanceService.getAttendanceSessions(sectionId);
        // Map lại để tính status "warning" nếu ngoài bán kính
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
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
async function getSession(req, res) {
    try {
        const id = parseInt(req.params.id);
        const session = await attendanceService.getAttendanceSessionById(id);
        res.json({ success: true, data: session });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
// Sửa QR Session
async function updateSession(req, res) {
    try {
        const { id } = req.params;
        const { name, expiresAt } = req.body;
        // check tồn tại
        const session = await client_1.prisma.attendanceSession.findUnique({
            where: { id: Number(id) },
        });
        if (!session) {
            return res
                .status(404)
                .json({ success: false, message: "Session not found" });
        }
        const updated = await client_1.prisma.attendanceSession.update({
            where: { id: Number(id) },
            data: {
                name,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
async function deleteSession(req, res) {
    try {
        const id = parseInt(req.params.id);
        await attendanceService.deleteAttendanceSession(id);
        res.json({ success: true, message: "Deleted successfully" });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
// Danh sách điểm danh của 1 sinh viên trong 1 lớp học phần
exports.listBySection = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const studentId = Number(req.params.studentId);
    if (isNaN(sectionId) || isNaN(studentId)) {
        return next(new ApiError_1.default(400, "Invalid params"));
    }
    const items = await (0, attendance_service_1.listStudentAttendance)(sectionId, studentId);
    return (0, response_1.sendResponse)(res, {
        success: true,
        data: items,
    });
});
