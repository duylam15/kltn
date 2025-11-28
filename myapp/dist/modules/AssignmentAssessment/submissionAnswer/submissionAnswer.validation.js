"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBySubmissionSchema = void 0;
const zod_1 = require("zod");
exports.getBySubmissionSchema = zod_1.z.object({
    params: zod_1.z.object({
        submissionId: zod_1.z.string().regex(/^\d+$/),
    }),
});
