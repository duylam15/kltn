import { createServer } from "http";
import app from "./app";
import env, { buildDbUrl } from "./config/env";
import { prisma } from "./prisma/client";
import { Server } from "socket.io";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173", credentials: true },
});

// Khởi tạo Socket.IO
io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("joinUser", (userId: number) => {
        socket.join(`user_${userId}`);
    });

    socket.on("joinRoom", (roomId: number) => {
        socket.join(`room_${roomId}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

const start = async () => {
    try {
        await prisma.$connect();

        httpServer.listen(env.port, () => {
            console.log("Database url:", buildDbUrl());
            console.log(`🚀 Server running at http://localhost:${env.port}`);
            console.log(`📡 Socket.IO is ready`);
        });
    } catch (err) {
        console.error("❌ Failed to start server", err);
        process.exit(1);
    }
};

start();
