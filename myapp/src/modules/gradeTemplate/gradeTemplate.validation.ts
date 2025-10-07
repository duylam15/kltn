import { z } from "zod";

const gradeColumnSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum([
        "attendance",
        "assignment",
        "quiz",
        "midterm",
        "final",
        "project",
        "participation",
        "custom",
    ]),
    weight: z.number().min(0).max(100),
    maxScore: z.number().positive().default(10),
    order: z.number().int().min(0).default(0),
    isVisible: z.boolean().default(true),
    isEditable: z.boolean().default(true),
    isAutoCalculated: z.boolean().default(false),
    autoUpdate: z.boolean().default(true),
    attendanceScoreMethod: z
        .enum(["percentage", "count", "deduction", "weighted"])
        .optional()
        .nullable(),
    attendanceConfig: z.any().optional().nullable(),
    assignmentScoreMethod: z
        .enum(["average", "total", "weighted", "best", "latest"])
        .optional()
        .nullable(),
    assignmentConfig: z.any().optional().nullable(),
    description: z.string().optional().nullable(),
});

export const createTemplateSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(150),
        description: z.string().optional().nullable(),
        subjectCode: z.string().max(30).optional().nullable(),
        department: z.string().max(120).optional().nullable(),
        isPublic: z.boolean().default(false),
        columns: z.array(gradeColumnSchema).min(1),
        formula: z
            .object({
                formula: z.any(),
                gradeScale: z.any().optional(),
                passingScore: z.number().min(0).max(10).default(5.0),
            })
            .optional()
            .nullable(),
    }),
});

export const updateTemplateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(150).optional(),
        description: z.string().optional(),
        subjectCode: z.string().max(30).optional(),
        department: z.string().max(120).optional(),
        isPublic: z.boolean().optional(),
        columns: z.array(gradeColumnSchema).optional(),
        formula: z
            .object({
                formula: z.any(),
                gradeScale: z.any().optional(),
                passingScore: z.number().min(0).max(10).default(5.0),
            })
            .optional(),
    }),
});

export const getTemplateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const deleteTemplateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const applyTemplateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // templateId
    }),
    body: z.object({
        sectionId: z.number().int().positive(),
    }),
});
