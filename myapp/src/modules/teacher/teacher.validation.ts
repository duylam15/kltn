import { z } from "zod";

export const createTeacherSchema = z.object({
    body: z.object({
        user_id: z.number().int().positive(),
        teacher_code: z.string().min(3),
        department: z.string().optional(),
        position: z.string().optional(),
        specialization: z.string().optional(),
    }),
});

export const listTeacherQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        q: z.string().optional(),
    }),
});

export const teacherIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateTeacherSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        department: z.string().optional(),
        position: z.string().optional(),
        specialization: z.string().optional(),
    }),
});
