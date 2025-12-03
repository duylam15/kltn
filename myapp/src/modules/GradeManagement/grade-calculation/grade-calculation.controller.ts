import { Request, Response, NextFunction } from "express";
import * as gradeCalculationService from "./grade-calculation.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";

export const calculateGrade = catchAsync(
    async (req: Request, res: Response) => {
        const result = await gradeCalculationService.calculateGradeColumn(
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Grade calculation completed",
            data: result,
        });
    }
);

export const calculateAll = catchAsync(async (req: Request, res: Response) => {
    const result = await gradeCalculationService.calculateAllGrades(req.body);
    sendResponse(res, {
        success: true,
        message: "All grades calculated",
        data: result,
    });
});

export const preview = catchAsync(async (req: Request, res: Response) => {
    const result = await gradeCalculationService.previewGradeCalculation(
        req.body
    );
    sendResponse(res, {
        success: true,
        data: result,
    });
});
