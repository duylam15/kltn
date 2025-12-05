import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client";

type JwtPayload = { id: number; email: string };

class SocketService {
    private io: Server | null = null;

    initialize(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
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

        this.io.use((socket, next) => {
            try {
                const token =
                    socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace(
                        "Bearer ",
                        ""
                    ) ||
                    (socket.handshake.headers.cookie || "")
                        .split(";")
                        .map((s) => s.trim())
                        .find((s) => s.startsWith("token="))
                        ?.split("=")[1];

                if (!token) return next(new Error("Unauthorized"));
                const payload = jwt.verify(
                    token,
                    process.env.JWT_SECRET || "default_secret"
                ) as JwtPayload;

                (socket as any).userId = payload.id;
                next();
            } catch (err) {
                next(new Error("Unauthorized"));
            }
        });

        this.io.on("connection", async (socket) => {
            const userId = (socket as any).userId as number;

            // join phòng riêng để nhận notification
            socket.join(`user:${userId}`);

            // join tất cả room mà user là participant
            const rooms = await prisma.chatParticipant.findMany({
                where: { userId },
                select: { roomId: true },
            });
            rooms.forEach((r) => socket.join(`room:${r.roomId}`));

            socket.on("chat:join", (roomId: number) =>
                socket.join(`room:${roomId}`)
            );
            socket.on("chat:leave", (roomId: number) =>
                socket.leave(`room:${roomId}`)
            );
        });

        console.log("📡 Socket.IO initialized");
    }

    emitNewMessage(roomId: number, payload: any) {
        this.io?.to(`room:${roomId}`).emit("chat:message:new", payload);
    }

    emitNotification(userId: number, payload: any) {
        this.io?.to(`user:${userId}`).emit("notification:new", payload);
    }
}

const socketService = new SocketService();
export default socketService;
