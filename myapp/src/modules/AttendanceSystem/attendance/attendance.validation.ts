import { z } from "zod";

// Schema tạo session
export const createSessionSchema = z.object({
    sectionId: z.number().positive("sectionId phải là số dương"),
    name: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    latitude: z.number().min(-90).max(90, "Latitude không hợp lệ"),
    longitude: z.number().min(-180).max(180, "Longitude không hợp lệ"),
    radius: z.number().positive().default(50),
    requireDeviceCheck: z.boolean().default(true),
    maxCheckInsPerIP: z.number().positive().default(3),
});

// Schema check-in (đã cải thiện)
export const checkInSchema = z.object({
    sessionId: z.number().positive("sessionId phải là số dương"),
    studentCode: z.string().min(1, "Mã sinh viên là bắt buộc"),
    latitude: z.number().min(-90).max(90, "Latitude không hợp lệ"),
    longitude: z.number().min(-180).max(180, "Longitude không hợp lệ"),
    // ipAddress và deviceInfo sẽ được server tự động lấy từ request
});

// Schema GV chỉnh điểm danh
export const adjustAttendanceSchema = z.object({
    status: z.enum(["present", "late", "absent", "warning"]).optional(),
    score: z.number().min(0).max(10).optional(),
    note: z.string().max(500).optional(),
    adjustedBy: z.number().positive("adjustedBy phải là ID giảng viên"),
});

// Schema cập nhật session
export const updateSessionSchema = z.object({
    name: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    radius: z.number().positive().optional(),
    maxCheckInsPerIP: z.number().positive().optional(),
});

// Schema lấy danh sách attendance
export const getAttendanceListSchema = z.object({
    sessionId: z.number().positive(),
    status: z.enum(["present", "late", "absent", "warning"]).optional(),
    isValid: z.boolean().optional(),
});
