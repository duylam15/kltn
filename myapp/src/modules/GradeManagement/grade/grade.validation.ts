import { z } from "zod";

export const createGradeColumnSchema = z.object({
    sectionId: z.number().int().positive(),
    name: z.string().min(1).max(200),
    type: z.enum([
        "attendance",
        "assignment",
        "midterm",
        "final",
        "participation",
        "project",
        "custom",
    ]),
    description: z.string().optional(),
    maxScore: z.number().positive().default(100),
    weight: z.number().min(0).max(100).optional(),
    calculationMethod: z
        .enum([
            "average",
            "weighted_average",
            "sum",
            "best_n",
            "latest",
            "highest",
            "percentage",
        ])
        .default("average"),
    bestNCount: z.number().int().positive().optional(),
    dropLowest: z.number().int().min(0).default(0),
    isPublished: z.boolean().default(false),
    displayOrder: z.number().int().min(0).default(0),
});

export const updateGradeColumnSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    maxScore: z.number().positive().optional(),
    weight: z.number().min(0).max(100).optional(),
    calculationMethod: z
        .enum([
            "average",
            "weighted_average",
            "sum",
            "best_n",
            "latest",
            "highest",
            "percentage",
        ])
        .optional(),
    bestNCount: z.number().int().positive().optional(),
    dropLowest: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
});

export const addAttendanceSessionsSchema = z.object({
    sessionIds: z.array(z.number().int().positive()).min(1),
    weight: z.number().positive().default(1),
});

export const addAssignmentsSchema = z.object({
    assignmentIds: z.array(z.number().int().positive()).min(1),
    weight: z.number().positive().default(1),
});

export const overrideGradeSchema = z.object({
    overriddenScore: z.number().min(0),
    note: z.string().optional(),
    overriddenBy: z.number().int().positive().optional(),
});

export const calculateGradesSchema = z.object({
    studentIds: z.array(z.number().int().positive()).optional(),
});
