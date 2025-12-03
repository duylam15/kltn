import { z } from "zod";

export const createChoiceSchema = z.object({
    params: z.object({
        questionId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        content: z.string().min(1),
        isCorrect: z.boolean().default(false),
        order: z.number().int().default(0),
    }),
});

export const updateChoiceSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // choiceId
    }),
    body: z.object({
        content: z.string().optional(),
        isCorrect: z.boolean().optional(),
        order: z.number().int().optional(),
    }),
});

export const deleteChoiceSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // choiceId
    }),
});

export const getChoiceSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});
