import env from "./config/env";
import app from "./app";
import { prisma } from "./prisma/client";

const start = async () => {
    try {
        await prisma.$connect();
        app.listen(env.port, () => {
            console.log(`Server running at http://localhost:${env.port}`);
        });
    } catch (err) {
        console.error("Failed to start server", err);
        process.exit(1);
    }
};

start();
