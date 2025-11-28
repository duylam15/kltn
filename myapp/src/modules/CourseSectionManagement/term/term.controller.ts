import { Request, Response, NextFunction } from "express";
import * as termService from "./term.service";
import catchAsync from "../../../utils/catchAsync";
import { sendResponse } from "../../../utils/response";
import ApiError from "../../../utils/ApiError";

export const create = catchAsync(async (req: Request, res: Response) => {
    const term = await termService.createTerm(req.body);
    sendResponse(
        res,
        { success: true, message: "Term created", data: term },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { q } = req.query as any;

    const result = await termService.listTerms({
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
        const term = await termService.getTerm(id);
        if (!term) return next(new ApiError(404, "Term not found"));
        sendResponse(res, { success: true, data: term });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await termService.getTerm(id);
        if (!exist) return next(new ApiError(404, "Term not found"));

        const updated = await termService.updateTerm(id, req.body);
        sendResponse(res, {
            success: true,
            message: "Term updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await termService.getTerm(id);
        if (!exist) return next(new ApiError(404, "Term not found"));
        await termService.deleteTerm(id);
        sendResponse(res, { success: true, message: "Term deleted" });
    }
);
