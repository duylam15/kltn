import { Request, Response } from "express";
import * as materialService from "./materials.service";
import { prisma } from "@/prisma/client";
import { jsonSafe } from "@/utils/bigint";
export async function copyMaterial(req: Request, res: Response) {
    try {
        const { materialId, teacherId, sectionId } = req.body;

        if (!materialId || !teacherId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin materialId hoặc teacherId",
            });
        }

        const originalMaterial = await materialService.getMaterialById(
            Number(materialId)
        );

        if (!originalMaterial) {
            return res.status(404).json({
                success: false,
                message: "Tài liệu không tồn tại",
            });
        }

        if (originalMaterial.uploadedBy === Number(teacherId)) {
            return res.status(400).json({
                success: false,
                message: "Không thể sao chép tài liệu của chính mình",
            });
        }

        // Tạo bản sao tài liệu
        const newMaterial = await materialService.copyMaterial(
            Number(materialId),
            Number(teacherId)
        );

        // Nếu có sectionId, tự động gán vào lớp luôn
        if (sectionId) {
            await prisma.courseMaterial.create({
                data: {
                    courseSectionId: Number(sectionId),
                    materialId: newMaterial.id,
                    assignedBy: Number(teacherId), // ← THÊM DÒNG NÀY
                    isOpen: true,
                },
            });
        }

        res.json({
            success: true,
            data: jsonSafe(newMaterial),
            message: "Sao chép tài liệu thành công",
        });
    } catch (error: any) {
        console.error("Lỗi copy material:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Không thể sao chép tài liệu",
        });
    }
}

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

        const { sectionId, title, description, uploadedBy, originalMaterialId } = req.body;

        const material = await prisma.material.create({
            data: {
                title,
                description,
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileSize: BigInt(req.file.size),
                fileType: req.file.mimetype,
                uploadedBy: Number(uploadedBy),
                originalMaterialId: originalMaterialId || undefined, // 👈 giữ nguyên string
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

        // Validate
        if (!assignedBy) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin assignedBy (ID người gán)",
            });
        }

        // Check trước khi tạo
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

        const courseMaterial = await materialService.assignMaterialToClass(
            Number(courseSectionId),
            Number(materialId),
            Number(assignedBy) // ← THÊM THAM SỐ
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
