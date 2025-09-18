import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as teacherService from "./teacher.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const t = await teacherService.createTeacher(req.body);
    sendResponse(
        res,
        { success: true, message: "Teacher created", data: t },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { department, position, q } = req.query as any;

    const result = await teacherService.listTeachers({
        page,
        limit,
        department,
        position,
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
        const t = await teacherService.getTeacher(id);
        if (!t) return next(new ApiError(404, "Teacher not found"));
        sendResponse(res, { success: true, data: t });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await teacherService.getTeacher(id);
        if (!exist) return next(new ApiError(404, "Teacher not found"));

        const updated = await teacherService.updateTeacher(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Teacher updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await teacherService.getTeacher(id);
        if (!exist) return next(new ApiError(404, "Teacher not found"));
        await teacherService.deleteTeacher(id);
        sendResponse(res, { success: true, message: "Teacher deleted" });
    }
);
