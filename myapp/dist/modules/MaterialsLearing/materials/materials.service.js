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
exports.createMaterialFromLink = createMaterialFromLink;
exports.getMaterialsBySubject = getMaterialsBySubject;
exports.getMaterialsByChapter = getMaterialsByChapter;
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
// Tạo tài liệu (đã cập nhật để hỗ trợ link, subject, chapter)
async function createMaterial(data) {
    console.log("Creating material with data:", data);
    // Validate subject/chapter nếu có
    if (data.subjectId) {
        const subject = await client_1.prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new Error(`Subject với id ${data.subjectId} không tồn tại`);
        }
    }
    if (data.chapterId) {
        const chapter = await client_1.prisma.chapter.findUnique({
            where: { id: data.chapterId },
        });
        if (!chapter) {
            throw new Error(`Chapter với id ${data.chapterId} không tồn tại`);
        }
    }
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
            link: data.link, // 🆕 Hỗ trợ link
            subjectId: data.subjectId, // 🆕 Hỗ trợ môn học
            chapterId: data.chapterId, // 🆕 Hỗ trợ chương học
            isPublic: data.isPublic ?? false,
        },
        include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            subject: { select: { id: true, subjectName: true } },
            chapter: { select: { id: true, chapterName: true } },
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
async function assignMaterialToClass(courseSectionId, materialId, assignedBy) {
    // Tạo liên kết tài liệu với lớp
    const courseMaterial = await client_1.prisma.courseMaterial.create({
        data: {
            courseSectionId,
            materialId,
            assignedBy,
        },
        include: {
            material: true,
            courseSection: {
                include: {
                    subject: true,
                },
            },
            assigner: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
    // Lấy danh sách sinh viên trong lớp
    const enrollments = await client_1.prisma.sectionEnrollment.findMany({
        where: {
            sectionId: courseSectionId,
            status: "enrolled",
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });
    // Tạo thông báo cho sinh viên
    if (enrollments.length > 0) {
        await client_1.prisma.notification.createMany({
            data: enrollments.map((enrollment) => ({
                userId: enrollment.student.userId,
                type: "system", // Dùng "system" vì NotificationType không có "material"
                title: `Tài liệu mới: ${courseMaterial.material.title}`,
                message: `${courseMaterial.assigner.fullName} đã chia sẻ tài liệu mới trong lớp ${courseMaterial.courseSection.subject.subjectName}`,
                sectionId: courseSectionId,
            })),
        });
    }
    return {
        courseMaterial,
        studentsNotified: enrollments.map((e) => ({
            userId: e.student.userId,
            studentId: e.studentId,
            fullName: e.student.user.fullName,
        })),
    };
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
// 🆕 Tạo tài liệu từ link (đơn giản, không validate link)
async function createMaterialFromLink(data) {
    // Validate subject/chapter exist if provided
    if (data.subjectId) {
        const subject = await client_1.prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new Error(`Subject với id ${data.subjectId} không tồn tại`);
        }
    }
    if (data.chapterId) {
        const chapter = await client_1.prisma.chapter.findUnique({
            where: { id: data.chapterId },
        });
        if (!chapter) {
            throw new Error(`Chapter với id ${data.chapterId} không tồn tại`);
        }
    }
    return client_1.prisma.material.create({
        data: {
            title: data.title,
            description: data.description,
            link: data.link, // Lưu link nguyên bản (string thuần)
            fileType: "link", // Đơn giản, chỉ đánh dấu là link
            category: data.category || "other",
            isPublic: data.isPublic ?? false,
            uploadedBy: data.uploadedBy,
            originalMaterialId: data.originalMaterialId || `LINK-${Date.now()}`,
            subjectId: data.subjectId,
            chapterId: data.chapterId,
            // Link không có file thật nên để null
            fileName: null,
            filePath: null,
            fileSize: null,
        },
        include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            subject: { select: { id: true, subjectName: true } },
            chapter: { select: { id: true, chapterName: true } },
        },
    });
}
// 🆕 Lấy tài liệu theo môn học
async function getMaterialsBySubject(subjectId) {
    return client_1.prisma.material.findMany({
        where: { subjectId },
        include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            chapter: { select: { id: true, chapterName: true } },
        },
        orderBy: { uploadedAt: "desc" },
    });
}
// 🆕 Lấy tài liệu theo chương
async function getMaterialsByChapter(chapterId) {
    return client_1.prisma.material.findMany({
        where: { chapterId },
        include: {
            uploader: { select: { id: true, fullName: true, email: true } },
            subject: { select: { id: true, subjectName: true } },
        },
        orderBy: { uploadedAt: "desc" },
    });
}
