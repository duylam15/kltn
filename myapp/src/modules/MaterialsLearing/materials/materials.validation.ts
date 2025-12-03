import { z } from "zod";

export const createMaterialSchema = z.object({
    body: z.object({
        sectionId: z.number().optional(), // ⚠️ Đổi thành optional
        title: z.string().min(1, "Title là bắt buộc"),
        description: z.string().optional(),
        fileName: z.string().optional(),
        filePath: z.string().optional(),
        fileSize: z.number().optional(),
        fileType: z.string().optional(),
        category: z
            .enum([
                "lecture",
                "slide",
                "exercise",
                "reference",
                "syllabus",
                "other",
            ])
            .default("other"),
        isPublic: z.boolean().optional().default(false),
        uploadedBy: z.number(),

        // 🆕 Thêm các field mới
        link: z.string().optional(), // Chỉ là string thuần, không validate URL
        subjectId: z.number().optional(), // Môn học
        chapterId: z.number().optional(), // Chương học
    }),
});

// 🆕 Schema riêng cho tạo tài liệu từ link
export const createMaterialFromLinkSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Title là bắt buộc"),
        description: z.string().optional(),
        link: z.string().min(1, "Link không được để trống"), // Chỉ check không rỗng
        category: z
            .enum([
                "lecture",
                "slide",
                "exercise",
                "reference",
                "syllabus",
                "other",
            ])
            .default("other"),
        isPublic: z.boolean().optional().default(false),
        uploadedBy: z.number(),

        // Tùy chọn gắn môn/chương
        subjectId: z.number().optional(),
        chapterId: z.number().optional(),
    }),
});

export const updateMaterialSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        fileName: z.string().optional(),
        filePath: z.string().optional(),
        fileSize: z.number().optional(),
        fileType: z.string().optional(),
        category: z
            .enum([
                "lecture",
                "slide",
                "exercise",
                "reference",
                "syllabus",
                "other",
            ])
            .optional(),
        isPublic: z.boolean().optional(),

        // 🆕 Cho phép cập nhật link, subject, chapter
        link: z.string().optional(), // Chỉ là string
        subjectId: z.number().nullable().optional(), // null để xóa liên kết
        chapterId: z.number().nullable().optional(),
    }),
});

export const materialIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});
