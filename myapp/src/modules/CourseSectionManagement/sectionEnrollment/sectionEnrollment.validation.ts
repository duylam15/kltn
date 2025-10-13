import { z } from "zod";

export const createSectionEnrollmentSchema = z.object({
    body: z.object({
        section_id: z.number().int().positive(),
        student_id: z.number().int().positive(),
        status: z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});

export const listSectionEnrollmentQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        section_id: z.string().regex(/^\d+$/).optional(),
        student_id: z.string().regex(/^\d+$/).optional(),
        status: z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});

export const sectionEnrollmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateSectionEnrollmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        status: z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});
