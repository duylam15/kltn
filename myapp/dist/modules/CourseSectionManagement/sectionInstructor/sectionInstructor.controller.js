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
exports.getTeacherBySection = exports.remove = exports.update = exports.detail = exports.list = exports.create = void 0;
const sectionInstructorService = __importStar(require("./sectionInstructor.service"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const client_1 = require("../../../prisma/client");
exports.create = (0, catchAsync_1.default)(async (req, res) => {
    const sectionInstructor = await sectionInstructorService.createSectionInstructor(req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section instructor assigned",
        data: sectionInstructor,
    }, 201);
});
exports.list = (0, catchAsync_1.default)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, teacher_id, role } = req.query;
    const result = await sectionInstructorService.listSectionInstructors({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        teacherId: teacher_id ? Number(teacher_id) : undefined,
        role,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const teacherId = Number(req.params.teacherId);
    const sectionInstructor = await sectionInstructorService.getSectionInstructor(sectionId, teacherId);
    if (!sectionInstructor)
        return next(new ApiError_1.default(404, "Section instructor not found"));
    (0, response_1.sendResponse)(res, { success: true, data: sectionInstructor });
});
exports.update = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const teacherId = Number(req.params.teacherId);
    const exist = await sectionInstructorService.getSectionInstructor(sectionId, teacherId);
    if (!exist)
        return next(new ApiError_1.default(404, "Section instructor not found"));
    const updated = await sectionInstructorService.updateSectionInstructor(sectionId, teacherId, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section instructor updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const teacherId = Number(req.params.teacherId);
    const exist = await sectionInstructorService.getSectionInstructor(sectionId, teacherId);
    if (!exist)
        return next(new ApiError_1.default(404, "Section instructor not found"));
    await sectionInstructorService.deleteSectionInstructor(sectionId, teacherId);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section instructor removed",
    });
});
exports.getTeacherBySection = (0, catchAsync_1.default)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (isNaN(sectionId))
        return next(new ApiError_1.default(400, "Invalid sectionId"));
    const owner = await client_1.prisma.sectionInstructor.findFirst({
        where: { sectionId, role: "owner" },
        include: {
            teacher: {
                include: {
                    user: {
                        select: { id: true, email: true, fullName: true },
                    },
                },
            },
        },
    });
    if (!owner)
        return next(new ApiError_1.default(404, "Owner teacher not found"));
    (0, response_1.sendResponse)(res, { success: true, data: owner });
});
