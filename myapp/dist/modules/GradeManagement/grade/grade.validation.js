"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGradesSchema = exports.overrideGradeSchema = exports.addAssignmentsSchema = exports.addAttendanceSessionsSchema = exports.updateGradeColumnSchema = exports.createGradeColumnSchema = void 0;
const zod_1 = require("zod");
exports.createGradeColumnSchema = zod_1.z.object({
    sectionId: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1).max(200),
    type: zod_1.z.enum([
        "attendance",
        "assignment",
        "midterm",
        "final",
        "participation",
        "project",
        "custom",
    ]),
    description: zod_1.z.string().optional(),
    maxScore: zod_1.z.number().positive().default(100),
    weight: zod_1.z.number().min(0).max(100).optional(),
    calculationMethod: zod_1.z
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
    bestNCount: zod_1.z.number().int().positive().optional(),
    dropLowest: zod_1.z.number().int().min(0).default(0),
    isPublished: zod_1.z.boolean().default(false),
    displayOrder: zod_1.z.number().int().min(0).default(0),
});
exports.updateGradeColumnSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().optional(),
    maxScore: zod_1.z.number().positive().optional(),
    weight: zod_1.z.number().min(0).max(100).optional(),
    calculationMethod: zod_1.z
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
    bestNCount: zod_1.z.number().int().positive().optional(),
    dropLowest: zod_1.z.number().int().min(0).optional(),
    isPublished: zod_1.z.boolean().optional(),
    displayOrder: zod_1.z.number().int().min(0).optional(),
});
exports.addAttendanceSessionsSchema = zod_1.z.object({
    sessionIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1),
    weight: zod_1.z.number().positive().default(1),
});
exports.addAssignmentsSchema = zod_1.z.object({
    assignmentIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1),
    weight: zod_1.z.number().positive().default(1),
});
exports.overrideGradeSchema = zod_1.z.object({
    overriddenScore: zod_1.z.number().min(0),
    note: zod_1.z.string().optional(),
    overriddenBy: zod_1.z.number().int().positive().optional(),
});
exports.calculateGradesSchema = zod_1.z.object({
    studentIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
});
