import { z } from "zod";

export const calculateGradeSchema = z.object({
    body: z.object({
        grade_column_id: z.number().int().positive(),
        student_ids: z.array(z.number().int().positive()).optional(), // Nếu không có = tính cho tất cả
        force_recalculate: z.boolean().default(false), // Có tính lại cho những điểm đã có không
    }),
});

export const calculateAllGradesSchema = z.object({
    body: z.object({
        section_id: z.number().int().positive(),
        student_ids: z.array(z.number().int().positive()).optional(),
        force_recalculate: z.boolean().default(false),
    }),
});

export const previewGradeCalculationSchema = z.object({
    body: z.object({
        grade_column_id: z.number().int().positive(),
        student_id: z.number().int().positive(),
    }),
});
