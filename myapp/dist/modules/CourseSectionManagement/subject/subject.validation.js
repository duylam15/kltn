"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubjectSchema = exports.subjectIdParamSchema = exports.listSubjectQuerySchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
exports.createSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject_code: zod_1.z.string().min(1).max(30),
        subject_name: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().min(1).max(500).optional(),
        credits: zod_1.z.number().int().positive().optional(),
    }),
});
exports.listSubjectQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.subjectIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateSubjectSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        subject_code: zod_1.z.string().min(1).max(30).optional(),
        subject_name: zod_1.z.string().min(1).max(200).optional(),
        credits: zod_1.z.number().int().positive().optional(),
    }),
});
