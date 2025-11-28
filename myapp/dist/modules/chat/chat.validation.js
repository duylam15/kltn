"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatRoomByContextSchema = exports.updateChatRoomSchema = exports.createChatRoomSchema = void 0;
const zod_1 = require("zod");
exports.createChatRoomSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().max(200).optional(),
        type: zod_1.z.enum(["private", "section", "group", "assignment"]),
        sectionId: zod_1.z.number().optional(),
        assignmentId: zod_1.z.number().optional(),
        groupId: zod_1.z.number().optional(),
    }),
});
exports.updateChatRoomSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().max(200).optional(),
    }),
});
// Thêm vào cuối file chat.validation.ts
exports.getChatRoomByContextSchema = zod_1.z.object({
    query: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/).optional(),
        groupId: zod_1.z.string().regex(/^\d+$/).optional(),
        assignmentId: zod_1.z.string().regex(/^\d+$/).optional(),
    }).refine((data) => {
        const count = [data.sectionId, data.groupId, data.assignmentId].filter(Boolean).length;
        return count === 1;
    }, { message: "Phải có đúng 1 trong 3: sectionId, groupId, hoặc assignmentId" }),
});
