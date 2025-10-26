import { Request, Response, NextFunction } from "express";
import * as service from "./testCase.service";
import catchAsync from "@/utils/catchAsync";
import { sendResponse } from "@/utils/response";
import ApiError from "@/utils/ApiError";

export const listByQuestion = catchAsync(
    async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        const items = await service.getTestCasesByQuestion(questionId);

        sendResponse(res, {
            success: true,
            data: items,
        });
    }
);

export const getTotalPointsController = catchAsync(
    async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        const totalPoints = await service.getTotalPoints(questionId);

        sendResponse(res, {
            success: true,
            data: { totalPoints },
        });
    }
);


export const listPublicByQuestion = catchAsync(
    async (req: Request, res: Response) => {
        const questionId = Number(req.params.questionId);
        const items = await service.getPublicTestCases(questionId);

        sendResponse(res, {
            success: true,
            data: items,
        });
    }
);


export const create = catchAsync(async (req: Request, res: Response) => {
    const testcase = await service.createTestCase(req.body);
    sendResponse(
        res,
        {
            success: true,
            message: "TestCase created successfully",
            data: testcase,
        },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const questionId = req.query.questionId
        ? Number(req.query.questionId)
        : undefined;

    const result = await service.listTestCases({ page, limit, questionId });

    sendResponse(res, {
        success: true,
        data: result.items,
        meta: { page, limit, total: result.total },
    });
});

export const detail = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const testcase = await service.getTestCase(id);

        if (!testcase) return next(new ApiError(404, "TestCase not found"));

        sendResponse(res, { success: true, data: testcase });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await service.getTestCase(id);
        if (!exist) return next(new ApiError(404, "TestCase not found"));

        const updated = await service.updateTestCase(id, req.body);
        sendResponse(res, {
            success: true,
            message: "TestCase updated successfully",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await service.getTestCase(id);
        if (!exist) return next(new ApiError(404, "TestCase not found"));

        await service.deleteTestCase(id);
        sendResponse(res, {
            success: true,
            message: "TestCase deleted successfully",
        });
    }
);
