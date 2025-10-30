import { z } from "zod";

export const getBySubmissionSchema = z.object({
    params: z.object({
        submissionId: z.string().regex(/^\d+$/),
    }),
});
