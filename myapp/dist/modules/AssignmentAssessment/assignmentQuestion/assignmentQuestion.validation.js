"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionIdParam = exports.assignmentIdParam = exports.assignmentQuestionParams = void 0;
const zod_1 = require("zod");
exports.assignmentQuestionParams = zod_1.z.object({
    params: zod_1.z.object({
        assignmentId: zod_1.z.string().regex(/^\d+$/).transform(Number),
        questionId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
exports.assignmentIdParam = zod_1.z.object({
    params: zod_1.z.object({
        assignmentId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
exports.questionIdParam = zod_1.z.object({
    params: zod_1.z.object({
        questionId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
