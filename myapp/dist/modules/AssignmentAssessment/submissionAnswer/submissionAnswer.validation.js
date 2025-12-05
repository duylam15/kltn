"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchema = exports.getByIdSchema = exports.getBySubmissionSchema = void 0;
const zod_1 = require("zod");
exports.getBySubmissionSchema = zod_1.z.object({
    params: zod_1.z.object({
        submissionId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.getByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "ID phải là số"),
    }),
    body: zod_1.z.object({
        answerText: zod_1.z.string().optional(),
        selectedChoices: zod_1.z.array(zod_1.z.number()).optional(),
        isCorrect: zod_1.z.boolean().optional(),
        score: zod_1.z
            .union([zod_1.z.number(), zod_1.z.string().regex(/^\d+(\.\d+)?$/)])
            .optional(),
        feedback: zod_1.z.string().optional(),
    }),
});
