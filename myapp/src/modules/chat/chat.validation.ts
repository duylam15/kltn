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

// Thêm vào cuối file chat.validation.ts
export const getChatRoomByContextSchema = z.object({
    query: z.object({
        sectionId: z.string().regex(/^\d+$/).optional(),
        groupId: z.string().regex(/^\d+$/).optional(),
        assignmentId: z.string().regex(/^\d+$/).optional(),
    }).refine(
        (data) => {
            const count = [data.sectionId, data.groupId, data.assignmentId].filter(Boolean).length;
            return count === 1;
        },
        { message: "Phải có đúng 1 trong 3: sectionId, groupId, hoặc assignmentId" }
    ),
});