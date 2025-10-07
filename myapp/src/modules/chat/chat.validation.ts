import { z } from "zod";

export const createChatRoomSchema = z.object({
    body: z.object({
        title: z.string().max(200).optional(),
        type: z.enum(["private", "section", "group", "assignment"]),
        sectionId: z.number().optional(),
        assignmentId: z.number().optional(),
        groupId: z.number().optional(),
    }),
});

export const updateChatRoomSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        title: z.string().max(200).optional(),
    }),
});
