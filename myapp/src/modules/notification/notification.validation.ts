import { z } from "zod";

export const listNotiSchema = z.object({
    query: z.object({
        unread: z.string().optional(), // 'true' | 'false'
        limit: z.string().regex(/^\d+$/).optional(),
        cursor: z.string().optional(),
    }),
});

export const markReadSchema = z.object({
    body: z.object({
        ids: z.array(z.number()).optional(),
    }),
});
