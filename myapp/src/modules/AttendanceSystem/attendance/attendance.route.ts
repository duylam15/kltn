import { Router } from "express";
import * as attendanceController from "./attendance.controller";

const router = Router();

// Tạo QR session
router.post("/sessions", attendanceController.createSession);

// Điểm danh
router.post("/check-in", attendanceController.checkIn);

// Danh sách session của section
router.get("/sections/:sectionId/sessions", attendanceController.listSessions);
router.get("/sessions", attendanceController.listAllSessions);
router.put("/sessions/:id", attendanceController.updateSession);

// Xem chi tiết session
router.get("/sessions/:id", attendanceController.getSession);

// Xóa session
router.delete("/sessions/:id", attendanceController.deleteSession);

// 🔥 GV chỉnh điểm danh
router.put(
    "/attendances/:attendanceId/adjust",
    attendanceController.adjustAttendance
);
// 🔥 Lấy danh sách cảnh báo gian lận
router.get(
    "/sessions/:sessionId/warnings",
    attendanceController.getWarningAttendances
);

// ký payload (HMAC)
router.post("/sign", attendanceController.signPayload);

// Cấp nonce cho client để ký payload
router.get("/session/:sessionId/nonce", attendanceController.issueNonce);

export default router;
