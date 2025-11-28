import { Queue } from "bullmq";

export const queue = new Queue("judge", {
    connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});
