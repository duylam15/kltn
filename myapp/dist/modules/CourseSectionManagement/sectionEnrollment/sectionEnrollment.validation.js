"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionEnrollmentSchema = exports.sectionEnrollmentIdParamSchema = exports.listSectionEnrollmentQuerySchema = exports.createSectionEnrollmentSchema = void 0;
const zod_1 = require("zod");
exports.createSectionEnrollmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        section_id: zod_1.z.number().int().positive(),
        student_id: zod_1.z.number().int().positive(),
        status: zod_1.z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});
exports.listSectionEnrollmentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        section_id: zod_1.z.string().regex(/^\d+$/).optional(),
        student_id: zod_1.z.string().regex(/^\d+$/).optional(),
        status: zod_1.z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});
exports.sectionEnrollmentIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateSectionEnrollmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(["enrolled", "dropped", "completed"]).optional(),
    }),
});
