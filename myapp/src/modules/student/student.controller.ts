import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as studentService from "./student.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const s = await studentService.createStudent(req.body);
    sendResponse(
        res,
        { success: true, message: "Student created", data: s },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { status, major, q } = req.query as any;

    const result = await studentService.listStudents({
        page,
        limit,
        status,
        major,
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
        const s = await studentService.getStudent(id);
        if (!s) return next(new ApiError(404, "Student not found"));
        sendResponse(res, { success: true, data: s });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await studentService.getStudent(id);
        if (!exist) return next(new ApiError(404, "Student not found"));

        const updated = await studentService.updateStudent(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Student updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await studentService.getStudent(id);
        if (!exist) return next(new ApiError(404, "Student not found"));
        await studentService.deleteStudent(id);
        sendResponse(res, { success: true, message: "Student deleted" });
    }
);
