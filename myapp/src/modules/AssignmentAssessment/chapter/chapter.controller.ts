import { Request, Response, NextFunction } from "express";
import * as chapterService from "./chapter.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const chapter = await chapterService.createChapter(req.body);
    sendResponse(
        res,
        { success: true, message: "Chapter created", data: chapter },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const subjectId = req.query.subjectId
        ? Number(req.query.subjectId)
        : undefined;
    const { q } = req.query as any;

    const result = await chapterService.listChapters({
        page,
        limit,
        subjectId,
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
        if (!chapter) return next(new ApiError(404, "Chapter not found"));
        sendResponse(res, { success: true, data: chapter });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await chapterService.getChapter(id);
        if (!exist) return next(new ApiError(404, "Chapter not found"));

        const updated = await chapterService.updateChapter(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Chapter updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await chapterService.getChapter(id);
        if (!exist) return next(new ApiError(404, "Chapter not found"));
        await chapterService.deleteChapter(id);
        sendResponse(res, { success: true, message: "Chapter deleted" });
    }
);

// 🆕 Lấy thống kê số câu hỏi theo độ khó
export const getQuestionStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const stats = await chapterService.getQuestionStatsByDifficulty(id);
        sendResponse(res, { success: true, data: stats });
    }
);

// 🆕 Lấy câu hỏi theo độ khó
export const getQuestionsByDifficulty = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const difficulty = req.query.difficulty as
            | "easy"
            | "medium"
            | "hard"
            | undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;

        const questions = await chapterService.getQuestionsByDifficulty(
            id,
            difficulty,
            limit
        );
        sendResponse(res, { success: true, data: questions });
    }
);
