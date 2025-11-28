import { NextFunction, Request, Response } from "express";
import * as materialService from "./materials.service";
import { prisma } from "../../../prisma/client";
import { jsonSafe } from "../../../utils/bigint";
import { log } from "node:console";
import catchAsync from "../../../utils/catchAsync";
import ApiError from "../../../utils/ApiError";
import { sendResponse } from "../../../utils/response";

export async function getMaterials(req: Request, res: Response) {
    try {
        const materials = await materialService.getAllMaterials();
        res.json({ success: true, data: jsonSafe(materials) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getMaterial(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const material = await materialService.getMaterialById(id);
        res.json({ success: true, data: jsonSafe(material) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function createMaterial(req: Request, res: Response) {
    try {
        const material = await materialService.createMaterial(req.body);
        res.json({ success: true, data: jsonSafe(material) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function updateMaterial(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const material = await materialService.updateMaterial(id, req.body);
        res.json({ success: true, data: jsonSafe(material) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function deleteMaterial(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await materialService.deleteMaterial(id);
        res.json({ success: true, message: "Deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function uploadMaterial(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded" });
        }

        const {
            sectionId,
            title,
            description,
            uploadedBy,
            originalMaterialId,
        } = req.body;

        const material = await prisma.material.create({
            data: {
                title,
                description,
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileSize: BigInt(req.file.size),
                fileType: req.file.mimetype,
                uploadedBy: Number(uploadedBy),
                originalMaterialId: originalMaterialId || Date.now().toString(),
            },
        });

        res.json({ success: true, data: jsonSafe(material) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function assignMaterialToClass(req: Request, res: Response) {
    try {
        const { courseSectionId, materialId, assignedBy } = req.body;

        if (!assignedBy) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin assignedBy",
            });
        }

        // ✅ Kiểm tra material có tồn tại không
        const material = await prisma.material.findUnique({
            where: { id: Number(materialId) },
        });

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Tài liệu không tồn tại",
            });
        }

        // ✅ Kiểm tra quyền: chỉ gán được nếu:
        // - Là tài liệu của mình HOẶC
        // - Là tài liệu public của người khác
        const isOwner = material.uploadedBy === Number(assignedBy);
        const isPublic = material.isPublic;

        if (!isOwner && !isPublic) {
            return res.status(403).json({
                success: false,
                message:
                    "Bạn không có quyền gán tài liệu này (chỉ gán được tài liệu của mình hoặc tài liệu public)",
            });
        }

        // ✅ Kiểm tra trùng
        const existing = await prisma.courseMaterial.findUnique({
            where: {
                courseSectionId_materialId: {
                    courseSectionId: Number(courseSectionId),
                    materialId: Number(materialId),
                },
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Tài liệu này đã được gán vào lớp rồi",
            });
        }

        // ✅ Tạo liên kết
        const courseMaterial = await materialService.assignMaterialToClass(
            Number(courseSectionId),
            Number(materialId),
            Number(assignedBy)
        );

        res.json({ success: true, data: courseMaterial });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getMaterialsByClass(req: Request, res: Response) {
    try {
        const courseSectionId = parseInt(req.params.courseSectionId);

        const materials = await prisma.courseMaterial.findMany({
            where: { courseSectionId },
            include: { material: true },
        });

        res.json({
            success: true,
            data: jsonSafe(materials), // sẽ có { id, courseSectionId, materialId, isOpen, assignedAt, material: {...} }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function updateMaterialVisibility(req: Request, res: Response) {
    try {
        const { courseSectionId, materialId, isOpen } = req.body;

        const updated = await materialService.toggleMaterialVisibility(
            Number(courseSectionId),
            Number(materialId),
            Boolean(isOpen)
        );

        res.json({ success: true, data: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getMaterialsByTeacher(req: Request, res: Response) {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const materials = await prisma.material.findMany({
            where: { uploadedBy: teacherId },
            orderBy: { uploadedAt: "desc" },
        });
        res.json({ success: true, data: jsonSafe(materials) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export const toInt = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

export const pad4 = (id: number) => String(id).padStart(4, "0");

// Xác định rootId chuẩn khi cần
export const getRootId = (m: {
    id: number;
    originalMaterialId?: string | null;
}) => String(m.originalMaterialId ?? `ROOT-MAT-${pad4(m.id)}`);

// Kiểm tra m có phải “bản gốc” của rootId không
export const isOriginalOfRoot = (m: { id: number }, rootId: string) =>
    rootId === `ROOT-MAT-${pad4(m.id)}`;

export async function listPublicMaterialsGrouped(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const {
            keyword = "",
            type,
            page = "1",
            size = "20",
            userId,
        } = req.query as any;

        const p = Math.max(parseInt(page, 10) || 1, 1);
        const s = Math.min(Math.max(parseInt(size, 10) || 20, 1), 100);
        const currentUserId = Number(userId);

        if (!currentUserId || Number.isNaN(currentUserId)) {
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai userId" });
        }

        // 1) Lấy tất cả "root" (gốc) mà user hiện tại đã có trong Tủ của tôi
        const myRows = await prisma.material.findMany({
            where: { uploadedBy: currentUserId },
            select: { id: true, originalMaterialId: true },
        });

        const myRootSet = new Set<string>(
            myRows.map((m) => String(m.originalMaterialId ?? m.id))
        );

        // 2) Điều kiện truy vấn danh sách công khai (khác uploader hiện tại)
        const wherePublic: any = {
            isPublic: true,
            NOT: { uploadedBy: currentUserId }, // không lấy đồ chính mình
        };

        if (type) {
            wherePublic.fileType = String(type);
        }
        if (keyword) {
            wherePublic.OR = [
                { title: { contains: String(keyword), mode: "insensitive" } },
                {
                    description: {
                        contains: String(keyword),
                        mode: "insensitive",
                    },
                },
            ];
        }

        // 3) Lấy dữ liệu công khai (để grouping & lọc tiếp ở bước 4)
        //    Nếu data quá lớn, có thể thêm phân trang ở query này rồi grouping client-side,
        //    nhưng để đúng yêu cầu “lọc root đã có” thì dễ nhất là grouping phía BE trước rồi phân trang.
        const pubRows = await prisma.material.findMany({
            where: wherePublic,
            include: {
                uploader: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { uploadedAt: "desc" }, // để khi không có bản gốc thì ưu tiên mới nhất
        });

        // 4) Loại bỏ tất cả tài liệu công khai có root trùng với Tủ của tôi
        const filtered = pubRows.filter((m) => {
            const rootId = String(m.originalMaterialId ?? m.id);
            return !myRootSet.has(rootId);
        });

        // 5) Nhóm theo root, ưu tiên "bản gốc" (m.originalMaterialId == null).
        //    Nếu trong nhóm không có bản gốc thì lấy bản mới nhất (vì đã orderBy desc).
        const byRoot = new Map<string, any>();
        for (const m of filtered) {
            const rootId = String(m.originalMaterialId ?? m.id);
            const existing = byRoot.get(rootId);

            const isOriginal = m.originalMaterialId == null;
            if (!existing) {
                byRoot.set(rootId, m);
            } else {
                const existingIsOriginal = existing.originalMaterialId == null;
                if (!existingIsOriginal && isOriginal) {
                    // Ưu tiên bản gốc nếu có
                    byRoot.set(rootId, m);
                }
                // nếu cả 2 đều không phải bản gốc, giữ cái đã có (đang là bản mới nhất do sort desc)
            }
        }

        const grouped = Array.from(byRoot.values());

        // 6) Phân trang sau khi grouping
        const total = grouped.length;
        const start = (p - 1) * s;
        const end = start + s;
        const pageRows = grouped.slice(start, end);

        // 7) Trả về (BigInt-safe)
        return res.json(
            jsonSafe({
                success: true,
                data: pageRows.map((m) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    fileName: m.fileName,
                    filePath: m.filePath,
                    fileType: m.fileType,
                    fileSize: m.fileSize, // BigInt -> jsonSafe xử lý
                    isPublic: m.isPublic,
                    uploadedAt: m.uploadedAt, // Date -> jsonSafe xử lý
                    originalMaterialId: m.originalMaterialId ?? null,
                    uploader: m.uploader
                        ? {
                              id: m.uploader.id,
                              fullName: m.uploader.fullName,
                              email: m.uploader.email,
                          }
                        : null,
                })),
                pagination: { page: p, size: s, total },
            })
        );
    } catch (e) {
        next(e);
    }
}

export async function copyMaterial(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { materialId, userId } = req.body as {
            materialId?: number | string;
            userId?: number | string;
        };

        const srcId = toInt(materialId);
        const uploaderId = toInt(userId);
        if (!srcId)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai materialId" });
        if (!uploaderId)
            return res
                .status(400)
                .json({ success: false, message: "Thiếu hoặc sai userId" });

        // Lấy nguồn
        const source = await prisma.material.findUnique({
            where: { id: srcId },
        });
        if (!source) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Material nguồn không tồn tại",
                });
        }

        // Xác định root của chuỗi sao chép
        const rootId = String(
            source.originalMaterialId ?? source.id.toString()
        );

        // Tạo bản sao (luôn private, giữ liên kết “gốc”)
        try {
            const cloned = await prisma.material.create({
                data: {
                    title: source.title,
                    description: source.description,
                    fileName: source.fileName,
                    filePath: source.filePath,
                    fileType: source.fileType,
                    fileSize: source.fileSize,
                    uploadedBy: uploaderId, // thuộc "tủ của tôi"
                    originalMaterialId: rootId, // GIỮ LIÊN KẾT GỐC
                    isPublic: false, // mặc định không công khai
                    ...(typeof (source as any).orderBy !== "undefined"
                        ? { orderBy: (source as any).orderBy }
                        : {}),
                },
            });

            return res
                .status(201)
                .json(jsonSafe({ success: true, data: { cloned } }));
        } catch (e: any) {
            // Nếu bạn đang có unique (uploadedBy, originalMaterialId) để chặn trùng trong tủ
            if (e?.code === "P2002") {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message: "Tài liệu đã tồn tại trong tủ của bạn",
                    });
            }
            throw e;
        }
    } catch (e) {
        next(e);
    }
}

// chỉ lấy tài liệu mở cho SV theo section
export const listOpenBySection = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const sectionId = Number(req.params.sectionId);
        if (isNaN(sectionId))
            return next(new ApiError(400, "Invalid sectionId"));

        // Bước 1: Lấy tất cả tài liệu đã mở
        const rows = await prisma.courseMaterial.findMany({
            where: {
                courseSectionId: sectionId,
                isOpen: true,
            },
            include: {
                material: {
                    include: {
                        uploader: {
                            select: { id: true, fullName: true, email: true },
                        },
                    },
                },
                assigner: true, // Người gán (để check xem có phải GV dạy lớp không)
            },
            orderBy: {
                material: { uploadedAt: "desc" },
            },
        });

        // Bước 2: Lọc ở application layer
        const validMaterials = rows
            .filter((row) => {
                const mat = row.material;
                // Giữ lại nếu:
                // 1. Tài liệu vẫn public, HOẶC
                // 2. Tài liệu của chính người gán (GV đã upload)
                return (
                    mat.isPublic === true || mat.uploadedBy === row.assignedBy
                );
            })
            .map((r) => r.material);

        sendResponse(res, { success: true, data: jsonSafe(validMaterials) });
    }
);
