"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateScoreSchema = exports.selectFinalSchema = exports.getByIdSchema = exports.getHistorySchema = void 0;
const zod_1 = require("zod");
exports.getHistorySchema = zod_1.z.object({
    params: zod_1.z.object({
        assignmentId: zod_1.z.string().regex(/^\d+$/),
        studentId: zod_1.z.string().regex(/^\d+$/),
    }),
});
exports.getByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // submissionId
    }),
});
exports.selectFinalSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/), // submissionId
    }),
});
exports.updateScoreSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "ID phải là số"), // submissionId
    }),
    body: zod_1.z.object({
        score: zod_1.z
            .union([
            zod_1.z.number(),
            zod_1.z.string().regex(/^\d+(\.\d+)?$/), // cho phép gửi dạng string số
        ])
            .optional(),
        feedback: zod_1.z.string().optional(),
    }),
});
