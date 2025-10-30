import { prisma } from "@/prisma/client";
import { Request, Response } from "express";


export async function uploadMaterial(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded" });
        }

        const {
            title,
            description,
            uploadedBy,
            category,
            originalMaterialId,
            isPublic,
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
                category: category ?? "other",
                isPublic: isPublic === "true", // ⚡ fix boolean
                originalMaterialId: originalMaterialId || Date.now().toString(),
            },
        });

        res.json({
            success: true,
            data: JSON.parse(
                JSON.stringify(material, (_, v) =>
                    typeof v === "bigint" ? v.toString() : v
                )
            ),
        });
    } catch (error: any) {
        console.error("❌ Prisma error:", error); // in ra object đầy đủ
        res.status(500).json({
            success: false,
            message: error.message,
            meta: error.meta, // Prisma thường có thêm chi tiết ở đây
            code: error.code, // mã lỗi, ví dụ P2002, P2003, ...
        });
    }

}



// Lấy tất cả tài liệu
export async function getAllMaterials() {
    return prisma.material.findMany({
        include: { uploader: true }, // nếu muốn lấy thông tin người upload
        orderBy: { uploadedAt: "desc" },
    });
}

// Lấy 1 tài liệu
export async function getMaterialById(id: number) {
    return prisma.material.findUnique({
        where: { id },
        include: { uploader: true },
    });
}

// Tạo tài liệu
export async function createMaterial(data: any) {
  console.log("Creating material with data:", data);
    return prisma.material.create({
        data: {
            title: data.title,
            description: data.description,
            fileName: data.fileName,
            filePath: data.filePath,
            fileSize: data.fileSize,
            fileType: data.fileType,
            uploadedBy: data.uploadedBy,
            category: data.category,
            originalMaterialId: data.originalMaterialId,
        },
    });
}

// Cập nhật tài liệu
export async function updateMaterial(id: number, data: any) {
    return prisma.material.update({
        where: { id },
        data,
    });
}

// Xóa tài liệu
export async function deleteMaterial(id: number) {
    return prisma.material.delete({ where: { id } });
}

// Gán tài liệu vào lớp
export async function assignMaterialToClass(
    courseSectionId: number,
    materialId: number,
    assignedBy: number
) {
    return prisma.courseMaterial.create({
        data: {
            courseSectionId,
            materialId,
            assignedBy, // ← THÊM THAM SỐ
        },
    });
}

// Lấy tài liệu theo lớp
export async function getMaterialsByClass(courseSectionId: number) {
    return prisma.courseMaterial.findMany({
        where: { courseSectionId },
        include: {
            material: true,
        },
    });
}

// Cập nhật isOpen cho tài liệu trong lớp
export async function toggleMaterialVisibility(
    courseSectionId: number,
    materialId: number,
    isOpen: boolean
) {
    return prisma.courseMaterial.update({
        where: {
            courseSectionId_materialId: {
                // composite unique
                courseSectionId,
                materialId,
            },
        },
        data: { isOpen },
    });
}
