import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as sectionGroupService from "./sectionGroup.service";

export const create = catchAsync(async (req: Request, res: Response) => {
    const sectionGroup = await sectionGroupService.createSectionGroup(req.body);
    sendResponse(
        res,
        { success: true, message: "Section group created", data: sectionGroup },
        201
    );
});

export const list = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { section_id, is_active, q } = req.query as any;

    const result = await sectionGroupService.listSectionGroups({
        page,
        limit,
        sectionId: section_id ? Number(section_id) : undefined,
        isActive: is_active !== undefined ? is_active === "true" : undefined,
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
        const sectionGroup = await sectionGroupService.getSectionGroup(id);
        if (!sectionGroup)
            return next(new ApiError(404, "Section group not found"));
        sendResponse(res, { success: true, data: sectionGroup });
    }
);

export const update = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionGroupService.getSectionGroup(id);
        if (!exist) return next(new ApiError(404, "Section group not found"));

        const updated = await sectionGroupService.updateSectionGroup(
            id,
            req.body
        );
        sendResponse(res, {
            success: true,
            message: "Section group updated",
            data: updated,
        });
    }
);

export const remove = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const id = Number(req.params.id);
        const exist = await sectionGroupService.getSectionGroup(id);
        if (!exist) return next(new ApiError(404, "Section group not found"));
        await sectionGroupService.deleteSectionGroup(id);
        sendResponse(res, { success: true, message: "Section group deleted" });
    }
);

export const listGroupsBySection = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        if (!sectionId) return next(new ApiError(400, "sectionId required"));

        const groups = await sectionGroupService.listGroupsBySection(sectionId);

        sendResponse(res, {
            success: true,
            data: groups,
        });
    }
);