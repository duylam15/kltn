import { Request, Response, NextFunction } from "express";
import * as service from "./questions.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";

// question.controller.ts
export const create = catchAsync(async (req: Request, res: Response) => {
    const { body } = (req as any).validated;
    const question = await service.createQuestion(body);

    sendResponse(
        res,
        {
            success: true,
            message: "Question created successfully",
            data: question,
        },
        201
    );
});

// 🆕 CẬP NHẬT: Thêm log debug
export const getAllQuestions = catchAsync(
    async (req: Request, res: Response) => {
        const { query } = (req as any).validated;

        // Debug log
        console.log("📊 Filter params received:", {
            page: query.page,
            limit: query.limit,
            subjectId: query.subjectId,
            chapterId: query.chapterId,
            difficulty: query.difficulty,
            type: query.type,
            search: query.search || query.q,
        });

        const result = await service.getAllQuestions(query);

        sendResponse(res, {
            success: true,
            data: result.items,
            meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        });
    }
);

export const update = catchAsync(async (req: Request, res: Response) => {
    const { body, params } = (req as any).validated;
    const question = await service.updateQuestion(Number(params.id), body);

    sendResponse(res, {
        success: true,
        message: "Question updated successfully",
        data: question,
    });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
    const { params } = (req as any).validated;
    await service.deleteQuestion(Number(params.id));

    sendResponse(res, {
        success: true,
        message: "Question deleted successfully",
    });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
    const { params } = (req as any).validated;
    const data = await service.getQuestionById(Number(params.id));

    sendResponse(res, {
        success: true,
        data,
    });
});

export const getChapters = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const chapters = await service.getChaptersBySubject(id);
        sendResponse(res, { success: true, data: chapters });
    }
);

