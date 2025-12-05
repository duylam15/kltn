import { createServer } from "http";
import app from "./app";
import env, { buildDbUrl } from "./config/env";
import { prisma } from "./prisma/client";
import { Server } from "socket.io";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://www.quanlyhoctapsgu.cloud",
            "http://quanlyhoctapsgu.cloud",
            "http://42.96.15.24:4000", // prod (non-www)
        ],
        credentials: true,
    },
});

// Khởi tạo Socket.IO
io.on("connection", (socket) => {
    console.log("========================================");
    console.log("[Server] 🔌 User connected:", socket.id);
    console.log("========================================");

    // 👤 Handler cho User
    socket.on("joinUser", (userId: number) => {
        socket.join(`user_${userId}`);
        console.log(`[Server] 👤 Socket ${socket.id} joined user_${userId}`);
    });

    // 💬 Handler cho Chat Room
    socket.on("joinRoom", (roomId: number) => {
        socket.join(`room_${roomId}`);
        console.log(`[Server] 💬 Socket ${socket.id} joined room_${roomId}`);
    });

    // 📚 Handler cho Section
    socket.on("joinSection", (sectionId: number) => {
        socket.join(`section_${sectionId}`);
        console.log("========================================");
        console.log(
            `[Server] 📚 Socket ${socket.id} joined section_${sectionId}`
        );

        // Kiểm tra số client trong room
        const room = io.sockets.adapter.rooms.get(`section_${sectionId}`);
        console.log(
            `[Server] 👥 Room section_${sectionId} now has ${
                room?.size || 0
            } clients`
        );
        console.log("========================================");

        // Gửi confirmation về client
        socket.emit("joinedSection", { sectionId, socketId: socket.id });
    });

    socket.on("leaveSection", (sectionId: number) => {
        socket.leave(`section_${sectionId}`);
        console.log(
            `[Server] 👋 Socket ${socket.id} left section_${sectionId}`
        );
    });

    socket.on("disconnect", () => {
        console.log("========================================");
        console.log("[Server] ❌ User disconnected:", socket.id);
        console.log("========================================");
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
