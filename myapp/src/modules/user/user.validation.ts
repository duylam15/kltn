import { z } from "zod";

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email(),
        name: z.string().min(1).optional(),
    }),
});

export const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        name: z.string().min(1).optional(),
    }),
});
