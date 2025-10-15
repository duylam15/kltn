import { z } from "zod";

export const createSectionInstructorSchema = z.object({
    body: z.object({
        section_id: z.number().int().positive(),
        teacher_id: z.number().int().positive(),
        role: z.enum(["owner", "co", "ta"]).optional(),
    }),
});

export const listSectionInstructorQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        section_id: z.string().regex(/^\d+$/).optional(),
        teacher_id: z.string().regex(/^\d+$/).optional(),
        role: z.enum(["owner", "co", "ta"]).optional(),
    }),
});

export const sectionInstructorParamSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
        teacherId: z.string().regex(/^\d+$/),
    }),
});

export const updateSectionInstructorSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
        teacherId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        role: z.enum(["owner", "co", "ta"]).optional(),
    }),
});
