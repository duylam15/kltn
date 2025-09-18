import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as courseSectionService from "./courseSection.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const courseSection = await courseSectionService.createCourseSection(
        req.body
    );
    sendResponse(
        res,
        {
            success: true,
            message: "Course section created",
            data: courseSection,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { status, subject_id, term_id, q } = req.query as any;

    const result = await courseSectionService.listCourseSections({
        page,
        limit,
        status,
        subjectId: subject_id ? Number(subject_id) : undefined,
        termId: term_id ? Number(term_id) : undefined,
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
        const courseSection = await courseSectionService.getCourseSection(id);
        if (!courseSection)
            return next(new ApiError(404, "Course section not found"));
        sendResponse(res, { success: true, data: courseSection });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await courseSectionService.getCourseSection(id);
        if (!exist) return next(new ApiError(404, "Course section not found"));

        const updated = await courseSectionService.updateCourseSection(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Course section updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await courseSectionService.getCourseSection(id);
        if (!exist) return next(new ApiError(404, "Course section not found"));
        await courseSectionService.deleteCourseSection(id);
        sendResponse(res, { success: true, message: "Course section deleted" });
    }
);
