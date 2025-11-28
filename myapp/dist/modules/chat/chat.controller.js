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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
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
const chatService = __importStar(require("./chat.service"));
const server_1 = require("../../server");
async function sendMessage(req, res) {
    const roomId = Number(req.params.id);
    const { senderId, content } = req.body;
    const { message, notifications } = await chatService.sendMessageWithNotification(roomId, senderId, content);
    // 4. Phát realtime cho các client đang join room
    server_1.io.to(`room_${roomId}`).emit("newMessage", message);
    // 5. Phát notification cho từng user
    if (Array.isArray(notifications)) {
        notifications.forEach((n) => {
            server_1.io.to(`user_${n.userId}`).emit("newNotification", n);
        });
    }
    else {
        // notifications is not an array (e.g., Prisma BatchPayload); nothing to emit per user
    }
    res.json({ success: true, data: message });
}
// Thêm vào cuối file chat.controller.ts (trước export)
async function getChatRoomByContext(req, res) {
    const { sectionId, groupId, assignmentId } = req.query;
    const params = {};
    if (sectionId)
        params.sectionId = Number(sectionId);
    if (groupId)
        params.groupId = Number(groupId);
    if (assignmentId)
        params.assignmentId = Number(assignmentId);
    const data = await chatService.getChatRoomByContext(params);
    if (!data) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy phòng chat"
        });
    }
    res.json({ success: true, data });
}
async function getAllChatRooms(req, res) {
    const data = await chatService.getAllChatRooms();
    res.json({ success: true, data });
}
async function getChatRoomById(req, res) {
    const id = Number(req.params.id);
    const data = await chatService.getChatRoomById(id);
    res.json({ success: true, data });
}
async function createChatRoom(req, res) {
    const data = await chatService.createChatRoom(req.body);
    res.json({ success: true, data });
}
async function updateChatRoom(req, res) {
    const id = Number(req.params.id);
    const data = await chatService.updateChatRoom(id, req.body);
    res.json({ success: true, data });
}
async function deleteChatRoom(req, res) {
    const id = Number(req.params.id);
    await chatService.deleteChatRoom(id);
    res.json({ success: true });
}
// Participants
async function getParticipants(req, res) {
    const roomId = Number(req.params.id);
    const data = await chatService.getParticipants(roomId);
    res.json({ success: true, data });
}
async function addParticipant(req, res) {
    const roomId = Number(req.params.id);
    const { userId } = req.body;
    const data = await chatService.addParticipant(roomId, userId);
    res.json({ success: true, data });
}
async function removeParticipant(req, res) {
    const roomId = Number(req.params.id);
    const userId = Number(req.params.userId);
    await chatService.removeParticipant(roomId, userId);
    res.json({ success: true });
}
// Messages
async function getMessagesByRoom(req, res) {
    const roomId = Number(req.params.id);
    const data = await chatService.getMessagesByRoom(roomId);
    res.json({ success: true, data });
}
