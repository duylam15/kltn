import { Queue } from "bullmq";

export const queue = new Queue("judge", {
    connection: { host: "localhost", port: 6379 },
});
