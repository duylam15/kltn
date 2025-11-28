"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSchema = exports.teacherIdParamSchema = exports.listTeacherQuerySchema = exports.createTeacherSchema = void 0;
const zod_1 = require("zod");
// POST /teachers
exports.createTeacherSchema = zod_1.z.object({
    body: zod_1.z.object({
        teacher_code: zod_1.z.string().min(3),
        password: zod_1.z.string().min(6),
        full_name: zod_1.z.string().min(3),
        email: zod_1.z.string().email().optional(),
        department: zod_1.z.string().optional(),
        position: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
    }),
});
// GET /teachers
exports.listTeacherQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        department: zod_1.z.string().optional(),
        position: zod_1.z.string().optional(),
        q: zod_1.z.string().optional(),
    }),
});
// GET /teachers/:id + DELETE /teachers/:id
exports.teacherIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "id must be a number"),
    }),
});
// PATCH /teachers/:id
exports.updateTeacherSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "id must be a number"),
    }),
    body: zod_1.z.object({
        department: zod_1.z.string().optional(),
        position: zod_1.z.string().optional(),
        specialization: zod_1.z.string().optional(),
    }),
});
