"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalculateSchema = exports.assignAssignmentsSchema = exports.assignAttendanceSessionsSchema = exports.deleteColumnSchema = exports.updateColumnSchema = exports.createColumnSchema = exports.listColumnsSchema = void 0;
const zod_1 = require("zod");
exports.listColumnsSchema = zod_1.z.object({
    params: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.createColumnSchema = zod_1.z.object({
    params: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        type: zod_1.z.enum([
            "attendance",
            "assignment",
            "quiz",
            "midterm",
            "final",
            "project",
            "participation",
            "custom",
        ]),
        weight: zod_1.z.number().min(0).max(100),
        maxScore: zod_1.z.number().positive().default(10),
        order: zod_1.z.number().int().min(0).optional(),
        isVisible: zod_1.z.boolean().default(true),
        isEditable: zod_1.z.boolean().default(true),
        isAutoCalculated: zod_1.z.boolean().default(false),
        autoUpdate: zod_1.z.boolean().default(true),
        attendanceScoreMethod: zod_1.z
            .enum(["percentage", "count", "deduction", "weighted"])
            .optional(),
        attendanceConfig: zod_1.z.any().optional(),
        assignmentScoreMethod: zod_1.z
            .enum(["average", "total", "weighted", "best", "latest"])
            .optional(),
        assignmentConfig: zod_1.z.any().optional(),
        description: zod_1.z.string().optional(),
    }),
});
exports.updateColumnSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        type: zod_1.z
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
        weight: zod_1.z.number().min(0).max(100).optional(),
        maxScore: zod_1.z.number().positive().optional(),
        order: zod_1.z.number().int().min(0).optional(),
        isVisible: zod_1.z.boolean().optional(),
        isEditable: zod_1.z.boolean().optional(),
        isAutoCalculated: zod_1.z.boolean().optional(),
        autoUpdate: zod_1.z.boolean().optional(),
        attendanceScoreMethod: zod_1.z
            .enum(["percentage", "count", "deduction", "weighted"])
            .optional(),
        attendanceConfig: zod_1.z.any().optional(),
        assignmentScoreMethod: zod_1.z
            .enum(["average", "total", "weighted", "best", "latest"])
            .optional(),
        assignmentConfig: zod_1.z.any().optional(),
        description: zod_1.z.string().optional(),
    }),
});
exports.deleteColumnSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.assignAttendanceSessionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        sessionIds: zod_1.z.array(zod_1.z.object({
            sessionId: zod_1.z.number().int().positive(),
            weight: zod_1.z.number().positive().default(1),
            isRequired: zod_1.z.boolean().default(true),
            order: zod_1.z.number().int().min(0).optional(),
        })),
    }),
});
exports.assignAssignmentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        assignmentIds: zod_1.z.array(zod_1.z.object({
            assignmentId: zod_1.z.number().int().positive(),
            weight: zod_1.z.number().positive().default(1),
            isRequired: zod_1.z.boolean().default(true),
            isExtraCredit: zod_1.z.boolean().default(false),
            order: zod_1.z.number().int().min(0).optional(),
        })),
    }),
});
exports.recalculateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
