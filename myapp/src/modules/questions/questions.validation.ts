import { z } from "zod";
import { QuestionType, ProgrammingLanguage } from "@prisma/client";

// Tạo câu hỏi
// question.validation.ts
export const createQuestionSchema = z.object({
  body: z.object({
    type: z.enum(["multiple_choice", "coding", "essay", "true_false"]),
    content: z.string().min(1),
    explanation: z.string().optional(),
    points: z.number().int().min(1).default(1),
    order: z.number().int().default(0),
    language: z.string().optional(),
    starterCode: z.string().optional(),
    timeLimit: z.number().int().optional(),
    memoryLimit: z.number().int().optional(),
    choices: z
      .array(
        z.object({
          content: z.string(),
          isCorrect: z.boolean().default(false),
          order: z.number().int().default(0),
        })
      )
      .optional(),
    testCases: z
      .array(
        z.object({
          input: z.string(),
          expectedOutput: z.string(),
        })
      )
      .optional(),
  }),
});


export const getAllQuestionsSchema = z.object({
    query: z.object({
        type: z.nativeEnum(QuestionType).optional(),
        assignmentId: z.string().regex(/^\d+$/).transform(Number).optional(),
        search: z.string().optional(),
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
