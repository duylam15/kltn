import { z } from "zod";

export const getBySubmissionSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^\d+$/),
    }),
});

export const getByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số"),
    }),

    body: z.object({
        answerText: z.string().optional(),
        selectedChoices: z.array(z.number()).optional(),
        isCorrect: z.boolean().optional(),
        score: z
            .union([z.number(), z.string().regex(/^\d+(\.\d+)?$/)])
            .optional(),
        feedback: z.string().optional(),
    }),
});
