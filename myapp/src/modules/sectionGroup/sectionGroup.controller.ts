import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as sectionGroupService from "./sectionGroup.service";
import { io } from "../../server"; // 👈 socket instance
import { prisma } from "../../prisma/client";


// Lấy danh sách nhóm có thể join
export const getAvailableGroups = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const studentId = Number(req.query.studentId); // hoặc lấy từ req.user nếu có auth

        if (!studentId) {
            return next(new ApiError(400, "studentId required"));
        }

        const result = await sectionGroupService.getAvailableGroups(
            sectionId,
            studentId
        );

        sendResponse(res, {
            success: true,
            data: result,
        });
    }
);

// Join nhóm
export const joinGroup = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const groupId = Number(req.params.groupId);
        const { studentId } = req.body;
        if (!studentId) {
            console.error("[Controller] ❌ No studentId provided");
            return next(new ApiError(400, "studentId is required"));
        }

        try {
            const enrollment = await sectionGroupService.joinGroup(
                sectionId,
                groupId,
                studentId
            );

            const updatedGroup = await prisma.sectionGroup.findUnique({
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
                availableSlots:
                    (updatedGroup?.maxMembers || 0) -
                    (updatedGroup?._count.enrollments || 0),
                student: {
                    id: enrollment.student.id,
                    fullName: enrollment.student.user.fullName,
                    studentCode: enrollment.student.studentCode,
                },
            };
            io.to(`section_${sectionId}`).emit("groupJoined", eventData);
            sendResponse(res, {
                success: true,
                message: "Joined group successfully",
                data: enrollment,
            });
        } catch (error: any) {
            console.error("========================================");
            console.error("[Controller] ❌ Error:", error.message);
            console.error("========================================");
            return next(new ApiError(400, error.message));
        }
    }
);

// Leave nhóm (optional)
export const leaveGroup = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const { studentId } = req.body;
        try {
            const result = await sectionGroupService.leaveGroup(
                sectionId,
                studentId
            );
            const groupId = result.previousGroupId; // 👈 Lấy groupId từ service

            if (groupId) {
                // Lấy thông tin nhóm sau khi leave
                const updatedGroup = await prisma.sectionGroup.findUnique({
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
                    availableSlots:
                        (updatedGroup?.maxMembers || 0) -
                        (updatedGroup?._count.enrollments || 0),
                };
                io.to(`section_${sectionId}`).emit("groupLeft", eventData);
            }

            sendResponse(res, {
                success: true,
                message: "Left group successfully",
                data: result,
            });
        } catch (error: any) {
            return next(new ApiError(400, error.message));
        }
    }
);

// Lấy danh sách thành viên trong nhóm
export const getGroupMembers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const groupId = Number(req.params.groupId);

        const members = await sectionGroupService.getGroupMembers(
            sectionId,
            groupId
        );

        sendResponse(res, {
            success: true,
            data: members,
        });
    }
);

export const create = catchAsync(async (req: Request, res: Response) => {
    const sectionGroup = await sectionGroupService.createSectionGroup(req.body);
    sendResponse(
        res,
        { success: true, message: "Section group created", data: sectionGroup },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, is_active, q } = req.query as any;

    const result = await sectionGroupService.listSectionGroups({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        isActive: is_active !== undefined ? is_active === "true" : undefined,
        q,
    });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const sectionGroup = await sectionGroupService.getSectionGroup(id);
        if (!sectionGroup)
            return next(new ApiError(404, "Section group not found"));
        sendResponse(res, { success: true, data: sectionGroup });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionGroupService.getSectionGroup(id);
        if (!exist) return next(new ApiError(404, "Section group not found"));

        const updated = await sectionGroupService.updateSectionGroup(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Section group updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionGroupService.getSectionGroup(id);
        if (!exist) return next(new ApiError(404, "Section group not found"));
        await sectionGroupService.deleteSectionGroup(id);
        sendResponse(res, { success: true, message: "Section group deleted" });
    }
);

export const listGroupsBySection = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        if (!sectionId) return next(new ApiError(400, "sectionId required"));

        const groups = await sectionGroupService.listGroupsBySection(sectionId);

        sendResponse(res, {
            success: true,
            data: groups,
        });
    }
);