import { Request, Response } from "express";
import * as service from "./assignmentGenerator.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";

export const generate = catchAsync(async (req: Request, res: Response) => {
    const { body } = (req as any).validated;

    const result = await service.generateAssignmentQuestions(body);

    sendResponse(
        res,
        {
            success: true,
            message: "Questions generated successfully",
            data: result,
        },
        201
    );
});

export const preview = catchAsync(async (req: Request, res: Response) => {
    const { body } = (req as any).validated;

    const result = await service.previewGeneratedQuestions(body);

    sendResponse(res, {
        success: true,
        data: result,
    });
});
