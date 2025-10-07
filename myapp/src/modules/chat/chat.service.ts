import { prisma } from "../../prisma/client";


export async function sendMessageWithNotification(
    roomId: number,
    senderId: number,
    content: string
) {
    // 1. Lưu message
    const message = await prisma.chatMessage.create({
        data: { roomId, senderId, content },
        include: { sender: true },
    });

    // 2. Lấy danh sách participants khác (ngoại trừ người gửi)
    const participants = await prisma.chatParticipant.findMany({
        where: { roomId, NOT: { userId: senderId } },
        select: { userId: true },
    });

    // 3. Tạo notifications cho họ
    const notifications = await prisma.notification.createMany({
        data: participants.map((p) => ({
            userId: p.userId,
            type: "chat", // 👈 thêm enum NotificationType.chat
            title: `Tin nhắn mới từ ${message.sender.fullName}`,
            message: content,
            chatMessageId: message.id,
        })),
    });

    return { message, notifications };
}

export async function getAllChatRooms() {
    return prisma.chatRoom.findMany({
        include: { participants: true, messages: true },
    });
}

export async function getChatRoomById(id: number) {
    return prisma.chatRoom.findUnique({
        where: { id },
        include: { participants: true, messages: true },
    });
}

export async function createChatRoom(data: any) {
    return prisma.chatRoom.create({ data });
}

export async function updateChatRoom(id: number, data: any) {
    return prisma.chatRoom.update({ where: { id }, data });
}

export async function deleteChatRoom(id: number) {
    return prisma.chatRoom.delete({ where: { id } });
}

// Participants
export async function getParticipants(roomId: number) {
    return prisma.chatParticipant.findMany({ where: { roomId } });
}

export async function addParticipant(roomId: number, userId: number) {
    return prisma.chatParticipant.create({
        data: { roomId, userId },
    });
}

export async function removeParticipant(roomId: number, userId: number) {
    return prisma.chatParticipant.delete({
        where: { roomId_userId: { roomId, userId } },
    });
}

// Messages
export async function getMessagesByRoom(roomId: number) {
    return prisma.chatMessage.findMany({
        where: { roomId },
        include: { sender: true },
        orderBy: { createdAt: "asc" },
    });
}

export async function sendMessage(
    roomId: number,
    senderId: number,
    content: string
) {
    return prisma.chatMessage.create({
        data: { roomId, senderId, content },
    });
}
