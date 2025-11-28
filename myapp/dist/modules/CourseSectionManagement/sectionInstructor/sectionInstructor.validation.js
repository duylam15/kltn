"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionInstructorSchema = exports.sectionInstructorParamSchema = exports.listSectionInstructorQuerySchema = exports.createSectionInstructorSchema = void 0;
const zod_1 = require("zod");
exports.createSectionInstructorSchema = zod_1.z.object({
    body: zod_1.z.object({
        section_id: zod_1.z.number().int().positive(),
        teacher_id: zod_1.z.number().int().positive(),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional(),
    }),
});
exports.listSectionInstructorQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        section_id: zod_1.z.string().regex(/^\d+$/).optional(),
        teacher_id: zod_1.z.string().regex(/^\d+$/).optional(),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional(),
    }),
});
exports.sectionInstructorParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/),
        teacherId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateSectionInstructorSchema = zod_1.z.object({
    params: zod_1.z.object({
        sectionId: zod_1.z.string().regex(/^\d+$/),
        teacherId: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        role: zod_1.z.enum(["owner", "co", "ta"]).optional(),
    }),
});
