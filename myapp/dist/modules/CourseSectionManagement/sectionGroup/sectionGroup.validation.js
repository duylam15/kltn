"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionGroupSchema = exports.sectionGroupIdParamSchema = exports.listSectionGroupQuerySchema = exports.createSectionGroupSchema = void 0;
const zod_1 = require("zod");
exports.createSectionGroupSchema = zod_1.z.object({
    body: zod_1.z.object({
        section_id: zod_1.z.number().int().positive(),
        group_code: zod_1.z.string().max(40).optional(),
        group_name: zod_1.z.string().max(100).optional(),
        max_members: zod_1.z.number().int().positive().optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
exports.listSectionGroupQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        section_id: zod_1.z.string().regex(/^\d+$/).optional(),
        is_active: zod_1.z.enum(["true", "false"]).optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.sectionGroupIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateSectionGroupSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        group_code: zod_1.z.string().max(40).optional(),
        group_name: zod_1.z.string().max(100).optional(),
        max_members: zod_1.z.number().int().positive().optional(),
        is_active: zod_1.z.boolean().optional(),
    }),
});
