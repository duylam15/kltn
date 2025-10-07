import { z } from "zod";

export const assignSchema = z.object({
    body: z.object({
        assignmentId: z.number().int().positive(),
    }),
    params: z.object({
        id: z.string().regex(/^\d+$/), // sectionId
    }),
});

export const unassignSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/), // sectionId
        assignmentId: z.string().regex(/^\d+$/),
    }),
});

export const listBySectionSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

export const listByAssignmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});
