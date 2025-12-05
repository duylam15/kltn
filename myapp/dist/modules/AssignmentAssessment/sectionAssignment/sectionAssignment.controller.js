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
exports.toggleVisibility = toggleVisibility;
exports.assignToSection = assignToSection;
exports.unassignFromSection = unassignFromSection;
exports.listBySection = listBySection;
exports.listByAssignment = listByAssignment;
const service = __importStar(require("./sectionAssignment.service"));
const server_1 = require("../../../server");
async function toggleVisibility(req, res) {
    try {
        const { sectionId, assignmentId } = req.params;
        const { isOpen } = req.body;
        const updated = await service.updateAssignmentVisibility(Number(sectionId), Number(assignmentId), Boolean(isOpen));
        return res.json({
            success: true,
            message: `Assignment visibility updated`,
            data: updated,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
async function assignToSection(req, res) {
    const sectionId = Number(req.params.id);
    const { assignmentId } = req.validated.body;
    try {
        const { sectionAssignment, studentsNotified } = await service.assignToSection(sectionId, assignmentId);
        // 🔥 Phát thông báo realtime cho toàn bộ lớp
        server_1.io.to(`section_${sectionId}`).emit("newAssignment", {
            assignment: sectionAssignment.assignment,
            section: {
                id: sectionAssignment.section.id,
                sectionCode: sectionAssignment.section.sectionCode,
                sectionName: sectionAssignment.section.sectionName,
                subject: sectionAssignment.section.subject,
            },
            message: `Bài tập mới: ${sectionAssignment.assignment.title}`,
            timestamp: new Date(),
        });
        // 🔥 Phát notification riêng cho từng sinh viên
        studentsNotified.forEach((student) => {
            server_1.io.to(`user_${student.userId}`).emit("newNotification", {
                type: "assignment",
                title: `Bài tập mới: ${sectionAssignment.assignment.title}`,
                message: `Bạn có bài tập mới trong lớp ${sectionAssignment.section.subject.subjectName}`,
                assignmentId: sectionAssignment.assignment.id,
                sectionId: sectionId,
                createdAt: new Date(),
            });
        });
        res.json({
            success: true,
            data: sectionAssignment,
            studentsNotified: studentsNotified.length,
        });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
async function unassignFromSection(req, res) {
    const sectionId = Number(req.params.id);
    const assignmentId = Number(req.params.assignmentId);
    try {
        await service.unassignFromSection(sectionId, assignmentId);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
async function listBySection(req, res) {
    const sectionId = Number(req.params.id);
    try {
        const data = await service.listBySection(sectionId);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
async function listByAssignment(req, res) {
    const assignmentId = Number(req.params.id);
    try {
        const data = await service.listByAssignment(assignmentId);
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}
