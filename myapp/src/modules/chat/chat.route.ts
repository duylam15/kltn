import { Router } from "express";
import validate from "../../middlewares/validate";
import {
    createChatRoomSchema,
    updateChatRoomSchema,
} from "./chat.validation";
import * as chatController from "./chat.controller";
const router = Router();

// 📌 CRUD ChatRoom
router.get("/", chatController.getAllChatRooms);
router.get("/:id", chatController.getChatRoomById);
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
