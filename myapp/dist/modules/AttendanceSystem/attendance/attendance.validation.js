"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceListSchema = exports.updateSessionSchema = exports.adjustAttendanceSchema = exports.checkInSchema = exports.createSessionSchema = void 0;
const zod_1 = require("zod");
// Schema tạo session
exports.createSessionSchema = zod_1.z.object({
    sectionId: zod_1.z.number().positive("sectionId phải là số dương"),
    name: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    latitude: zod_1.z.number().min(-90).max(90, "Latitude không hợp lệ"),
    longitude: zod_1.z.number().min(-180).max(180, "Longitude không hợp lệ"),
    radius: zod_1.z.number().positive().default(50),
    requireDeviceCheck: zod_1.z.boolean().default(true),
    maxCheckInsPerIP: zod_1.z.number().positive().default(3),
});
// Schema check-in (đã cải thiện)
exports.checkInSchema = zod_1.z.object({
    sessionId: zod_1.z.number().positive("sessionId phải là số dương"),
    studentCode: zod_1.z.string().min(1, "Mã sinh viên là bắt buộc"),
    latitude: zod_1.z.number().min(-90).max(90, "Latitude không hợp lệ"),
    longitude: zod_1.z.number().min(-180).max(180, "Longitude không hợp lệ"),
    // ipAddress và deviceInfo sẽ được server tự động lấy từ request
});
// Schema GV chỉnh điểm danh
exports.adjustAttendanceSchema = zod_1.z.object({
    status: zod_1.z.enum(["present", "late", "absent", "warning"]).optional(),
    score: zod_1.z.number().min(0).max(10).optional(),
    note: zod_1.z.string().max(500).optional(),
    adjustedBy: zod_1.z.number().positive("adjustedBy phải là ID giảng viên"),
});
// Schema cập nhật session
exports.updateSessionSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().datetime().optional(),
    radius: zod_1.z.number().positive().optional(),
    maxCheckInsPerIP: zod_1.z.number().positive().optional(),
});
// Schema lấy danh sách attendance
exports.getAttendanceListSchema = zod_1.z.object({
    sessionId: zod_1.z.number().positive(),
    status: zod_1.z.enum(["present", "late", "absent", "warning"]).optional(),
    isValid: zod_1.z.boolean().optional(),
});
