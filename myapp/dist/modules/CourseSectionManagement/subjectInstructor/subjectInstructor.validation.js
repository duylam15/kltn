"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTeachersSchema = exports.subjectIdParamSchema = exports.bulkAssignTeachersSchema = exports.bulkAssignSubjectsSchema = exports.teacherIdParamSchema = exports.updateSubjectInstructorSchema = exports.subjectInstructorParamSchema = exports.listSubjectInstructorQuerySchema = exports.assignSubjectSchema = void 0;
const zod_1 = require("zod");
exports.assignSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z.number().int().positive("Subject ID must be a positive integer"),
        teacherId: zod_1.z.number().int().positive("Teacher ID must be a positive integer"),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional().default("owner"),
    }),
});
exports.listSubjectInstructorQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        subject_id: zod_1.z.string().regex(/^\d+$/).optional(),
        teacher_id: zod_1.z.string().regex(/^\d+$/).optional(),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional(),
        is_active: zod_1.z.enum(["true", "false"]).optional(),
        subject_code: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
    }),
});
exports.subjectInstructorParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        subjectId: zod_1.z.string().regex(/^\d+$/, "Subject ID must be numeric"),
        teacherId: zod_1.z.string().regex(/^\d+$/, "Teacher ID must be numeric"),
    }),
});
exports.updateSubjectInstructorSchema = zod_1.z.object({
    params: zod_1.z.object({
        subjectId: zod_1.z.string().regex(/^\d+$/),
        teacherId: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        role: zod_1.z.enum(["owner", "co", "ta"]).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.teacherIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        teacherId: zod_1.z.string().regex(/^\d+$/, "Teacher ID must be numeric"),
    }),
});
exports.bulkAssignSubjectsSchema = zod_1.z.object({
    body: zod_1.z.object({
        teacherId: zod_1.z.number().int().positive("Teacher ID must be a positive integer"),
        subjectIds: zod_1.z
            .array(zod_1.z.number().int().positive())
            .min(1, "Must provide at least one subject ID"),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional().default("owner"),
    }),
});
// Thêm vào file subjectInstructor.validation.ts
exports.bulkAssignTeachersSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        teacherIds: zod_1.z
            .array(zod_1.z.number().int().positive())
            .min(1, "Must provide at least one teacher ID")
            .max(20, "Cannot assign more than 20 teachers at once"),
        role: zod_1.z.enum(["owner", "co", "ta"]).optional().default("co"),
    }),
});
exports.subjectIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        subjectId: zod_1.z.string().regex(/^\d+$/, "Subject ID must be numeric"),
    }),
});
exports.removeTeachersSchema = zod_1.z.object({
    body: zod_1.z.object({
        subjectId: zod_1.z
            .number()
            .int()
            .positive("Subject ID must be a positive integer"),
        teacherIds: zod_1.z
            .array(zod_1.z.number().int().positive())
            .min(1, "Must provide at least one teacher ID"),
    }),
});
