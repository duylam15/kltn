import { z } from "zod";

export const listColumnsSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
    }),
});

export const createColumnSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
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
        order: z.number().int().min(0).optional(),
        isVisible: z.boolean().default(true),
        isEditable: z.boolean().default(true),
        isAutoCalculated: z.boolean().default(false),
        autoUpdate: z.boolean().default(true),
        attendanceScoreMethod: z
            .enum(["percentage", "count", "deduction", "weighted"])
            .optional(),
        attendanceConfig: z.any().optional(),
        assignmentScoreMethod: z
            .enum(["average", "total", "weighted", "best", "latest"])
            .optional(),
        assignmentConfig: z.any().optional(),
        description: z.string().optional(),
    }),
});

export const updateColumnSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        type: z
            .enum([
                "attendance",
                "assignment",
                "quiz",
                "midterm",
                "final",
                "project",
                "participation",
                "custom",
            ])
            .optional(),
        weight: z.number().min(0).max(100).optional(),
        maxScore: z.number().positive().optional(),
        order: z.number().int().min(0).optional(),
        isVisible: z.boolean().optional(),
        isEditable: z.boolean().optional(),
        isAutoCalculated: z.boolean().optional(),
        autoUpdate: z.boolean().optional(),
        attendanceScoreMethod: z
            .enum(["percentage", "count", "deduction", "weighted"])
            .optional(),
        attendanceConfig: z.any().optional(),
        assignmentScoreMethod: z
            .enum(["average", "total", "weighted", "best", "latest"])
            .optional(),
        assignmentConfig: z.any().optional(),
        description: z.string().optional(),
    }),
});

export const deleteColumnSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const assignAttendanceSessionsSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        sessionIds: z.array(
            z.object({
                sessionId: z.number().int().positive(),
                weight: z.number().positive().default(1),
                isRequired: z.boolean().default(true),
                order: z.number().int().min(0).optional(),
            })
        ),
    }),
});

export const assignAssignmentsSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        assignmentIds: z.array(
            z.object({
                assignmentId: z.number().int().positive(),
                weight: z.number().positive().default(1),
                isRequired: z.boolean().default(true),
                isExtraCredit: z.boolean().default(false),
                order: z.number().int().min(0).optional(),
            })
        ),
    }),
});

export const recalculateSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
