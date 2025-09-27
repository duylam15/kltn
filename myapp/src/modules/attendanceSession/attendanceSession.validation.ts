import { z } from "zod";

export const createSessionSchema = z.object({
    sectionId: z.number(),
    expiresAt: z.string().datetime().optional(),
});
