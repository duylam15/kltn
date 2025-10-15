import { z } from "zod";

// POST /teachers
export const createTeacherSchema = z.object({
    body: z.object({
        teacher_code: z.string().min(3),
        password: z.string().min(6),
        full_name: z.string().min(3),
        email: z.string().email().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        specialization: z.string().optional(),
    }),
});


// GET /teachers
export const listTeacherQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        q: z.string().optional(),
    }),
});

// GET /teachers/:id + DELETE /teachers/:id
export const teacherIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "id must be a number"),
    }),
});

// PATCH /teachers/:id
export const updateTeacherSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "id must be a number"),
    }),
    body: z.object({
        department: z.string().optional(),
        position: z.string().optional(),
        specialization: z.string().optional(),
    }),
});
