import { z } from "zod";

export const getHistorySchema = z.object({
    params: z.object({
        assignmentId: z.string().regex(/^\d+$/),
        studentId: z.string().regex(/^\d+$/),
    }),
});

export const getByIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // submissionId
    }),
});

export const selectFinalSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // submissionId
    }),
});


export const updateScoreSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "ID phải là số"), // submissionId
    }),
    body: z.object({
        score: z
            .union([
                z.number(),
                z.string().regex(/^\d+(\.\d+)?$/), // cho phép gửi dạng string số
            ])
            .optional(),
        feedback: z.string().optional(),
    }),
});
