"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTestCaseQuerySchema = exports.testCaseIdParamSchema = exports.updateTestCaseSchema = exports.createTestCaseSchema = void 0;
const zod_1 = require("zod");
exports.createTestCaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        questionId: zod_1.z.number().int(),
        input: zod_1.z.string().min(1),
        expectedOutput: zod_1.z.string().min(1),
        isHidden: zod_1.z.boolean().optional(),
        points: zod_1.z.number().int().optional(),
        order: zod_1.z.number().int().optional(),
    }),
});
exports.updateTestCaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        input: zod_1.z.string().min(1).optional(),
        expectedOutput: zod_1.z.string().min(1).optional(),
        isHidden: zod_1.z.boolean().optional(),
        points: zod_1.z.number().int().optional(),
        order: zod_1.z.number().int().optional(),
    }),
});
exports.testCaseIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
exports.listTestCaseQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        questionId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
