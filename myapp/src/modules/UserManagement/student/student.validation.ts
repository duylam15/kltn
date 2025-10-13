import { z } from "zod";

export const createStudentSchema = z.object({
    body: z.object({
        student_code: z.string().min(3),
        class_name: z.string().optional(),
        major: z.string().optional(),
        academic_year: z.string().optional(),
        enrollment_year: z.number().int().optional(),
    }),
});


export const listStudentQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        status: z.string().optional(),
        class_name: z.string().optional(),
        major: z.string().optional(),
        q: z.string().optional(),
    }),
});

export const studentIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateStudentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        class_name: z.string().optional(),
        major: z.string().optional(),
        academic_year: z.string().optional(),
        enrollment_year: z.number().int().optional(),
        gpa: z.number().min(0).max(10).optional(),
        status: z
            .enum(["active", "suspended", "graduated", "dropped"])
            .optional(),
    }),
});
