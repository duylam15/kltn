import { z } from "zod";

export const createChapterSchema = z.object({
    body: z.object({
        subjectId: z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        chapterCode: z
            .string()
            .min(1, "Chapter code is required")
            .max(30, "Chapter code max 30 characters")
            .regex(
                /^[A-Z0-9._-]+$/i,
                "Chapter code can only contain letters, numbers, dots, hyphens"
            ),
        chapterName: z
            .string()
            .min(1, "Chapter name is required")
            .max(200, "Chapter name max 200 characters"),
        description: z.string().max(500).optional(),
        order: z.number().int().min(0).optional(),
    }),
});

export const listChapterQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        subject_id: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const chapterIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Chapter ID must be numeric"),
    }),
});

export const updateChapterSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        chapterCode: z
            .string()
            .min(1)
            .max(30)
            .regex(/^[A-Z0-9._-]+$/i)
            .optional(),
        chapterName: z.string().min(1).max(200).optional(),
        description: z.string().max(500).optional(),
        order: z.number().int().min(0).optional(),
    }),
});
