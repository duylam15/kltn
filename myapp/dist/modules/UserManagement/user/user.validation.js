"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.userIdParamSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        name: zod_1.z.string().min(1).optional(),
    }),
});
exports.userIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
    }),
});
