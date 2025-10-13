import { Request, Response, NextFunction } from "express";
import * as questionSubjectService from "./questionSubject.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const subject = await questionSubjectService.createQuestionSubject(
        req.body
    );
    sendResponse(
        res,
        { success: true, message: "Question subject created", data: subject },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { q } = req.query as any;

    const result = await questionSubjectService.listQuestionSubjects({
        page,
        limit,
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
        const subject = await questionSubjectService.getQuestionSubject(id);
        if (!subject)
            return next(new ApiError(404, "Question subject not found"));
        sendResponse(res, { success: true, data: subject });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await questionSubjectService.getQuestionSubject(id);
        if (!exist)
            return next(new ApiError(404, "Question subject not found"));

        const updated = await questionSubjectService.updateQuestionSubject(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Question subject updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await questionSubjectService.getQuestionSubject(id);
        if (!exist)
            return next(new ApiError(404, "Question subject not found"));
        await questionSubjectService.deleteQuestionSubject(id);
        sendResponse(res, {
            success: true,
            message: "Question subject deleted",
        });
    }
);

// 🆕 Lấy danh sách chương theo môn học
export const getChapters = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const chapters = await questionSubjectService.getChaptersBySubject(id);
        sendResponse(res, { success: true, data: chapters });
    }
);
