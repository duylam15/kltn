"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChoiceSchema = exports.deleteChoiceSchema = exports.updateChoiceSchema = exports.createChoiceSchema = void 0;
const zod_1 = require("zod");
exports.createChoiceSchema = zod_1.z.object({
    params: zod_1.z.object({
        questionId: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().min(1),
        isCorrect: zod_1.z.boolean().default(false),
        order: zod_1.z.number().int().default(0),
    }),
});
exports.updateChoiceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // choiceId
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        isCorrect: zod_1.z.boolean().optional(),
        order: zod_1.z.number().int().optional(),
    }),
});
exports.deleteChoiceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // choiceId
    }),
});
exports.getChoiceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
