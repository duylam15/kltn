import { z } from "zod";

// grade-column.validation.ts

export const createGradeColumnSchema = z.object({
    body: z
        .object({
            section_id: z.number().int().positive(),
            name: z.string().min(1).max(100),
            type: z.enum(["attendance_final", "project", "process"]),

            // method để optional, không xử lý transform ở đây
            method: z
                .enum([
                    "manual",
                    "auto_sum",
                    "auto_average",
                    "weighted_average",
                ])
                .optional(),

            max_score: z.number().positive().default(10),
            weight: z.number().min(0).max(1).optional().default(0.5),
            display_order: z.number().int().default(0),
            is_active: z.boolean().default(true),

            attendance_sessions: z
                .array(
                    z.object({
                        attendance_session_id: z.number().int().positive(),
                        weight: z.number().positive().default(1),
                        max_score: z.number().positive().optional(),
                    })
                )
                .optional(),

            assignments: z
                .array(
                    z.object({
                        assignment_id: z.number().int().positive(),
                        weight: z.number().positive().default(1),
                        max_score: z.number().positive().optional(),
                    })
                )
                .optional(),

            dependencies: z
                .array(
                    z.object({
                        source_column_id: z.number().int().positive(),
                        weight: z.number().positive(),
                    })
                )
                .optional(),
        })
        .superRefine((data, ctx) => {
            // 1️⃣ type = process → auto set method
            if (data.type === "process") {
                data.method = "weighted_average";
            }

            // 2️⃣ type ≠ process → method bắt buộc
            if (data.type !== "process" && !data.method) {
                ctx.addIssue({
                    path: ["method"],
                    code: z.ZodIssueCode.custom,
                    message: "Method is required for this column type",
                });
            }

            // 3️⃣ Logic riêng cho attendance_final + weighted_average
            if (
                data.type === "attendance_final" &&
                data.method === "weighted_average"
            ) {
                const valid =
                    (data.attendance_sessions?.length ?? 0) > 0 &&
                    (data.assignments?.length ?? 0) > 0;

                if (!valid) {
                    ctx.addIssue({
                        path: ["attendance_sessions"],
                        code: z.ZodIssueCode.custom,
                        message:
                            "Weighted average for attendance_final requires both attendance sessions and assignments",
                    });
                }
            }
        }),
});



export const listGradeColumnQuerySchema = z.object({
    query: z.object({
        section_id: z.string().regex(/^\d+$/),
        type: z.enum(["attendance_final", "project", "process"]).optional(),
        is_active: z.enum(["true", "false"]).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
    }),
});

export const gradeColumnIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const updateGradeColumnSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        method: z
            .enum(["manual", "auto_sum", "auto_average", "weighted_average"])
            .optional(),
        max_score: z.number().positive().optional(),
        weight: z.number().min(0).max(1).optional(),
        display_order: z.number().int().optional(),
        is_active: z.boolean().optional(),

        attendance_sessions: z
            .array(
                z.object({
                    attendance_session_id: z.number().int().positive(),
                    weight: z.number().positive().default(1),
                    max_score: z.number().positive().optional(),
                })
            )
            .optional(),

        assignments: z
            .array(
                z.object({
                    assignment_id: z.number().int().positive(),
                    weight: z.number().positive().default(1),
                    max_score: z.number().positive().optional(),
                })
            )
            .optional(),

        dependencies: z
            .array(
                z.object({
                    source_column_id: z.number().int().positive(),
                    weight: z.number().positive(),
                })
            )
            .optional(),
    }),
});

export const bulkCreateGradeColumnsSchema = z.object({
    body: z.object({
        section_id: z.number().int().positive(),
        template: z.enum(["standard", "custom"]).default("standard"),
        columns: z
            .array(
                z.object({
                    name: z.string(),
                    type: z.enum(["attendance_final", "project", "process"]),
                    method: z.enum([
                        "manual",
                        "auto_sum",
                        "auto_average",
                        "weighted_average",
                    ]),
                    weight: z.number().min(0).max(1).optional(),
                    display_order: z.number().int().optional(),
                })
            )
            .optional(),
    }),
});
