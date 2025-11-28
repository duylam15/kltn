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
exports.removeTeachersFromSubject = exports.getSubjectTeachers = exports.bulkAssignTeachers = exports.bulkAssign = exports.getTeacherSubjects = exports.remove = exports.update = exports.detail = exports.list = exports.assign = void 0;
const subjectInstructorService = __importStar(require("./subjectInstructor.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
exports.assign = (0, catchAsync_1.default)(async (req, res) => {
    const assignment = await subjectInstructorService.assignSubjectToTeacher({
        ...req.body,
        assignedBy: req.user?.id, // Từ auth middleware
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Subject assigned to teacher successfully",
        data: assignment,
    }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { subject_id, teacher_id, role, is_active, subject_code, department, } = req.query;
    const result = await subjectInstructorService.listSubjectInstructors({
        page,
        limit,
        subjectId: subject_id ? Number(subject_id) : undefined,
        teacherId: teacher_id ? Number(teacher_id) : undefined,
        role,
        isActive: is_active === "true"
            ? true
            : is_active === "false"
                ? false
                : undefined,
        subjectCode: subject_code,
        department,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const subjectId = Number(req.params.subjectId);
    const teacherId = Number(req.params.teacherId);
    const assignment = await subjectInstructorService.getSubjectInstructor(subjectId, teacherId);
    if (!assignment) {
        return next(new ApiError_1.default(404, "Subject assignment not found"));
    }
    (0, response_1.sendResponse)(res, {
        success: true,
        data: assignment,
    });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const subjectId = Number(req.params.subjectId);
    const teacherId = Number(req.params.teacherId);
    const exist = await subjectInstructorService.getSubjectInstructor(subjectId, teacherId);
    if (!exist) {
        return next(new ApiError_1.default(404, "Subject assignment not found"));
    }
    const updated = await subjectInstructorService.updateSubjectInstructor(subjectId, teacherId, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Subject assignment updated successfully",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const subjectId = Number(req.params.subjectId);
    const teacherId = Number(req.params.teacherId);
    const exist = await subjectInstructorService.getSubjectInstructor(subjectId, teacherId);
    if (!exist) {
        return next(new ApiError_1.default(404, "Subject assignment not found"));
    }
    await subjectInstructorService.deleteSubjectInstructor(subjectId, teacherId);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Subject assignment removed successfully",
    });
});
exports.getTeacherSubjects = (0, catchAsync_1.default)(async (req, res) => {
    const teacherId = Number(req.params.teacherId);
    const subjects = await subjectInstructorService.getTeacherSubjects(teacherId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: subjects,
    });
});
exports.bulkAssign = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subjectInstructorService.bulkAssignSubjects({
        ...req.body,
        assignedBy: req.user?.id,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: `Successfully assigned ${result.created} subjects (${result.skipped} already assigned)`,
        data: result,
    }, 201);
});
exports.bulkAssignTeachers = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subjectInstructorService.bulkAssignTeachers({
        ...req.body,
        assignedBy: req.user?.id,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        message: `Successfully assigned ${result.created} teacher(s) to subject (${result.skipped} already assigned)`,
        data: result,
    }, 201);
});
exports.getSubjectTeachers = (0, catchAsync_1.default)(async (req, res, next) => {
    const subjectId = Number(req.params.subjectId);
    const result = await subjectInstructorService.getSubjectTeachers(subjectId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result,
    });
});
exports.removeTeachersFromSubject = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subjectInstructorService.removeTeachersFromSubject(req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: `Successfully removed ${result.removed} teacher(s) from subject`,
        data: result,
    });
});
