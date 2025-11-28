"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleIdParamSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(50),
        description: zod_1.z.string().max(200).optional(),
        permissions: zod_1.z.any().optional(), // có thể là mảng string hoặc object JSON
    }),
});
exports.updateRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // role id dạng số
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(50).optional(),
        description: zod_1.z.string().max(200).optional(),
        permissions: zod_1.z.any().optional(),
    }),
});
exports.roleIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
