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
exports.listCoursesByUserId = exports.getSectionsByStudent = exports.getGroupsWithMembers = exports.removeStudentFromGroup = exports.assignStudentToGroup = exports.getStudentsByGroup = exports.getStudentsBySection = exports.getCoursesByStudent = exports.remove = exports.update = exports.detail = exports.list = exports.create = void 0;
const sectionEnrollmentService = __importStar(require("./sectionEnrollment.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const sectionEnrollment = await sectionEnrollmentService.createSectionEnrollment(req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Student enrolled in section",
        data: sectionEnrollment,
    }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, student_id, status } = req.query;
    const result = await sectionEnrollmentService.listSectionEnrollments({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        studentId: student_id ? Number(student_id) : undefined,
        status,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const sectionEnrollment = await sectionEnrollmentService.getSectionEnrollment(id);
    if (!sectionEnrollment)
        return next(new ApiError_1.default(404, "Section enrollment not found"));
    (0, response_1.sendResponse)(res, { success: true, data: sectionEnrollment });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await sectionEnrollmentService.getSectionEnrollment(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Section enrollment not found"));
    const updated = await sectionEnrollmentService.updateSectionEnrollment(id, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section enrollment updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await sectionEnrollmentService.getSectionEnrollment(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Section enrollment not found"));
    await sectionEnrollmentService.deleteSectionEnrollment(id);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section enrollment deleted",
    });
});
exports.getCoursesByStudent = (0, catchAsync_1.default)(async (req, res, next) => {
    const studentId = Number(req.params.studentId);
    if (!studentId)
        return next(new ApiError_1.default(400, "studentId is required"));
    const courses = await sectionEnrollmentService.getCoursesByStudent(studentId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: courses,
    });
});
exports.getStudentsBySection = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (!sectionId)
        return next(new ApiError_1.default(400, "sectionId required"));
    const data = await sectionEnrollmentService.getStudentsBySection(sectionId);
    (0, response_1.sendResponse)(res, { success: true, data });
});
exports.getStudentsByGroup = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const groupId = Number(req.params.groupId);
    if (!sectionId || !groupId)
        return next(new ApiError_1.default(400, "sectionId & groupId required"));
    const data = await sectionEnrollmentService.getStudentsByGroup(sectionId, groupId);
    (0, response_1.sendResponse)(res, { success: true, data });
});
exports.assignStudentToGroup = (0, catchAsync_1.default)(async (req, res) => {
    const studentId = Number(req.params.studentId);
    const { groupId } = req.body;
    const updated = await sectionEnrollmentService.updateSectionEnrollment(studentId, { groupId });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Assigned to group",
        data: updated,
    });
});
exports.removeStudentFromGroup = (0, catchAsync_1.default)(async (req, res) => {
    const enrollmentId = Number(req.params.enrollmentId);
    const updated = await sectionEnrollmentService.updateSectionEnrollment(enrollmentId, { groupId: null });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Removed from group",
        data: updated,
    });
});
exports.getGroupsWithMembers = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (!sectionId)
        return next(new ApiError_1.default(400, "sectionId required"));
    const data = await sectionEnrollmentService.getGroupsWithMembers(sectionId);
    (0, response_1.sendResponse)(res, { success: true, data });
});
exports.getSectionsByStudent = (0, catchAsync_1.default)(async (req, res, next) => {
    const studentId = Number(req.params.studentId);
    if (!studentId)
        return next(new ApiError_1.default(400, "studentId required"));
    const data = await sectionEnrollmentService.getSectionsByStudent(studentId);
    (0, response_1.sendResponse)(res, { success: true, data });
});
// Lấy tất cả lớp mà sinh viên (đang đăng nhập)
exports.listCoursesByUserId = (0, catchAsync_1.default)(async (req, res, next) => {
    const userId = Number(req.params.userId);
    if (isNaN(userId))
        return next(new ApiError_1.default(400, "Invalid userId"));
    // 🔸 Tìm student theo userId
    const student = await client_1.prisma.student.findUnique({
        where: { userId },
    });
    if (!student)
        return next(new ApiError_1.default(404, "Student not found for this user"));
    // 🔸 Tìm tất cả lớp mà student đã ghi danh
    const enrollments = await client_1.prisma.sectionEnrollment.findMany({
        where: { studentId: student.id },
        orderBy: { enrolledAt: "desc" }, // hoặc createdAt nếu không có enrolledAt
        include: {
            section: {
                include: {
                    subject: true,
                    term: true,
                },
            },
        },
    });
    (0, response_1.sendResponse)(res, { success: true, data: enrollments });
});
