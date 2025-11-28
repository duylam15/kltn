import { Router } from "express";
import {
    createChatRoomSchema,
    updateChatRoomSchema,
    getChatRoomByContextSchema, // 👈 Thêm import
} from "./chat.validation";
import * as chatController from "./chat.controller";
import validate from "../../middlewares/validate";
const router = Router();

// 📌 CRUD ChatRoom
router.get("/", chatController.getAllChatRooms);

// ⚠️ ĐẶT /by-context TRƯỚC /:id
router.get(
    "/by-context",
    validate(getChatRoomByContextSchema),
    chatController.getChatRoomByContext
);

router.get("/:id", chatController.getChatRoomById); // 👈 Route này phải sau
router.post("/", validate(createChatRoomSchema), chatController.createChatRoom);
router.put(
    "/:id",
    validate(updateChatRoomSchema),
    chatController.updateChatRoom
);
router.delete("/:id", chatController.deleteChatRoom);

// 📌 Messages trong phòng
router.get("/:id/messages", chatController.getMessagesByRoom);
router.post("/:id/messages", chatController.sendMessage);

// 📌 Participants
router.get("/:id/participants", chatController.getParticipants);
router.post("/:id/participants", chatController.addParticipant);
router.delete("/:id/participants/:userId", chatController.removeParticipant);

export default router;
