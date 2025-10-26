import { z } from "zod";

export const createTestCaseSchema = z.object({
    body: z.object({
        questionId: z.number().int(),
        input: z.string().min(1),
        expectedOutput: z.string().min(1),
        isHidden: z.boolean().optional(),
        points: z.number().int().optional(),
        order: z.number().int().optional(),
    }),
});

export const updateTestCaseSchema = z.object({
    body: z.object({
        input: z.string().min(1).optional(),
        expectedOutput: z.string().min(1).optional(),
        isHidden: z.boolean().optional(),
        points: z.number().int().optional(),
        order: z.number().int().optional(),
    }),
});

export const testCaseIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export const listTestCaseQuerySchema = z.object({
    query: z.object({
        questionId: z.string().regex(/^\d+$/).transform(Number).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
