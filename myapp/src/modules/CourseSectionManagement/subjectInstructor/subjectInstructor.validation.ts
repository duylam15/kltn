import { z } from "zod";

export const assignSubjectSchema = z.object({
    body: z.object({
        subjectId: z.number().int().positive("Subject ID must be a positive integer"),
        teacherId: z.number().int().positive("Teacher ID must be a positive integer"),
        role: z.enum(["owner", "co", "ta"]).optional().default("owner"),
    }),
});

export const listSubjectInstructorQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        subject_id: z.string().regex(/^\d+$/).optional(),
        teacher_id: z.string().regex(/^\d+$/).optional(),
        role: z.enum(["owner", "co", "ta"]).optional(),
        is_active: z.enum(["true", "false"]).optional(),
        subject_code: z.string().optional(),
        department: z.string().optional(),
    }),
});

export const subjectInstructorParamSchema = z.object({
    params: z.object({
        subjectId: z.string().regex(/^\d+$/, "Subject ID must be numeric"),
        teacherId: z.string().regex(/^\d+$/, "Teacher ID must be numeric"),
    }),
});

export const updateSubjectInstructorSchema = z.object({
    params: z.object({
        subjectId: z.string().regex(/^\d+$/),
        teacherId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        role: z.enum(["owner", "co", "ta"]).optional(),
        isActive: z.boolean().optional(),
    }),
});

export const teacherIdParamSchema = z.object({
    params: z.object({
        teacherId: z.string().regex(/^\d+$/, "Teacher ID must be numeric"),
    }),
});

export const bulkAssignSubjectsSchema = z.object({
    body: z.object({
        teacherId: z.number().int().positive("Teacher ID must be a positive integer"),
        subjectIds: z
            .array(z.number().int().positive())
            .min(1, "Must provide at least one subject ID"),
        role: z.enum(["owner", "co", "ta"]).optional().default("owner"),
    }),
});

// Thêm vào file subjectInstructor.validation.ts

export const bulkAssignTeachersSchema = z.object({
    body: z.object({
        subjectId: z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        teacherIds: z
            .array(z.number().int().positive())
            .min(1, "Must provide at least one teacher ID")
            .max(20, "Cannot assign more than 20 teachers at once"),
        role: z.enum(["owner", "co", "ta"]).optional().default("co"),
    }),
});

export const subjectIdParamSchema = z.object({
    params: z.object({
        subjectId: z.string().regex(/^\d+$/, "Subject ID must be numeric"),
    }),
});

export const removeTeachersSchema = z.object({
    body: z.object({
        subjectId: z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        teacherIds: z
            .array(z.number().int().positive())
            .min(1, "Must provide at least one teacher ID"),
    }),
});