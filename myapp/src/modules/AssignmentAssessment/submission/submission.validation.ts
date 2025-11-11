import { z } from "zod";

export const getHistorySchema = z.object({
    params: z.object({
        assignmentId: z.string().regex(/^\d+$/),
        studentId: z.string().regex(/^\d+$/),
    }),
});

export const getByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // submissionId
    }),
});

export const getBestSchema = z.object({
    params: z.object({
        assignmentId: z.string().regex(/^\d+$/),
        studentId: z.string().regex(/^\d+$/),
    }),
});

export const createSchema = z.object({
    body: z.object({
        assignmentId: z.number(),
        studentId: z.number(),
        filePath: z.string().optional(),
        answerText: z.string().optional(),
        attempt: z.number().optional(),
    }),
});

export const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        score: z.number().optional(),
        maxScore: z.number().optional(),
        feedback: z.string().optional(),
        autoGraded: z.boolean().optional(),
    }),
});

export const deleteSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
