"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialIdParamSchema = exports.updateMaterialSchema = exports.createMaterialFromLinkSchema = exports.createMaterialSchema = void 0;
const zod_1 = require("zod");
exports.createMaterialSchema = zod_1.z.object({
    body: zod_1.z.object({
        sectionId: zod_1.z.number().optional(), // ⚠️ Đổi thành optional
        title: zod_1.z.string().min(1, "Title là bắt buộc"),
        description: zod_1.z.string().optional(),
        fileName: zod_1.z.string().optional(),
        filePath: zod_1.z.string().optional(),
        fileSize: zod_1.z.number().optional(),
        fileType: zod_1.z.string().optional(),
        category: zod_1.z
            .enum([
            "lecture",
            "slide",
            "exercise",
            "reference",
            "syllabus",
            "other",
        ])
            .default("other"),
        isPublic: zod_1.z.boolean().optional().default(false),
        uploadedBy: zod_1.z.number(),
        // 🆕 Thêm các field mới
        link: zod_1.z.string().optional(), // Chỉ là string thuần, không validate URL
        subjectId: zod_1.z.number().optional(), // Môn học
        chapterId: zod_1.z.number().optional(), // Chương học
    }),
});
// 🆕 Schema riêng cho tạo tài liệu từ link
exports.createMaterialFromLinkSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Title là bắt buộc"),
        description: zod_1.z.string().optional(),
        link: zod_1.z.string().min(1, "Link không được để trống"), // Chỉ check không rỗng
        category: zod_1.z
            .enum([
            "lecture",
            "slide",
            "exercise",
            "reference",
            "syllabus",
            "other",
        ])
            .default("other"),
        isPublic: zod_1.z.boolean().optional().default(false),
        uploadedBy: zod_1.z.number(),
        // Tùy chọn gắn môn/chương
        subjectId: zod_1.z.number().optional(),
        chapterId: zod_1.z.number().optional(),
    }),
});
exports.updateMaterialSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        fileName: zod_1.z.string().optional(),
        filePath: zod_1.z.string().optional(),
        fileSize: zod_1.z.number().optional(),
        fileType: zod_1.z.string().optional(),
        category: zod_1.z
            .enum([
            "lecture",
            "slide",
            "exercise",
            "reference",
            "syllabus",
            "other",
        ])
            .optional(),
        isPublic: zod_1.z.boolean().optional(),
        // 🆕 Cho phép cập nhật link, subject, chapter
        link: zod_1.z.string().optional(), // Chỉ là string
        subjectId: zod_1.z.number().nullable().optional(), // null để xóa liên kết
        chapterId: zod_1.z.number().nullable().optional(),
    }),
});
exports.materialIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
