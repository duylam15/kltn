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
exports.addColumnsToColumn = addColumnsToColumn;
exports.removeColumnFromColumn = removeColumnFromColumn;
exports.getColumnsInColumn = getColumnsInColumn;
exports.createGradeColumn = createGradeColumn;
exports.calculateGrades = calculateGrades;
exports.getGradeColumnsBySection = getGradeColumnsBySection;
exports.getGradeColumn = getGradeColumn;
exports.updateGradeColumn = updateGradeColumn;
exports.deleteGradeColumn = deleteGradeColumn;
exports.togglePublishGradeColumn = togglePublishGradeColumn;
exports.addAttendanceSessionsToColumn = addAttendanceSessionsToColumn;
exports.removeAttendanceSessionFromColumn = removeAttendanceSessionFromColumn;
exports.getAttendanceSessionsInColumn = getAttendanceSessionsInColumn;
exports.addAssignmentsToColumn = addAssignmentsToColumn;
exports.removeAssignmentFromColumn = removeAssignmentFromColumn;
exports.getAssignmentsInColumn = getAssignmentsInColumn;
exports.calculateStudentGrades = calculateStudentGrades;
exports.getStudentGradesByColumn = getStudentGradesByColumn;
exports.getStudentGrade = getStudentGrade;
exports.overrideStudentGrade = overrideStudentGrade;
exports.removeGradeOverride = removeGradeOverride;
exports.getSectionGradeBook = getSectionGradeBook;
exports.getStudentGradesInSection = getStudentGradesInSection;
exports.exportGrades = exportGrades;
const gradeService = __importStar(require("./grade.service"));
const client_1 = require("../../../prisma/client");
// ========== GRADE COLUMN ==========
// Thêm các cột vào cột tổng hợp
async function addColumnsToColumn(req, res) {
    try {
        const parentColumnId = parseInt(req.params.columnId);
        const { childColumnIds, weight } = req.body;
        if (!Array.isArray(childColumnIds) || childColumnIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "childColumnIds must be a non-empty array",
            });
        }
        const result = await gradeService.addColumnsToColumn(parentColumnId, childColumnIds, weight);
        res.json({ success: true, data: result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Xóa cột khỏi cột tổng hợp
async function removeColumnFromColumn(req, res) {
    try {
        const parentColumnId = parseInt(req.params.columnId);
        const childColumnId = parseInt(req.params.childColumnId);
        await gradeService.removeColumnFromColumn(parentColumnId, childColumnId);
        res.json({
            success: true,
            message: "Column removed from parent column",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy danh sách cột trong cột tổng hợp
async function getColumnsInColumn(req, res) {
    try {
        const parentColumnId = parseInt(req.params.columnId);
        const columns = await gradeService.getColumnsInColumn(parentColumnId);
        res.json({ success: true, data: columns });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Tạo cột điểm
// Thêm vào grade.controller.ts
async function createGradeColumn(req, res) {
    try {
        const { sectionId, type, ...rest } = req.body;
        // Tự động gán displayOrder dựa trên type
        const displayOrderMap = {
            attendance: 10,
            assignment: 20,
            midterm: 30,
            final: 40,
            project: 50,
            participation: 60,
            custom: 70,
        };
        const existingColumns = await client_1.prisma.gradeColumn.findMany({
            where: { sectionId: Number(sectionId), type },
            orderBy: { displayOrder: "desc" },
            take: 1,
        });
        let displayOrder = displayOrderMap[type] || 70;
        if (existingColumns.length > 0) {
            displayOrder = existingColumns[0].displayOrder + 1;
        }
        const gradeColumn = await gradeService.createGradeColumn({
            sectionId: Number(sectionId),
            type,
            displayOrder,
            ...rest,
        });
        console.log(`[createGradeColumn] Created column:`, gradeColumn);
        res.json({ success: true, data: gradeColumn });
    }
    catch (err) {
        console.error("[createGradeColumn] Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
async function calculateGrades(req, res) {
    try {
        const columnId = parseInt(req.params.columnId);
        const { studentIds } = req.body;
        console.log(`[calculateGrades] Calculating for column ${columnId}, students:`, studentIds);
        const grades = await gradeService.calculateAndSaveStudentGrades(columnId, studentIds);
        console.log(`[calculateGrades] Calculated ${grades.length} grades`);
        res.json({
            success: true,
            data: grades,
            message: `Calculated grades for ${grades.length} students`,
        });
    }
    catch (err) {
        console.error("[calculateGrades] Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy danh sách cột điểm theo section
async function getGradeColumnsBySection(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const gradeColumns = await gradeService.getGradeColumnsBySection(sectionId);
        res.json({ success: true, data: gradeColumns });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy chi tiết cột điểm
async function getGradeColumn(req, res) {
    try {
        const id = parseInt(req.params.id);
        const gradeColumn = await gradeService.getGradeColumnById(id);
        if (!gradeColumn) {
            return res.status(404).json({
                success: false,
                message: "Grade column not found",
            });
        }
        res.json({ success: true, data: gradeColumn });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Cập nhật cột điểm
async function updateGradeColumn(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { name, description, maxScore, weight, calculationMethod, bestNCount, dropLowest, isPublished, displayOrder, } = req.body;
        const gradeColumn = await gradeService.updateGradeColumn(id, {
            name,
            description,
            maxScore,
            weight,
            calculationMethod,
            bestNCount,
            dropLowest,
            isPublished,
            displayOrder,
        });
        res.json({ success: true, data: gradeColumn });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Xóa cột điểm
async function deleteGradeColumn(req, res) {
    try {
        const id = parseInt(req.params.id);
        await gradeService.deleteGradeColumn(id);
        res.json({
            success: true,
            message: "Grade column deleted successfully",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Publish/Unpublish cột điểm
async function togglePublishGradeColumn(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { isPublished } = req.body;
        const gradeColumn = await gradeService.updateGradeColumn(id, {
            isPublished,
        });
        res.json({ success: true, data: gradeColumn });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// ========== GRADE COLUMN - ATTENDANCE SESSION ==========
// Thêm attendance sessions vào cột điểm
async function addAttendanceSessionsToColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const { sessionIds, weight } = req.body; // sessionIds: number[], weight?: number
        if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "sessionIds must be a non-empty array",
            });
        }
        const result = await gradeService.addAttendanceSessionsToColumn(gradeColumnId, sessionIds, weight);
        res.json({ success: true, data: result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Xóa attendance session khỏi cột điểm
async function removeAttendanceSessionFromColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const sessionId = parseInt(req.params.sessionId);
        await gradeService.removeAttendanceSessionFromColumn(gradeColumnId, sessionId);
        res.json({
            success: true,
            message: "Attendance session removed from grade column",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy danh sách attendance sessions trong cột điểm
async function getAttendanceSessionsInColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const sessions = await gradeService.getAttendanceSessionsInColumn(gradeColumnId);
        res.json({ success: true, data: sessions });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// ========== GRADE COLUMN - ASSIGNMENT ==========
// Thêm assignments vào cột điểm
async function addAssignmentsToColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const { assignmentIds, weight } = req.body; // assignmentIds: number[], weight?: number
        if (!Array.isArray(assignmentIds) || assignmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "assignmentIds must be a non-empty array",
            });
        }
        const result = await gradeService.addAssignmentsToColumn(gradeColumnId, assignmentIds, weight);
        res.json({ success: true, data: result });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Xóa assignment khỏi cột điểm
async function removeAssignmentFromColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const assignmentId = parseInt(req.params.assignmentId);
        await gradeService.removeAssignmentFromColumn(gradeColumnId, assignmentId);
        res.json({
            success: true,
            message: "Assignment removed from grade column",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy danh sách assignments trong cột điểm
async function getAssignmentsInColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const assignments = await gradeService.getAssignmentsInColumn(gradeColumnId);
        res.json({ success: true, data: assignments });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// ========== STUDENT GRADE ==========
// Tính toán điểm cho sinh viên
async function calculateStudentGrades(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentIds = req.body; // optional, nếu không có thì tính cho tất cả
        console.log(studentIds);
        const results = await gradeService.calculateAndSaveStudentGrades(gradeColumnId, studentIds);
        res.json({ success: true, data: results });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy điểm của sinh viên theo cột điểm
async function getStudentGradesByColumn(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const grades = await gradeService.getStudentGradesByColumn(gradeColumnId);
        res.json({ success: true, data: grades });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy điểm của 1 sinh viên cụ thể
async function getStudentGrade(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);
        const grade = await gradeService.getStudentGrade(gradeColumnId, studentId);
        if (!grade) {
            return res.status(404).json({
                success: false,
                message: "Student grade not found",
            });
        }
        res.json({ success: true, data: grade });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Ghi đè điểm thủ công
async function overrideStudentGrade(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);
        const { overriddenScore, note, overriddenBy } = req.body;
        if (overriddenScore === undefined || overriddenScore === null) {
            return res.status(400).json({
                success: false,
                message: "overriddenScore is required",
            });
        }
        const grade = await gradeService.overrideStudentGrade(gradeColumnId, studentId, overriddenScore, overriddenBy, note);
        res.json({ success: true, data: grade });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Xóa ghi đè điểm (trở về điểm tự động)
async function removeGradeOverride(req, res) {
    try {
        const gradeColumnId = parseInt(req.params.columnId);
        const studentId = parseInt(req.params.studentId);
        const grade = await gradeService.removeGradeOverride(gradeColumnId, studentId);
        res.json({ success: true, data: grade });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy toàn bộ bảng điểm của section
async function getSectionGradeBook(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const includeUnpublished = req.query.includeUnpublished === "true";
        const gradeBook = await gradeService.getSectionGradeBook(sectionId, includeUnpublished);
        res.json({ success: true, data: gradeBook });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Lấy điểm của sinh viên trong section
async function getStudentGradesInSection(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const studentId = parseInt(req.params.studentId);
        const grades = await gradeService.getStudentGradesInSection(sectionId, studentId);
        res.json({ success: true, data: grades });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
// Export điểm ra CSV/Excel
async function exportGrades(req, res) {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const format = req.query.format || "csv"; // csv or excel
        const csv = await gradeService.exportGradesToCSV(sectionId);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=grades-section-${sectionId}.csv`);
        res.send(csv);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}
