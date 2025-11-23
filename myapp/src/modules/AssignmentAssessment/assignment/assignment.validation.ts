import { AssignmentType, ProgrammingLanguage, QuestionType } from "@prisma/client";
import { z } from "zod";

export const getAssignmentsBySectionForStudentSchema = z.object({
    params: z.object({
        sectionId: z.string().regex(/^\d+$/, "sectionId phải là số"),
        studentId: z.string().regex(/^\d+$/, "studentId phải là số"),
    }),
    query: z.object({
        type: z.nativeEnum(AssignmentType).optional(),
        status: z.enum(["all", "not_started", "in_progress", "completed", "overdue"]).optional().default("all"),
    }),
});

// Không yêu cầu params
export const publicSchema = z.object({
  params: z.object({}).optional(),
});




export const createAssignmentSchema = z.object({
    body: z.object({
        title: z.string().min(1, "Tiêu đề không được bỏ trống"),
        description: z.string().nullable().optional(),
        type: z.enum(["exercise", "quiz", "homework"]).default("exercise"),

        dueDate: z.string().datetime().nullable().optional(),
        maxScore: z.number().default(10),
        passingScore: z.number().nullable().optional(),
        timeLimit: z.number().nullable().optional(),
        maxAttempts: z.number().default(1),

        createdBy: z.coerce.number().int(),
        isPublic: z.boolean().optional(),
        originalAssignmentId: z.string().uuid().optional(),
        shuffleQuestions: z.boolean().default(false),
        showAnswersAfterSubmit: z.boolean().default(false),
        allowLateSubmission: z.boolean().default(false),

        // 🆕 Thêm hai trường phân loại
        subjectId: z.number().int().nullable().optional(),
        chapterId: z.number().int().nullable().optional(),
    }),
});


export const updateAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: createAssignmentSchema.shape.body.partial(),
});


// Xóa
export const deleteAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

// Lấy 1 assignment
export const getAssignmentByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

// Lấy danh sách assignment
export const listAssignmentsSchema = z.object({
    query: z.object({
        sectionId: z.string().regex(/^\d+$/).optional(),
        type: z.nativeEnum(AssignmentType).optional(),
        dueBefore: z.string().datetime().optional(),
    }),
});

// Submissions theo assignment
export const listSubmissionsByAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

// Student submit
export const submitAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        answers: z.array(
            z.object({
                questionId: z.number(),
                selectedChoices: z.array(z.number()).optional(),
                essayAnswer: z.string().optional(),
                codeAnswer: z.string().optional(),
                language: z.string().optional(),
            })
        ),
    }),
});


// Tạo câu hỏi
export const createQuestionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number), // assignmentId
    }),
    body: z.object({
        type: z.nativeEnum(QuestionType),
        content: z.string().min(1),
        explanation: z.string().optional(),
        points: z.number().positive().default(1),
        order: z.number().int().default(0),

        // multiple choice
        choices: z
            .array(
                z.object({
                    content: z.string(),
                    isCorrect: z.boolean(),
                    order: z.number().int().default(0),
                })
            )
            .optional(),

        // coding
        language: z.nativeEnum(ProgrammingLanguage).optional(),
        starterCode: z.string().optional(),
        timeLimit: z.number().int().optional(),
        memoryLimit: z.number().int().optional(),
        testCases: z
            .array(
                z.object({
                    input: z.string(),
                    expectedOutput: z.string(),
                    isHidden: z.boolean().default(false),
                    points: z.number().default(0),
                    order: z.number().int().default(0),
                })
            )
            .optional(),
    }),
});

// Update câu hỏi
export const updateQuestionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
    body: z.object({
        content: z.string().optional(),
        explanation: z.string().optional(),
        points: z.number().optional(),
        order: z.number().optional(),
        choices: z
            .array(
                z.object({
                    id: z.number().optional(),
                    content: z.string(),
                    isCorrect: z.boolean(),
                    order: z.number().int().default(0),
                })
            )
            .optional(),
        testCases: z
            .array(
                z.object({
                    id: z.number().optional(),
                    input: z.string(),
                    expectedOutput: z.string(),
                    isHidden: z.boolean().default(false),
                    points: z.number().default(0),
                    order: z.number().int().default(0),
                })
            )
            .optional(),
    }),
});

// Delete question
export const deleteQuestionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});

// Lấy danh sách question trong assignment
export const listQuestionsByAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});

// Lấy chi tiết 1 câu hỏi
export const getQuestionByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
    }),
});
