import { Request, Response, NextFunction } from "express";
import * as chapterService from "./chapter.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const chapter = await chapterService.createChapter(req.body);
    sendResponse(
        res,
        {
            success: true,
            message: "Chapter created successfully",
            data: chapter,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { subject_id, q } = req.query as any;

    const result = await chapterService.listChapters({
        page,
        limit,
        subjectId: subject_id ? Number(subject_id) : undefined,
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
        const chapter = await chapterService.getChapter(id);

        if (!chapter) {
            return next(new ApiError(404, "Chapter not found"));
        }

        sendResponse(res, { success: true, data: chapter });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await chapterService.getChapter(id);

        if (!exist) {
            return next(new ApiError(404, "Chapter not found"));
        }

        const updated = await chapterService.updateChapter(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Chapter updated successfully",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await chapterService.getChapter(id);

        if (!exist) {
            return next(new ApiError(404, "Chapter not found"));
        }

        await chapterService.deleteChapter(id);
        sendResponse(res, {
            success: true,
            message: "Chapter deleted successfully",
        });
    }
);

export const getQuestions = catchAsync(async (req: Request, res: Response) => {
    const chapterId = Number(req.params.id);
    const { difficulty, limit } = req.query;

    const questions = await chapterService.getQuestionsByDifficulty(
        chapterId,
        difficulty as any,
        limit ? Number(limit) : undefined
    );

    sendResponse(res, {
        success: true,
        data: questions,
    });
});

export const getStats = catchAsync(async (req: Request, res: Response) => {
    const chapterId = Number(req.params.id);
    const stats = await chapterService.getQuestionStatsByDifficulty(chapterId);

    sendResponse(res, {
        success: true,
        data: stats,
    });
});
