"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../prisma/client");
class SocketService {
    io = null;
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: { origin: "http://localhost:5173", credentials: true },
        });
        this.io.use((socket, next) => {
            try {
                const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
                    (socket.handshake.headers.cookie || "")
                        .split(";")
                        .map((s) => s.trim())
                        .find((s) => s.startsWith("token="))
                        ?.split("=")[1];
                if (!token)
                    return next(new Error("Unauthorized"));
                const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_secret");
                socket.userId = payload.id;
                next();
            }
            catch (err) {
                next(new Error("Unauthorized"));
            }
        });
        this.io.on("connection", async (socket) => {
            const userId = socket.userId;
            // join phòng riêng để nhận notification
            socket.join(`user:${userId}`);
            // join tất cả room mà user là participant
            const rooms = await client_1.prisma.chatParticipant.findMany({
                where: { userId },
                select: { roomId: true },
            });
            rooms.forEach((r) => socket.join(`room:${r.roomId}`));
            socket.on("chat:join", (roomId) => socket.join(`room:${roomId}`));
            socket.on("chat:leave", (roomId) => socket.leave(`room:${roomId}`));
        });
        console.log("📡 Socket.IO initialized");
    }
    emitNewMessage(roomId, payload) {
        this.io?.to(`room:${roomId}`).emit("chat:message:new", payload);
    }
    emitNotification(userId, payload) {
        this.io?.to(`user:${userId}`).emit("notification:new", payload);
    }
}
const socketService = new SocketService();
exports.default = socketService;
