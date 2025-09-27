import { z } from "zod";

export const checkInSchema = z.object({
    sessionCode: z.string(),
    studentId: z.number(),
    location: z.string().optional(),
    ipAddress: z.string().optional(),
});
