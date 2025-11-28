"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewGeneratedQuestionsSchema = exports.generateAssignmentQuestionsSchema = void 0;
const zod_1 = require("zod");
// Schema cho quy tắc mỗi chương
const chapterRuleSchema = zod_1.z.object({
    chapterId: zod_1.z.number().int().positive(),
    easy: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
    medium: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
    hard: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
});
// Schema cho quy tắc cả môn (không chia chương)
const subjectRuleSchema = zod_1.z.object({
    easy: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
    medium: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
    hard: zod_1.z.object({
        count: zod_1.z.number().int().min(0),
        pointPerQuestion: zod_1.z.number().min(0),
    }),
});
exports.generateAssignmentQuestionsSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        assignmentId: zod_1.z.number().int().positive(),
        subjectId: zod_1.z.number().int().positive(),
        totalScore: zod_1.z.number().positive().default(10),
        // Option 1: Không chia chương
        subjectRule: subjectRuleSchema.optional(),
        // Option 2: Chia theo chương
        chapterRules: zod_1.z.array(chapterRuleSchema).optional(),
    })
        .refine((data) => {
        // Phải chọn 1 trong 2: subjectRule HOẶC chapterRules
        return ((data.subjectRule && !data.chapterRules) ||
            (!data.subjectRule &&
                data.chapterRules &&
                data.chapterRules.length > 0));
    }, {
        message: "Must provide either 'subjectRule' or 'chapterRules', not both",
    }),
});
exports.previewGeneratedQuestionsSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z.number().int().positive(),
        subjectRule: subjectRuleSchema.optional(),
        chapterRules: zod_1.z.array(chapterRuleSchema).optional(),
    }),
});
