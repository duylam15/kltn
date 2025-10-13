import { z } from "zod";

export const createCourseSectionSchema = z.object({
    body: z.object({
        subject_id: z.number().int().positive(),
        term_id: z.number().int().positive(),
        section_code: z.string().min(1).max(40),
        schedule: z.any().optional(),
        max_students: z.number().int().positive().optional(),
        status: z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
    }),
});

export const listCourseSectionQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        status: z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
        subject_id: z.string().regex(/^\d+$/).optional(),
        term_id: z.string().regex(/^\d+$/).optional(),
        q: z.string().optional(),
    }),
});

export const courseSectionIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateCourseSectionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        schedule: z.any().optional(),
        max_students: z.number().int().positive().optional(),
        current_students: z.number().int().min(0).optional(),
        status: z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
    }),
});
