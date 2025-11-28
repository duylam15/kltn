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
exports.listColumnsBySection = listColumnsBySection;
exports.createColumn = createColumn;
exports.updateColumn = updateColumn;
exports.deleteColumn = deleteColumn;
exports.assignAttendanceSessions = assignAttendanceSessions;
exports.assignAssignments = assignAssignments;
exports.recalculateGrades = recalculateGrades;
const service = __importStar(require("./gradeColumn.service"));
// Lấy danh sách cột điểm của section
async function listColumnsBySection(req, res) {
    try {
        const sectionId = Number(req.params.sectionId);
        const columns = await service.listColumnsBySection(sectionId);
        return res.json({
            success: true,
            data: columns,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Tạo cột điểm mới
async function createColumn(req, res) {
    try {
        const sectionId = Number(req.params.sectionId);
        const data = req.validated.body;
        const column = await service.createColumn(sectionId, data);
        return res.status(201).json({
            success: true,
            message: "Grade column created successfully",
            data: column,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Cập nhật cột điểm
async function updateColumn(req, res) {
    try {
        const id = Number(req.params.id);
        const data = req.validated.body;
        const column = await service.updateColumn(id, data);
        return res.json({
            success: true,
            message: "Grade column updated successfully",
            data: column,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Xóa cột điểm
async function deleteColumn(req, res) {
    try {
        const id = Number(req.params.id);
        await service.deleteColumn(id);
        return res.json({
            success: true,
            message: "Grade column deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Gán buổi điểm danh cho cột
async function assignAttendanceSessions(req, res) {
    try {
        const columnId = Number(req.params.id);
        // ✅ unwrap thẳng ra array
        const { sessionIds } = req.validated.body;
        console.log("DEBUG body:", sessionIds); // giờ sẽ log thẳng array
        const result = await service.assignAttendanceSessions(columnId, sessionIds // truyền đúng array
        );
        return res.json({
            success: true,
            message: "Attendance sessions assigned successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("❌ assignAttendanceSessions error:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Gán bài tập cho cột
async function assignAssignments(req, res) {
    try {
        const columnId = Number(req.params.id);
        const assignmentIds = req.validated.body;
        const result = await service.assignAssignments(columnId, assignmentIds);
        return res.json({
            success: true,
            message: "Assignments assigned successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
// Tính toán lại điểm tự động
async function recalculateGrades(req, res) {
    try {
        const columnId = Number(req.params.id);
        const result = await service.recalculateColumnGrades(columnId);
        return res.json({
            success: true,
            message: "Grades recalculated successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
