"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = __importStar(require("./config/env"));
const client_1 = require("./prisma/client");
const socket_io_1 = require("socket.io");
const httpServer = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(httpServer, {
    cors: { origin: "http://localhost:5173", credentials: true },
});
// Khởi tạo Socket.IO
exports.io.on("connection", (socket) => {
    console.log("========================================");
    console.log("[Server] 🔌 User connected:", socket.id);
    console.log("========================================");
    // 👤 Handler cho Chat (giữ nguyên)
    socket.on("joinUser", (userId) => {
        socket.join(`user_${userId}`);
        console.log(`[Server] 👤 Socket ${socket.id} joined user_${userId}`);
    });
    socket.on("joinRoom", (roomId) => {
        socket.join(`room_${roomId}`);
        console.log(`[Server] 💬 Socket ${socket.id} joined room_${roomId}`);
    });
    // 🆕 Handler cho Groups (THÊM MỚI)
    socket.on("joinSection", (sectionId) => {
        socket.join(`section_${sectionId}`);
        console.log("========================================");
        console.log(`[Server] 📚 Socket ${socket.id} joined section_${sectionId}`);
        // Kiểm tra số client trong room
        const room = exports.io.sockets.adapter.rooms.get(`section_${sectionId}`);
        console.log(`[Server] 👥 Room section_${sectionId} now has ${room?.size || 0} clients`);
        console.log("========================================");
        // Gửi confirmation về client
        socket.emit("joinedSection", { sectionId, socketId: socket.id });
    });
    socket.on("leaveSection", (sectionId) => {
        socket.leave(`section_${sectionId}`);
        console.log(`[Server] 👋 Socket ${socket.id} left section_${sectionId}`);
    });
    socket.on("disconnect", () => {
        console.log("========================================");
        console.log("[Server] ❌ User disconnected:", socket.id);
        console.log("========================================");
    });
});
const start = async () => {
    try {
        await client_1.prisma.$connect();
        httpServer.listen(env_1.default.port, () => {
            console.log("Database url:", (0, env_1.buildDbUrl)());
            console.log(`🚀 Server running at http://localhost:${env_1.default.port}`);
            console.log(`📡 Socket.IO is ready`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server", err);
        process.exit(1);
    }
};
start();
