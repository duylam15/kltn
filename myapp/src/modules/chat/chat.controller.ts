import { Request, Response } from "express";
import * as chatService from "./chat.service";
import { io } from "@/server";


export async function sendMessage(req: Request, res: Response) {
    const roomId = Number(req.params.id);
    const { senderId, content } = req.body;

    const { message, notifications } =
        await chatService.sendMessageWithNotification(
            roomId,
            senderId,
            content
        );

    // 4. Phát realtime cho các client đang join room
    io.to(`room_${roomId}`).emit("newMessage", message);

    // 5. Phát notification cho từng user
    if (Array.isArray(notifications)) {
        notifications.forEach((n: any) => {
            io.to(`user_${n.userId}`).emit("newNotification", n);
        });
    } else {
        // notifications is not an array (e.g., Prisma BatchPayload); nothing to emit per user
    }

    res.json({ success: true, data: message });
}

// Thêm vào cuối file chat.controller.ts (trước export)
export async function getChatRoomByContext(req: Request, res: Response) {
    const { sectionId, groupId, assignmentId } = req.query;

    const params: any = {};
    if (sectionId) params.sectionId = Number(sectionId);
    if (groupId) params.groupId = Number(groupId);
    if (assignmentId) params.assignmentId = Number(assignmentId);

    const data = await chatService.getChatRoomByContext(params);
    
    if (!data) {
        return res.status(404).json({ 
            success: false, 
            message: "Không tìm thấy phòng chat" 
        });
    }

    res.json({ success: true, data });
}

export async function getAllChatRooms(req: Request, res: Response) {
    const data = await chatService.getAllChatRooms();
    res.json({ success: true, data });
}

export async function getChatRoomById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await chatService.getChatRoomById(id);
    res.json({ success: true, data });
}

export async function createChatRoom(req: Request, res: Response) {
    const data = await chatService.createChatRoom(req.body);
    res.json({ success: true, data });
}

export async function updateChatRoom(req: Request, res: Response) {
    const id = Number(req.params.id);
    const data = await chatService.updateChatRoom(id, req.body);
    res.json({ success: true, data });
}

export async function deleteChatRoom(req: Request, res: Response) {
    const id = Number(req.params.id);
    await chatService.deleteChatRoom(id);
    res.json({ success: true });
}

// Participants
export async function getParticipants(req: Request, res: Response) {
    const roomId = Number(req.params.id);
    const data = await chatService.getParticipants(roomId);
    res.json({ success: true, data });
}

export async function addParticipant(req: Request, res: Response) {
    const roomId = Number(req.params.id);
    const { userId } = req.body;
    const data = await chatService.addParticipant(roomId, userId);
    res.json({ success: true, data });
}

export async function removeParticipant(req: Request, res: Response) {
    const roomId = Number(req.params.id);
    const userId = Number(req.params.userId);
    await chatService.removeParticipant(roomId, userId);
    res.json({ success: true });
}

// Messages
export async function getMessagesByRoom(req: Request, res: Response) {
    const roomId = Number(req.params.id);
    const data = await chatService.getMessagesByRoom(roomId);
    res.json({ success: true, data });
}

