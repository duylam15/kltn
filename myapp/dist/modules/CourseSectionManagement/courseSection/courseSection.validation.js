"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseSectionSchema = exports.courseSectionIdParamSchema = exports.listCourseSectionQuerySchema = exports.createCourseSectionSchema = void 0;
const zod_1 = require("zod");
exports.createCourseSectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject_id: zod_1.z.number().int().positive(),
        term_id: zod_1.z.number().int().positive(),
        section_code: zod_1.z.string().min(1).max(40),
        schedule: zod_1.z.any().optional(),
        max_students: zod_1.z.any().optional(),
        status: zod_1.z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
    }),
});
exports.listCourseSectionQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        status: zod_1.z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
        subject_id: zod_1.z.string().regex(/^\d+$/).optional(),
        term_id: zod_1.z.string().regex(/^\d+$/).optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.courseSectionIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateCourseSectionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        schedule: zod_1.z.any().optional(),
        max_students: zod_1.z.number().int().positive().optional(),
        current_students: zod_1.z.number().int().min(0).optional(),
        status: zod_1.z
            .enum(["planned", "ongoing", "completed", "cancelled"])
            .optional(),
    }),
});
