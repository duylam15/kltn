"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchema = exports.updateSchema = exports.createSchema = exports.getBestSchema = exports.getByIdSchema = exports.getHistorySchema = void 0;
const zod_1 = require("zod");
exports.getHistorySchema = zod_1.z.object({
    params: zod_1.z.object({
        assignmentId: zod_1.z.string().regex(/^\d+$/),
        studentId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.getByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // submissionId
    }),
});
exports.getBestSchema = zod_1.z.object({
    params: zod_1.z.object({
        assignmentId: zod_1.z.string().regex(/^\d+$/),
        studentId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.createSchema = zod_1.z.object({
    body: zod_1.z.object({
        assignmentId: zod_1.z.number(),
        studentId: zod_1.z.number(),
        filePath: zod_1.z.string().optional(),
        answerText: zod_1.z.string().optional(),
        attempt: zod_1.z.number().optional(),
    }),
});
exports.updateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        score: zod_1.z.number().optional(),
        maxScore: zod_1.z.number().optional(),
        feedback: zod_1.z.string().optional(),
        autoGraded: zod_1.z.boolean().optional(),
    }),
});
exports.deleteSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
