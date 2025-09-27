import { z } from "zod";

export const createRoleSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(50),
        description: z.string().max(200).optional(),
        permissions: z.any().optional(), // có thể là mảng string hoặc object JSON
    }),
});

export const updateRoleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // role id dạng số
    }),
    body: z.object({
        name: z.string().min(2).max(50).optional(),
        description: z.string().max(200).optional(),
        permissions: z.any().optional(),
    }),
});

export const roleIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
