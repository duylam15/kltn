"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByAssignmentSchema = exports.listBySectionSchema = exports.unassignSchema = exports.assignSchema = void 0;
const zod_1 = require("zod");
exports.assignSchema = zod_1.z.object({
    body: zod_1.z.object({
        assignmentId: zod_1.z.number().int().positive(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // sectionId
    }),
});
exports.unassignSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // sectionId
        assignmentId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.listBySectionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.listByAssignmentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
