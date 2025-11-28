"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markReadSchema = exports.listNotiSchema = void 0;
const zod_1 = require("zod");
exports.listNotiSchema = zod_1.z.object({
    query: zod_1.z.object({
        unread: zod_1.z.string().optional(), // 'true' | 'false'
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        cursor: zod_1.z.string().optional(),
    }),
});
exports.markReadSchema = zod_1.z.object({
    body: zod_1.z.object({
        ids: zod_1.z.array(zod_1.z.number()).optional(),
    }),
});
