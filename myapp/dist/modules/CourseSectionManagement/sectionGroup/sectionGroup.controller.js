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
exports.listGroupsBySection = exports.remove = exports.update = exports.detail = exports.list = exports.create = exports.getGroupMembers = exports.leaveGroup = exports.joinGroup = exports.getAvailableGroups = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const response_1 = require("../../../utils/response");
const ApiError_1 = __importDefault(require("../../../utils/ApiError"));
const sectionGroupService = __importStar(require("./sectionGroup.service"));
const server_1 = require("../../../server"); // 👈 socket instance
const client_1 = require("../../../prisma/client");
// Lấy danh sách nhóm có thể join
exports.getAvailableGroups = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const studentId = Number(req.query.studentId); // hoặc lấy từ req.user nếu có auth
    if (!studentId) {
        return next(new ApiError_1.default(400, "studentId required"));
    }
    const result = await sectionGroupService.getAvailableGroups(sectionId, studentId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result,
    });
});
// Join nhóm
exports.joinGroup = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const groupId = Number(req.params.groupId);
    const { studentId } = req.body;
    if (!studentId) {
        console.error("[Controller] ❌ No studentId provided");
        return next(new ApiError_1.default(400, "studentId is required"));
    }
    try {
        const enrollment = await sectionGroupService.joinGroup(sectionId, groupId, studentId);
        const updatedGroup = await client_1.prisma.sectionGroup.findUnique({
            where: { id: groupId },
            include: {
                _count: { select: { enrollments: true } },
            },
        });
        const eventData = {
            groupId,
            sectionId,
            currentMembers: updatedGroup?._count.enrollments || 0,
            maxMembers: updatedGroup?.maxMembers || 0,
            availableSlots: (updatedGroup?.maxMembers || 0) -
                (updatedGroup?._count.enrollments || 0),
            student: {
                id: enrollment.student.id,
                fullName: enrollment.student.user.fullName,
                studentCode: enrollment.student.studentCode,
            },
        };
        server_1.io.to(`section_${sectionId}`).emit("groupJoined", eventData);
        (0, response_1.sendResponse)(res, {
            success: true,
            message: "Joined group successfully",
            data: enrollment,
        });
    }
    catch (error) {
        console.error("========================================");
        console.error("[Controller] ❌ Error:", error.message);
        console.error("========================================");
        return next(new ApiError_1.default(400, error.message));
    }
});
// Leave nhóm (optional)
exports.leaveGroup = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const { studentId } = req.body;
    try {
        const result = await sectionGroupService.leaveGroup(sectionId, studentId);
        const groupId = result.previousGroupId; // 👈 Lấy groupId từ service
        if (groupId) {
            // Lấy thông tin nhóm sau khi leave
            const updatedGroup = await client_1.prisma.sectionGroup.findUnique({
                where: { id: groupId },
                include: {
                    _count: { select: { enrollments: true } },
                },
            });
            const eventData = {
                sectionId,
                studentId,
                groupId,
                currentMembers: updatedGroup?._count.enrollments || 0,
                maxMembers: updatedGroup?.maxMembers || 0,
                availableSlots: (updatedGroup?.maxMembers || 0) -
                    (updatedGroup?._count.enrollments || 0),
            };
            server_1.io.to(`section_${sectionId}`).emit("groupLeft", eventData);
        }
        (0, response_1.sendResponse)(res, {
            success: true,
            message: "Left group successfully",
            data: result,
        });
    }
    catch (error) {
        return next(new ApiError_1.default(400, error.message));
    }
});
// Lấy danh sách thành viên trong nhóm
exports.getGroupMembers = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    const groupId = Number(req.params.groupId);
    const members = await sectionGroupService.getGroupMembers(sectionId, groupId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: members,
    });
});
exports.create = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const sectionGroup = await sectionGroupService.createSectionGroup(req.body);
    (0, response_1.sendResponse)(res, { success: true, message: "Section group created", data: sectionGroup }, 201);
});
exports.list = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, is_active, q } = req.query;
    const result = await sectionGroupService.listSectionGroups({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        isActive: is_active !== undefined ? is_active === "true" : undefined,
        q,
    });
    (0, response_1.sendResponse)(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});
exports.detail = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const id = Number(req.params.id);
    const sectionGroup = await sectionGroupService.getSectionGroup(id);
    if (!sectionGroup)
        return next(new ApiError_1.default(404, "Section group not found"));
    (0, response_1.sendResponse)(res, { success: true, data: sectionGroup });
});
exports.update = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await sectionGroupService.getSectionGroup(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Section group not found"));
    const updated = await sectionGroupService.updateSectionGroup(id, req.body);
    (0, response_1.sendResponse)(res, {
        success: true,
        message: "Section group updated",
        data: updated,
    });
});
exports.remove = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const id = Number(req.params.id);
    const exist = await sectionGroupService.getSectionGroup(id);
    if (!exist)
        return next(new ApiError_1.default(404, "Section group not found"));
    await sectionGroupService.deleteSectionGroup(id);
    (0, response_1.sendResponse)(res, { success: true, message: "Section group deleted" });
});
exports.listGroupsBySection = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const sectionId = Number(req.params.sectionId);
    if (!sectionId)
        return next(new ApiError_1.default(400, "sectionId required"));
    const groups = await sectionGroupService.listGroupsBySection(sectionId);
    (0, response_1.sendResponse)(res, {
        success: true,
        data: groups,
    });
});
