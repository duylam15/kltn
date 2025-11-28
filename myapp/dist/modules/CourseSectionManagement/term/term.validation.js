"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTermSchema = exports.termIdParamSchema = exports.listTermQuerySchema = exports.createTermSchema = void 0;
const zod_1 = require("zod");
exports.createTermSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1).max(30),
        name: zod_1.z.string().min(1).max(100),
        start_date: zod_1.z.string().datetime().optional(),
        end_date: zod_1.z.string().datetime().optional(),
    }),
});
exports.listTermQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).optional(),
        q: zod_1.z.string().optional(),
    }),
});
exports.termIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.updateTermSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/),
    }),
    body: zod_1.z.object({
        code: zod_1.z.string().min(1).max(30).optional(),
        name: zod_1.z.string().min(1).max(100).optional(),
        start_date: zod_1.z.string().datetime().optional(),
        end_date: zod_1.z.string().datetime().optional(),
    }),
});
