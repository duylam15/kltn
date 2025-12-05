"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionByIdSchema = exports.listQuestionsByAssignmentSchema = exports.deleteQuestionSchema = exports.updateQuestionSchema = exports.createQuestionSchema = exports.submitAssignmentSchema = exports.listSubmissionsByAssignmentSchema = exports.listAssignmentsSchema = exports.getAssignmentByIdSchema = exports.deleteAssignmentSchema = exports.updateAssignmentSchema = exports.createAssignmentSchema = exports.getAssignmentsBySectionForStudentSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.getAssignmentsBySectionForStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/, "sectionId phải là số"),
        studentId: zod_1.z.string().regex(/^\d+$/, "studentId phải là số"),
    }),
    query: zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.AssignmentType).optional(),
        status: zod_1.z.enum(["all", "not_started", "in_progress", "completed", "overdue"]).optional().default("all"),
    }),
});
exports.createAssignmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Tiêu đề không được bỏ trống"),
        description: zod_1.z.string().nullable().optional(),
        type: zod_1.z.enum(["exercise", "quiz", "homework"]).default("exercise"),
        dueDate: zod_1.z.string().datetime().nullable().optional(),
        maxScore: zod_1.z.number().default(10),
        passingScore: zod_1.z.number().nullable().optional(),
        timeLimit: zod_1.z.number().nullable().optional(),
        maxAttempts: zod_1.z.number().default(1),
        subjectId: zod_1.z.coerce.number().int().nullable().optional(),
        chapterId: zod_1.z.coerce.number().int().nullable().optional(),
        difficulty: zod_1.z.enum(["REMEDIAL", "NORMAL", "ADVANCED"]).default("NORMAL"),
        createdBy: zod_1.z.coerce.number().int(),
        isPublic: zod_1.z.boolean().optional(),
        originalAssignmentId: zod_1.z.string().uuid().optional(), // 👈 đổi sang string
        shuffleQuestions: zod_1.z.boolean().default(false),
        showAnswersAfterSubmit: zod_1.z.boolean().default(false),
        allowLateSubmission: zod_1.z.boolean().default(false),
    }),
});
exports.updateAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: exports.createAssignmentSchema.shape.body.partial(),
});
// Xóa
exports.deleteAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
// Lấy 1 assignment
exports.getAssignmentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
// Lấy danh sách assignment
exports.listAssignmentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/).optional(),
        type: zod_1.z.nativeEnum(client_1.AssignmentType).optional(),
        dueBefore: zod_1.z.string().datetime().optional(),
    }),
});
// Submissions theo assignment
exports.listSubmissionsByAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
// Student submit
exports.submitAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        answers: zod_1.z.array(zod_1.z.object({
            questionId: zod_1.z.number(),
            selectedChoices: zod_1.z.array(zod_1.z.number()).optional(),
            essayAnswer: zod_1.z.string().optional(),
            codeAnswer: zod_1.z.string().optional(),
            language: zod_1.z.string().optional(),
        })),
    }),
});
// Tạo câu hỏi
exports.createQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number), // assignmentId
    }),
    body: zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.QuestionType),
        content: zod_1.z.string().min(1),
        explanation: zod_1.z.string().optional(),
        points: zod_1.z.number().positive().default(1),
        order: zod_1.z.number().int().default(0),
        // multiple choice
        choices: zod_1.z
            .array(zod_1.z.object({
            content: zod_1.z.string(),
            isCorrect: zod_1.z.boolean(),
            order: zod_1.z.number().int().default(0),
        }))
            .optional(),
        // coding
        language: zod_1.z.nativeEnum(client_1.ProgrammingLanguage).optional(),
        starterCode: zod_1.z.string().optional(),
        timeLimit: zod_1.z.number().int().optional(),
        memoryLimit: zod_1.z.number().int().optional(),
        testCases: zod_1.z
            .array(zod_1.z.object({
            input: zod_1.z.string(),
            expectedOutput: zod_1.z.string(),
            isHidden: zod_1.z.boolean().default(false),
            points: zod_1.z.number().default(0),
            order: zod_1.z.number().int().default(0),
        }))
            .optional(),
    }),
});
// Update câu hỏi
exports.updateQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().optional(),
        explanation: zod_1.z.string().optional(),
        points: zod_1.z.number().optional(),
        order: zod_1.z.number().optional(),
        choices: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.number().optional(),
            content: zod_1.z.string(),
            isCorrect: zod_1.z.boolean(),
            order: zod_1.z.number().int().default(0),
        }))
            .optional(),
        testCases: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.number().optional(),
            input: zod_1.z.string(),
            expectedOutput: zod_1.z.string(),
            isHidden: zod_1.z.boolean().default(false),
            points: zod_1.z.number().default(0),
            order: zod_1.z.number().int().default(0),
        }))
            .optional(),
    }),
});
// Delete question
exports.deleteQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
// Lấy danh sách question trong assignment
exports.listQuestionsByAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
// Lấy chi tiết 1 câu hỏi
exports.getQuestionByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
