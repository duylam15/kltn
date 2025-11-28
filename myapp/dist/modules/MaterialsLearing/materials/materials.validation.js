"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialIdParamSchema = exports.updateMaterialSchema = exports.createMaterialSchema = void 0;
const zod_1 = require("zod");
exports.createMaterialSchema = zod_1.z.object({
    body: zod_1.z.object({
        sectionId: zod_1.z.number(),
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        fileName: zod_1.z.string().optional(),
        filePath: zod_1.z.string().optional(),
        fileSize: zod_1.z.number().optional(),
        fileType: zod_1.z.string().optional(),
        category: zod_1.z.enum(["lecture", "slide", "exercise", "reference", "syllabus", "other"]).default("other"),
        isPublic: zod_1.z.boolean().optional(),
        uploadedBy: zod_1.z.number(),
    }),
});
exports.updateMaterialSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        fileName: zod_1.z.string().optional(),
        filePath: zod_1.z.string().optional(),
        fileSize: zod_1.z.number().optional(),
        fileType: zod_1.z.string().optional(),
        category: zod_1.z.enum(["lecture", "slide", "exercise", "reference", "syllabus", "other"]).optional(),
        isPublic: zod_1.z.boolean().optional(),
    }),
});
exports.materialIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
