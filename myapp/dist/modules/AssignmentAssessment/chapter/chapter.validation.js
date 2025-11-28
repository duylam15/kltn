"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChapterSchema = exports.chapterIdParamSchema = exports.listChapterQuerySchema = exports.createChapterSchema = void 0;
const zod_1 = require("zod");
exports.createChapterSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        chapterCode: zod_1.z
            .string()
            .min(1, "Chapter code is required")
            .max(30, "Chapter code max 30 characters")
            .regex(/^[A-Z0-9._-]+$/i, "Chapter code can only contain letters, numbers, dots, hyphens"),
        chapterName: zod_1.z
            .string()
            .min(1, "Chapter name is required")
            .max(200, "Chapter name max 200 characters"),
        description: zod_1.z.string().max(500).optional(),
        order: zod_1.z.number().int().min(0).optional(),
    }),
});
exports.listChapterQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        subject_id: zod_1.z.string().regex(/^\d+$/).optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.chapterIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Chapter ID must be numeric"),
    }),
});
exports.updateChapterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        chapterCode: zod_1.z
            .string()
            .min(1)
            .max(30)
            .regex(/^[A-Z0-9._-]+$/i)
            .optional(),
        chapterName: zod_1.z.string().min(1).max(200).optional(),
        description: zod_1.z.string().max(500).optional(),
        order: zod_1.z.number().int().min(0).optional(),
    }),
});
