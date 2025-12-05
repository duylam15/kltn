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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController = __importStar(require("./attendance.controller"));
const router = (0, express_1.Router)();
// Tạo QR session
router.post("/sessions", attendanceController.createSession);
// Điểm danh
router.post("/check-in", attendanceController.checkIn);
// Lấy cấu hình TOTP của session (chỉ GV dùng)
router.get("/sessions/:id/totp", attendanceController.getSessionTotpConfig);
// Lấy mã TOTP hiện tại của session cho QR code
router.get("/sessions/:id/totp-current", attendanceController.getSessionCurrentTotp);
// Danh sách session của section
router.get("/sections/:sectionId/sessions", attendanceController.listSessions);
router.get("/sessions", attendanceController.listAllSessions);
router.put("/sessions/:id", attendanceController.updateSession);
// Xem chi tiết session
router.get("/sessions/:id", attendanceController.getSession);
// Xóa session
router.delete("/sessions/:id", attendanceController.deleteSession);
// 🔥 GV chỉnh điểm danh
router.put("/attendances/:attendanceId/adjust", attendanceController.adjustAttendance);
// 🔥 Lấy danh sách cảnh báo gian lận
router.get("/sessions/:sessionId/warnings", attendanceController.getWarningAttendances);
// ký payload (HMAC)
router.post("/sign", attendanceController.signPayload);
// Cấp nonce cho client để ký payload
router.get("/session/:sessionId/nonce", attendanceController.issueNonce);
// 🔥 GV điểm danh thủ công
router.post("/manual-check-in", attendanceController.manualCheckIn);
// 🔥 Hủy điểm danh
router.post("/cancel", attendanceController.cancelAttendance);
exports.default = router;
