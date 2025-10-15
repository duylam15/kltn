import { Request, Response, NextFunction } from "express";
import * as sectionInstructorService from "./sectionInstructor.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const sectionInstructor =
        await sectionInstructorService.createSectionInstructor(req.body);
    sendResponse(
        res,
        {
            success: true,
            message: "Section instructor assigned",
            data: sectionInstructor,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, teacher_id, role } = req.query as any;

    const result = await sectionInstructorService.listSectionInstructors({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        teacherId: teacher_id ? Number(teacher_id) : undefined,
        role,
    });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const teacherId = Number(req.params.teacherId);
        const sectionInstructor =
            await sectionInstructorService.getSectionInstructor(
                sectionId,
                teacherId
            );
        if (!sectionInstructor)
            return next(new ApiError(404, "Section instructor not found"));
        sendResponse(res, { success: true, data: sectionInstructor });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const teacherId = Number(req.params.teacherId);
        const exist = await sectionInstructorService.getSectionInstructor(
            sectionId,
            teacherId
        );
        if (!exist)
            return next(new ApiError(404, "Section instructor not found"));

        const updated = await sectionInstructorService.updateSectionInstructor(
            sectionId,
            teacherId,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Section instructor updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        const teacherId = Number(req.params.teacherId);
        const exist = await sectionInstructorService.getSectionInstructor(
            sectionId,
            teacherId
        );
        if (!exist)
            return next(new ApiError(404, "Section instructor not found"));
        await sectionInstructorService.deleteSectionInstructor(
            sectionId,
            teacherId
        );
        sendResponse(res, {
            success: true,
            message: "Section instructor removed",
        });
    }
);
