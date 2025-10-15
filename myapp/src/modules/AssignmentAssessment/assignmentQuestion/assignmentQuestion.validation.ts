import { z } from "zod";

export const assignmentQuestionParams = z.object({
    params: z.object({
        assignmentId: z.string().regex(/^\d+$/).transform(Number),
        questionId: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export const assignmentIdParam = z.object({
    params: z.object({
        assignmentId: z.string().regex(/^\d+$/).transform(Number),
    }),
});

export const questionIdParam = z.object({
    params: z.object({
        questionId: z.string().regex(/^\d+$/).transform(Number),
    }),
});
