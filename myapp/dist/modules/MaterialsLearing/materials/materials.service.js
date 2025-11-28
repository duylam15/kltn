"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMaterial = uploadMaterial;
exports.getAllMaterials = getAllMaterials;
exports.getMaterialById = getMaterialById;
exports.createMaterial = createMaterial;
exports.updateMaterial = updateMaterial;
exports.deleteMaterial = deleteMaterial;
exports.assignMaterialToClass = assignMaterialToClass;
exports.getMaterialsByClass = getMaterialsByClass;
exports.toggleMaterialVisibility = toggleMaterialVisibility;
const client_1 = require("../../../prisma/client");
async function uploadMaterial(req, res) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ success: false, message: "No file uploaded" });
        }
        const { title, description, uploadedBy, category, originalMaterialId, isPublic, } = req.body;
        const material = await client_1.prisma.material.create({
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
            data: JSON.parse(JSON.stringify(material, (_, v) => typeof v === "bigint" ? v.toString() : v)),
        });
    }
    catch (error) {
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
async function getAllMaterials() {
    return client_1.prisma.material.findMany({
        include: { uploader: true }, // nếu muốn lấy thông tin người upload
        orderBy: { uploadedAt: "desc" },
    });
}
// Lấy 1 tài liệu
async function getMaterialById(id) {
    return client_1.prisma.material.findUnique({
        where: { id },
        include: { uploader: true },
    });
}
// Tạo tài liệu
async function createMaterial(data) {
    console.log("Creating material with data:", data);
    return client_1.prisma.material.create({
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
async function updateMaterial(id, data) {
    return client_1.prisma.material.update({
        where: { id },
        data,
    });
}
// Xóa tài liệu
async function deleteMaterial(id) {
    return client_1.prisma.material.delete({ where: { id } });
}
// Gán tài liệu vào lớp
async function assignMaterialToClass(courseSectionId, materialId, assignedBy) {
    return client_1.prisma.courseMaterial.create({
        data: {
            courseSectionId,
            materialId,
            assignedBy, // ← THÊM THAM SỐ
        },
    });
}
// Lấy tài liệu theo lớp
async function getMaterialsByClass(courseSectionId) {
    return client_1.prisma.courseMaterial.findMany({
        where: { courseSectionId },
        include: {
            material: true,
        },
    });
}
// Cập nhật isOpen cho tài liệu trong lớp
async function toggleMaterialVisibility(courseSectionId, materialId, isOpen) {
    return client_1.prisma.courseMaterial.update({
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
