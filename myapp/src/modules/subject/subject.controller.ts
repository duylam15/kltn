import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as subjectService from "./subject.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const subject = await subjectService.createSubject(req.body);
    sendResponse(
        res,
        { success: true, message: "Subject created", data: subject },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { q } = req.query as any;

    const result = await subjectService.listSubjects({
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
        const subject = await subjectService.getSubject(id);
        if (!subject) return next(new ApiError(404, "Subject not found"));
        sendResponse(res, { success: true, data: subject });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await subjectService.getSubject(id);
        if (!exist) return next(new ApiError(404, "Subject not found"));

        const updated = await subjectService.updateSubject(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Subject updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await subjectService.getSubject(id);
        if (!exist) return next(new ApiError(404, "Subject not found"));
        await subjectService.deleteSubject(id);
        sendResponse(res, { success: true, message: "Subject deleted" });
    }
);
