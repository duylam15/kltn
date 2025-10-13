import { z } from "zod";

export const createChapterSchema = z.object({
    body: z.object({
        subjectId: z.number().int().positive(),
        chapterCode: z.string().min(1).max(30),
        chapterName: z.string().min(1).max(200),
        description: z.string().optional(),
        order: z.number().int().nonnegative().optional(),
    }),
});

export const updateChapterSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        chapterCode: z.string().min(1).max(30).optional(),
        chapterName: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        order: z.number().int().nonnegative().optional(),
    }),
});

export const listChapterQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        subjectId: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const chapterIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const getQuestionsByDifficultySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});
