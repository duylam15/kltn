import { Request, Response, NextFunction } from "express";
import * as gradeColumnService from "./grade-column.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";
import ApiError from "../../../utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const column = await gradeColumnService.createGradeColumn(req.body);
    sendResponse(
        res,
        { success: true, message: "Grade column created", data: column },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, type, is_active } = req.query as any;

    const result = await gradeColumnService.listGradeColumns({
        section_id: Number(section_id),
        type,
        is_active:
            is_active === "true"
                ? true
                : is_active === "false"
                ? false
                : undefined,
        page,
        limit,
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
        const column = await gradeColumnService.getGradeColumn(id);
        if (!column) return next(new ApiError(404, "Grade column not found"));
        sendResponse(res, { success: true, data: column });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await gradeColumnService.getGradeColumn(id);
        if (!exist) return next(new ApiError(404, "Grade column not found"));

        const updated = await gradeColumnService.updateGradeColumn(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Grade column updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await gradeColumnService.getGradeColumn(id);
        if (!exist) return next(new ApiError(404, "Grade column not found"));

        await gradeColumnService.deleteGradeColumn(id);
        sendResponse(res, { success: true, message: "Grade column deleted" });
    }
);

export const bulkCreate = catchAsync(async (req: Request, res: Response) => {
    const columns = await gradeColumnService.bulkCreateGradeColumns(req.body);
    sendResponse(
        res,
        { success: true, message: "Grade columns created", data: columns },
        201
    );
});
