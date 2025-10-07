import { z } from "zod";

export const getGradesBySectionSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
    }),
});

export const getGradesByStudentSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
        studentId: z.string().regex(/^\d+$/),
    }),
});

export const updateGradeSchema = z.object({
    body: z.object({
        columnId: z.number().int().positive(),
        studentId: z.number().int().positive(),
        score: z.number().min(0).optional(),
        note: z.string().max(200).optional(),
        isExcused: z.boolean().optional(),
    }),
});

export const bulkUpdateGradesSchema = z.object({
    body: z.object({
        grades: z.array(
            z.object({
                columnId: z.number().int().positive(),
                studentId: z.number().int().positive(),
                score: z.number().min(0).optional(),
                note: z.string().max(200).optional(),
                isExcused: z.boolean().optional(),
            })
        ),
    }),
});

export const exportGradesSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        format: z.enum(["json", "csv"]).default("json"),
    }),
});
