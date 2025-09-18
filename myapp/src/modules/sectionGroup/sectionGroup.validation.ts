import { z } from "zod";

export const createSectionGroupSchema = z.object({
    body: z.object({
        section_id: z.number().int().positive(),
        group_code: z.string().max(40).optional(),
        group_name: z.string().max(100).optional(),
        max_members: z.number().int().positive().optional(),
        is_active: z.boolean().optional(),
    }),
});

export const listSectionGroupQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        section_id: z.string().regex(/^\d+$/).optional(),
        is_active: z.enum(["true", "false"]).optional(),
        q: z.string().optional(),
    }),
});

export const sectionGroupIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateSectionGroupSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        group_code: z.string().max(40).optional(),
        group_name: z.string().max(100).optional(),
        max_members: z.number().int().positive().optional(),
        is_active: z.boolean().optional(),
    }),
});
