"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageWithNotification = sendMessageWithNotification;
exports.getChatRoomByContext = getChatRoomByContext;
exports.getAllChatRooms = getAllChatRooms;
exports.getChatRoomById = getChatRoomById;
exports.createChatRoom = createChatRoom;
exports.updateChatRoom = updateChatRoom;
exports.deleteChatRoom = deleteChatRoom;
exports.getParticipants = getParticipants;
exports.addParticipant = addParticipant;
exports.removeParticipant = removeParticipant;
exports.getMessagesByRoom = getMessagesByRoom;
exports.sendMessage = sendMessage;
const client_1 = require("../../prisma/client");
async function sendMessageWithNotification(roomId, senderId, content) {
    // 1. Lưu message
    const message = await client_1.prisma.chatMessage.create({
        data: { roomId, senderId, content },
        include: { sender: true },
    });
    // 2. Lấy danh sách participants khác (ngoại trừ người gửi)
    const participants = await client_1.prisma.chatParticipant.findMany({
        where: { roomId, NOT: { userId: senderId } },
        select: { userId: true },
    });
    // 3. Tạo notifications cho họ
    const notifications = await client_1.prisma.notification.createMany({
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
// Thêm vào cuối file chat.service.ts
async function getChatRoomByContext(params) {
    const { sectionId, groupId, assignmentId } = params;
    let where = {};
    if (sectionId) {
        where = { type: "section", sectionId };
    }
    else if (groupId) {
        where = { type: "group", groupId };
    }
    else if (assignmentId) {
        where = { type: "assignment", assignmentId };
    }
    const chatRoom = await client_1.prisma.chatRoom.findFirst({
        where,
        include: {
            participants: {
                include: { user: true },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: { sender: true },
            },
        },
    });
    return chatRoom;
}
async function getAllChatRooms() {
    return client_1.prisma.chatRoom.findMany({
        include: { participants: true, messages: true },
    });
}
async function getChatRoomById(id) {
    return client_1.prisma.chatRoom.findUnique({
        where: { id },
        include: { participants: true, messages: true },
    });
}
async function createChatRoom(data) {
    return client_1.prisma.chatRoom.create({ data });
}
async function updateChatRoom(id, data) {
    return client_1.prisma.chatRoom.update({ where: { id }, data });
}
async function deleteChatRoom(id) {
    return client_1.prisma.chatRoom.delete({ where: { id } });
}
// Participants
async function getParticipants(roomId) {
    return client_1.prisma.chatParticipant.findMany({ where: { roomId } });
}
async function addParticipant(roomId, userId) {
    return client_1.prisma.chatParticipant.create({
        data: { roomId, userId },
    });
}
async function removeParticipant(roomId, userId) {
    return client_1.prisma.chatParticipant.delete({
        where: { roomId_userId: { roomId, userId } },
    });
}
// Messages
async function getMessagesByRoom(roomId) {
    return client_1.prisma.chatMessage.findMany({
        where: { roomId },
        include: { sender: true },
        orderBy: { createdAt: "asc" },
    });
}
async function sendMessage(roomId, senderId, content) {
    return client_1.prisma.chatMessage.create({
        data: { roomId, senderId, content },
    });
}
