import { z } from "zod";

// Schema cho quy tắc mỗi chương
const chapterRuleSchema = z.object({
    chapterId: z.number().int().positive(),
    easy: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
    medium: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
    hard: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
});

// Schema cho quy tắc cả môn (không chia chương)
const subjectRuleSchema = z.object({
    easy: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
    medium: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
    hard: z.object({
        count: z.number().int().min(0),
        pointPerQuestion: z.number().min(0),
    }),
});

export const generateAssignmentQuestionsSchema = z.object({
    body: z
        .object({
            assignmentId: z.number().int().positive(),
            subjectId: z.number().int().positive(),
            totalScore: z.number().positive().default(10),

            // Option 1: Không chia chương
            subjectRule: subjectRuleSchema.optional(),

            // Option 2: Chia theo chương
            chapterRules: z.array(chapterRuleSchema).optional(),
        })
        .refine(
            (data) => {
                // Phải chọn 1 trong 2: subjectRule HOẶC chapterRules
                return (
                    (data.subjectRule && !data.chapterRules) ||
                    (!data.subjectRule &&
                        data.chapterRules &&
                        data.chapterRules.length > 0)
                );
            },
            {
                message:
                    "Must provide either 'subjectRule' or 'chapterRules', not both",
            }
        ),
});

export const previewGeneratedQuestionsSchema = z.object({
    body: z.object({
        subjectId: z.number().int().positive(),

        subjectRule: subjectRuleSchema.optional(),
        chapterRules: z.array(chapterRuleSchema).optional(),
    }),
});
