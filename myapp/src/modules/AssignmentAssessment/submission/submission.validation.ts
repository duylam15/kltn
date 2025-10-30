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
