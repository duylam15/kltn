import { z } from "zod";

export const createTermSchema = z.object({
    body: z.object({
        code: z.string().min(1).max(30),
        name: z.string().min(1).max(100),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional(),
    }),
});

export const listTermQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const termIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateTermSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        code: z.string().min(1).max(30).optional(),
        name: z.string().min(1).max(100).optional(),
        start_date: z.string().datetime().optional(),
        end_date: z.string().datetime().optional(),
    }),
});
