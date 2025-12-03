import { z } from "zod";

export const listStudentGradeQuerySchema = z.object({
    query: z.object({
        section_id: z.string().regex(/^\d+$/),
        grade_column_id: z.string().regex(/^\d+$/).optional(),
        student_id: z.string().regex(/^\d+$/).optional(),
        is_overridden: z.enum(["true", "false"]).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        export: z.enum(["true", "false"]).optional(),
    }),
});

export const updateStudentGradeSchema = z.object({
    body: z.object({
        student_id: z.number().int().positive(),
        grade_column_id: z.number().int().positive(),
        score: z.number().min(0).optional(),
        override_score: z.number().min(0).optional(),
        override_reason: z.string().max(500).optional(),
        note: z.string().max(1000).optional(),
    }),
});

export const bulkUpdateStudentGradesSchema = z.object({
    body: z.object({
        grade_column_id: z.number().int().positive(),
        grades: z.array(
            z.object({
                student_id: z.number().int().positive(),
                score: z.number().min(0).optional(),
                override_score: z.number().min(0).optional(),
                note: z.string().max(1000).optional(),
            })
        ),
        override_reason: z.string().max(500).optional(),
    }),
});

export const studentGradeReportSchema = z.object({
    query: z.object({
        student_id: z.string().regex(/^\d+$/),
        section_id: z.string().regex(/^\d+$/).optional(),
        term_id: z.string().regex(/^\d+$/).optional(),
    }),
});
