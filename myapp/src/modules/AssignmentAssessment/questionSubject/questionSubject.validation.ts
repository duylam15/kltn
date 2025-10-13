import { z } from "zod";

export const createQuestionSubjectSchema = z.object({
    body: z.object({
        subjectCode: z.string().min(1).max(30),
        subjectName: z.string().min(1).max(200),
        description: z.string().optional(),
    }),
});

export const updateQuestionSubjectSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        subjectCode: z.string().min(1).max(30).optional(),
        subjectName: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
    }),
});

export const listQuestionSubjectQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const questionSubjectIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
