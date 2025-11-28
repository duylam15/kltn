"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = void 0;
const bullmq_1 = require("bullmq");
exports.queue = new bullmq_1.Queue("judge", {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});
