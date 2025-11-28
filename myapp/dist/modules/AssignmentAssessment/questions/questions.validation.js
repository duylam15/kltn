"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChaptersBySubjectSchema = exports.getUserSubjectsSchema = exports.getQuestionsByUserIdSchema = exports.deleteQuestionSchema = exports.getQuestionByIdSchema = exports.getAllQuestionsSchema = exports.updateQuestionSchema = exports.createQuestionSchema = exports.getUserMineAndPublicSchema = void 0;
const zod_1 = require("zod");
const questionChoiceSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    isCorrect: zod_1.z.boolean(),
    order: zod_1.z.number().int().nonnegative().optional(),
});
// 🆕 Schema cho API lấy câu hỏi "mình + public"
exports.getUserMineAndPublicSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().regex(/^\d+$/),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional().default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default("20"),
        // Filter theo loại câu hỏi
        type: zod_1.z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),
        // Filter theo môn học và chương
        subjectId: zod_1.z.string().regex(/^\d+$/).optional(),
        chapterId: zod_1.z.string().regex(/^\d+$/).optional(),
        // Filter theo độ khó
        difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
        // Search theo nội dung
        search: zod_1.z.string().optional(),
        q: zod_1.z.string().optional(),
    }),
});
// 🔥 Schema linh hoạt hơn cho choice
const questionChoiceSchemaFlexible = zod_1.z.object({
    content: zod_1.z.string().min(1),
    isCorrect: zod_1.z
        .preprocess((val) => {
        if (val === "true" || val === true)
            return true;
        if (val === "false" || val === false)
            return false;
        if (val === undefined)
            return false;
        return val;
    }, zod_1.z.boolean())
        .default(false),
    order: zod_1.z.number().int().nonnegative().optional(),
});
const testCaseSchema = zod_1.z.object({
    input: zod_1.z.string(),
    expectedOutput: zod_1.z.string(),
    isHidden: zod_1.z.boolean().optional().default(false),
    points: zod_1.z.number().int().nonnegative().optional().default(0),
    order: zod_1.z.number().int().nonnegative().optional().default(0),
});
exports.createQuestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(["multiple_choice", "essay", "coding", "true_false"]),
        content: zod_1.z.string().min(1),
        explanation: zod_1.z.string().optional(),
        points: zod_1.z.number().int().positive().default(1),
        order: zod_1.z.number().int().nonnegative().default(0),
        // 🆕 Thêm các field mới
        subjectId: zod_1.z.number().int().positive().optional(),
        chapterId: zod_1.z.number().int().positive().optional(),
        difficulty: zod_1.z.enum(["easy", "medium", "hard"]).default("medium"),
        tags: zod_1.z.string().max(500).optional(),
        createdBy: zod_1.z.number().int().positive(),
        // Coding question fields
        language: zod_1.z
            .enum([
            "javascript",
            "python",
            "java",
            "cpp",
            "csharp",
            "php",
            "html",
            "css",
        ])
            .optional(),
        starterCode: zod_1.z.string().optional(),
        timeLimit: zod_1.z.number().int().positive().optional(),
        memoryLimit: zod_1.z.number().int().positive().optional(),
        // Relations - Dùng schema flexible
        choices: zod_1.z.array(questionChoiceSchemaFlexible).optional(),
        testCases: zod_1.z.array(testCaseSchema).optional(),
        // 🆕 Public flag (mặc định false)
        isPublic: zod_1.z.boolean().optional().default(false),
    }),
});
exports.updateQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        type: zod_1.z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),
        content: zod_1.z.string().min(1).optional(),
        explanation: zod_1.z.string().optional(),
        points: zod_1.z.number().int().positive().optional(),
        order: zod_1.z.number().int().nonnegative().optional(),
        // 🆕 Thêm các field mới
        subjectId: zod_1.z.number().int().positive().optional().nullable(),
        chapterId: zod_1.z.number().int().positive().optional().nullable(),
        difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
        tags: zod_1.z.string().max(500).optional().nullable(),
        language: zod_1.z
            .enum([
            "javascript",
            "python",
            "java",
            "cpp",
            "csharp",
            "php",
            "html",
            "css",
        ])
            .optional()
            .nullable(),
        starterCode: zod_1.z.string().optional().nullable(),
        timeLimit: zod_1.z.number().int().positive().optional().nullable(),
        memoryLimit: zod_1.z.number().int().positive().optional().nullable(),
        choices: zod_1.z.array(questionChoiceSchemaFlexible).optional(),
        testCases: zod_1.z.array(testCaseSchema).optional(),
        // 🆕 Allow toggling public flag
        isPublic: zod_1.z.boolean().optional(),
    }),
});
// 🆕 CẬP NHẬT: Thêm các filter query params
exports.getAllQuestionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional().default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default("20"),
        // Filter theo loại câu hỏi
        type: zod_1.z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),
        // 🆕 Filter theo môn học và chương
        subjectId: zod_1.z.string().regex(/^\d+$/).optional(),
        chapterId: zod_1.z.string().regex(/^\d+$/).optional(),
        difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
        // Filter theo assignment
        assignmentId: zod_1.z.string().regex(/^\d+$/).optional(),
        // Search theo nội dung
        search: zod_1.z.string().optional(),
        q: zod_1.z.string().optional(), // alias cho search
    }),
});
exports.getQuestionByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.deleteQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
// 🆕 Schema cho API lấy câu hỏi theo userId
exports.getQuestionsByUserIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().regex(/^\d+$/),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional().default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).optional().default("20"),
        // Filter theo loại câu hỏi
        type: zod_1.z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),
        // Filter theo môn học
        subjectId: zod_1.z.string().regex(/^\d+$/).optional(),
        // Filter theo chương
        chapterId: zod_1.z.string().regex(/^\d+$/).optional(),
        // Filter theo độ khó
        difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
        // Search theo nội dung
        search: zod_1.z.string().optional(),
        q: zod_1.z.string().optional(),
    }),
});
// 🆕 Schema cho API lấy môn học của user
exports.getUserSubjectsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().regex(/^\d+$/),
    }),
});
// 🆕 Schema cho API lấy chương theo môn học của user
exports.getUserChaptersBySubjectSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().regex(/^\d+$/),
        subjectId: zod_1.z.string().regex(/^\d+$/),
    }),
});
