"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentSchema = exports.studentIdParamSchema = exports.listStudentQuerySchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    body: zod_1.z.object({
        student_code: zod_1.z.string().min(3),
        class_name: zod_1.z.string().optional(),
        major: zod_1.z.string().optional(),
        academic_year: zod_1.z.string().optional(),
        enrollment_year: zod_1.z.number().int().optional(),
    }),
});
exports.listStudentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        status: zod_1.z.string().optional(),
        class_name: zod_1.z.string().optional(),
        major: zod_1.z.string().optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.studentIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateStudentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        class_name: zod_1.z.string().optional(),
        major: zod_1.z.string().optional(),
        academic_year: zod_1.z.string().optional(),
        enrollment_year: zod_1.z.number().int().optional(),
        gpa: zod_1.z.number().min(0).max(10).optional(),
        status: zod_1.z
            .enum(["active", "suspended", "graduated", "dropped"])
            .optional(),
    }),
});
