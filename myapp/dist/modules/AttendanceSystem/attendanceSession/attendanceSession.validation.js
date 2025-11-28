"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionSchema = void 0;
const zod_1 = require("zod");
exports.createSessionSchema = zod_1.z.object({
    sectionId: zod_1.z.number(),
    expiresAt: zod_1.z.string().datetime().optional(),
});
