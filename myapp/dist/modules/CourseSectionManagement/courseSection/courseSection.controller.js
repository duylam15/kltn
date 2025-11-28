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
exports.joinByCodePublic = exports.remove = exports.update = exports.detail = exports.list = exports.create = void 0;
const courseSectionService = __importStar(require("./courseSection.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const courseSection = await courseSectionService.createCourseSection(req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Course section created",
        data: courseSection,
    }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { status, subject_id, term_id, q } = req.query;
    const result = await courseSectionService.listCourseSections({
        status,
        subjectId: subject_id ? Number(subject_id) : undefined,
        termId: term_id ? Number(term_id) : undefined,
        q,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const courseSection = await courseSectionService.getCourseSection(id);
    if (!courseSection)
        return next(new ApiError_1.default(404, "Course section not found"));
    (0, response_1.sendResponse)(res, { success: true, data: courseSection });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await courseSectionService.getCourseSection(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Course section not found"));
    const updated = await courseSectionService.updateCourseSection(id, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Course section updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await courseSectionService.getCourseSection(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Course section not found"));
    await courseSectionService.deleteCourseSection(id);
    (0, response_1.sendResponse)(res, { success: true, message: "Course section deleted" });
});
// Join by code
exports.joinByCodePublic = (0, catchAsync_1.default)(async (req, res, next) => {
    const code = String(req.body.code || "").trim();
    const userId = Number(req.body.userId);
    if (!code)
        return next(new ApiError_1.default(400, "Class code is required"));
    if (!userId || Number.isNaN(userId))
        return next(new ApiError_1.default(400, "Invalid userId"));
    // 1) tìm lớp theo sectionCode
    const section = await client_1.prisma.courseSection.findFirst({
        where: { sectionCode: code },
        include: { subject: true, term: true },
    });
    if (!section)
        return next(new ApiError_1.default(404, "Invalid class code"));
    // 2) từ userId -> student
    const student = await client_1.prisma.student.findUnique({ where: { userId } });
    if (!student)
        return next(new ApiError_1.default(404, "Student not found for this user"));
    // 3) kiểm tra đã ghi danh chưa
    const exist = await client_1.prisma.sectionEnrollment.findFirst({
        where: { sectionId: section.id, studentId: student.id },
    });
    if (exist) {
        return (0, response_1.sendResponse)(res, {
            success: true,
            message: "You are already enrolled in this class",
            data: {
                sectionId: section.id,
                enrollmentId: exist.id,
                section,
            },
        });
    }
    // 4) tạo enrollment
    const enrollment = await client_1.prisma.sectionEnrollment.create({
        data: {
            sectionId: section.id,
            studentId: student.id,
        },
    });
    return (0, response_1.sendResponse)(res, {
        success: true,
        message: "Joined class successfully",
        data: {
            sectionId: section.id,
            enrollmentId: enrollment.id,
            section,
        },
    });
});
