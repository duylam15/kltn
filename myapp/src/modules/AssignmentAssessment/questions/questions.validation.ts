import { z } from "zod";

const questionChoiceSchema = z.object({
    content: z.string().min(1),
    isCorrect: z.boolean(),
    order: z.number().int().nonnegative().optional(),
});

// 🆕 Schema cho API lấy câu hỏi "mình + public"
export const getUserMineAndPublicSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).optional().default("1"),
        limit: z.string().regex(/^\d+$/).optional().default("20"),

        // Filter theo loại câu hỏi
        type: z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),

        // Filter theo môn học và chương
        subjectId: z.string().regex(/^\d+$/).optional(),
        chapterId: z.string().regex(/^\d+$/).optional(),

        // Filter theo độ khó
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),

        // Search theo nội dung
        search: z.string().optional(),
        q: z.string().optional(),
    }),
});

// 🔥 Schema linh hoạt hơn cho choice
const questionChoiceSchemaFlexible = z.object({
    content: z.string().min(1),
    isCorrect: z
        .preprocess((val) => {
            if (val === "true" || val === true) return true;
            if (val === "false" || val === false) return false;
            if (val === undefined) return false;
            return val;
        }, z.boolean())
        .default(false),
    order: z.number().int().nonnegative().optional(),
});

const testCaseSchema = z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().optional().default(false),
    points: z.number().int().nonnegative().optional().default(0),
    order: z.number().int().nonnegative().optional().default(0),
});

export const createQuestionSchema = z.object({
    body: z.object({
        type: z.enum(["multiple_choice", "essay", "coding", "true_false"]),
        content: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().int().positive().default(1),
        order: z.number().int().nonnegative().default(0),

        // 🆕 Thêm các field mới
        subjectId: z.number().int().positive().optional(),
        chapterId: z.number().int().positive().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        tags: z.string().max(500).optional(),
        createdBy: z.number().int().positive(),

        // Coding question fields
        language: z
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
        starterCode: z.string().optional(),
        timeLimit: z.number().int().positive().optional(),
        memoryLimit: z.number().int().positive().optional(),

        // Relations - Dùng schema flexible
        choices: z.array(questionChoiceSchemaFlexible).optional(),
        testCases: z.array(testCaseSchema).optional(),

        // 🆕 Public flag (mặc định false)
        isPublic: z.boolean().optional().default(false),
    }),
});

export const updateQuestionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        type: z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),
        content: z.string().min(1).optional(),
        explanation: z.string().optional(),
        points: z.number().int().positive().optional(),
        order: z.number().int().nonnegative().optional(),

        // 🆕 Thêm các field mới
        subjectId: z.number().int().positive().optional().nullable(),
        chapterId: z.number().int().positive().optional().nullable(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        tags: z.string().max(500).optional().nullable(),

        language: z
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
        starterCode: z.string().optional().nullable(),
        timeLimit: z.number().int().positive().optional().nullable(),
        memoryLimit: z.number().int().positive().optional().nullable(),

        choices: z.array(questionChoiceSchemaFlexible).optional(),
        testCases: z.array(testCaseSchema).optional(),

        // 🆕 Allow toggling public flag
        isPublic: z.boolean().optional(),
    }),
});

// 🆕 CẬP NHẬT: Thêm các filter query params
export const getAllQuestionsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional().default("1"),
        limit: z.string().regex(/^\d+$/).optional().default("20"),

        // Filter theo loại câu hỏi
        type: z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),

        // 🆕 Filter theo môn học và chương
        subjectId: z.string().regex(/^\d+$/).optional(),
        chapterId: z.string().regex(/^\d+$/).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),

        // Filter theo assignment
        assignmentId: z.string().regex(/^\d+$/).optional(),

        // Search theo nội dung
        search: z.string().optional(),
        q: z.string().optional(), // alias cho search
    }),
});

export const getQuestionByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const deleteQuestionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

// 🆕 Schema cho API lấy câu hỏi theo userId
export const getQuestionsByUserIdSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).optional().default("1"),
        limit: z.string().regex(/^\d+$/).optional().default("20"),

        // Filter theo loại câu hỏi
        type: z
            .enum(["multiple_choice", "essay", "coding", "true_false"])
            .optional(),

        // Filter theo môn học
        subjectId: z.string().regex(/^\d+$/).optional(),

        // Filter theo chương
        chapterId: z.string().regex(/^\d+$/).optional(),

        // Filter theo độ khó
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),

        // Search theo nội dung
        search: z.string().optional(),
        q: z.string().optional(),
    }),
});

// 🆕 Schema cho API lấy môn học của user
export const getUserSubjectsSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/),
    }),
});

// 🆕 Schema cho API lấy chương theo môn học của user
export const getUserChaptersBySubjectSchema = z.object({
    params: z.object({
        userId: z.string().regex(/^\d+$/),
        subjectId: z.string().regex(/^\d+$/),
    }),
});
