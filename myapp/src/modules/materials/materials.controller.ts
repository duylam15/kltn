import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import ApiError from "../../utils/ApiError";
import * as materialService from "./materials.service";
import { createMaterial } from "./materials.service";

function convertBigInt(obj: any) {
    return JSON.parse(
        JSON.stringify(obj, (key, value) =>
            typeof value === "bigint" ? Number(value) : value
        )
    );
}

export async function createMaterialController(req: Request, res: Response) {
    try {
        const { sectionId, title, description, uploadedBy } = req.body;

        if (!sectionId || !uploadedBy) {
            return res.status(400).json({
                success: false,
                message: "sectionId and uploadedBy are required",
            });
        }

        const file = req.file;

        const material = await createMaterial({
            sectionId: Number(sectionId),
            uploadedBy: Number(uploadedBy),
            title,
            description,
            fileName: file?.originalname,
            filePath: file?.path,
            fileSize: file?.size,
            fileType: file?.mimetype,
        });

        res.json({ success: true, data: convertBigInt(material) });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack,
        });
    }
}


export const listBySection = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const sectionId = Number(req.params.sectionId);
  if (!sectionId) return next(new ApiError(400, "sectionId required"));

  const materials = await materialService.listMaterialsBySection(sectionId);
  sendResponse(res, { success: true, data: materials });
});

export const detail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const material = await materialService.getMaterial(id);
  if (!material) return next(new ApiError(404, "Material not found"));
  sendResponse(res, { success: true, data: material });
});

export const update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const exist = await materialService.getMaterial(id);
  if (!exist) return next(new ApiError(404, "Material not found"));

  const updated = await materialService.updateMaterial(id, req.body);
  sendResponse(res, {
    success: true,
    message: "Material updated",
    data: updated,
  });
});

export const remove = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const exist = await materialService.getMaterial(id);
  if (!exist) return next(new ApiError(404, "Material not found"));

  await materialService.deleteMaterial(id);
  sendResponse(res, { success: true, message: "Material deleted" });
});

export const incrementDownload = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const updated = await materialService.incrementDownloadCount(id);
  if (!updated) return next(new ApiError(404, "Material not found"));

  sendResponse(res, {
    success: true,
    message: "Download count increased",
    data: updated,
  });
});
