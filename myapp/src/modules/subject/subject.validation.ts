import { z } from "zod";

export const createSubjectSchema = z.object({
    body: z.object({
        subject_code: z.string().min(1).max(30),
        subject_name: z.string().min(1).max(200),
        credits: z.number().int().positive().optional(),
    }),
});

export const listSubjectQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const subjectIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateSubjectSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        subject_code: z.string().min(1).max(30).optional(),
        subject_name: z.string().min(1).max(200).optional(),
        credits: z.number().int().positive().optional(),
    }),
});
