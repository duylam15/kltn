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
const express_1 = require("express");
const controller = __importStar(require("./gradeColumn.controller"));
const validation = __importStar(require("./gradeColumn.validation"));
const validate_1 = __importDefault(require("../../../middlewares/validate"));
const router = (0, express_1.Router)();
// Lấy danh sách cột điểm của section
router.get("/sections/:sectionId", (0, validate_1.default)(validation.listColumnsSchema), controller.listColumnsBySection);
// Tạo cột điểm mới
router.post("/sections/:sectionId", (0, validate_1.default)(validation.createColumnSchema), controller.createColumn);
// Cập nhật cột điểm
router.put("/:id", (0, validate_1.default)(validation.updateColumnSchema), controller.updateColumn);
// Xóa cột điểm
router.delete("/:id", (0, validate_1.default)(validation.deleteColumnSchema), controller.deleteColumn);
// Gán buổi điểm danh
router.post("/:id/attendance-sessions", (0, validate_1.default)(validation.assignAttendanceSessionsSchema), controller.assignAttendanceSessions);
// Gán bài tập
router.post("/:id/assignments", (0, validate_1.default)(validation.assignAssignmentsSchema), controller.assignAssignments);
// Tính toán lại điểm
router.post("/:id/recalculate", (0, validate_1.default)(validation.recalculateSchema), controller.recalculateGrades);
exports.default = router;
