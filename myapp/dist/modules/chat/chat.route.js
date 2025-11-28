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
const express_1 = require("express");
const chat_validation_1 = require("./chat.validation");
const chatController = __importStar(require("./chat.controller"));
const validate_1 = __importDefault(require("../../middlewares/validate"));
const router = (0, express_1.Router)();
// 📌 CRUD ChatRoom
router.get("/", chatController.getAllChatRooms);
// ⚠️ ĐẶT /by-context TRƯỚC /:id
router.get("/by-context", (0, validate_1.default)(chat_validation_1.getChatRoomByContextSchema), chatController.getChatRoomByContext);
router.get("/:id", chatController.getChatRoomById); // 👈 Route này phải sau
router.post("/", (0, validate_1.default)(chat_validation_1.createChatRoomSchema), chatController.createChatRoom);
router.put("/:id", (0, validate_1.default)(chat_validation_1.updateChatRoomSchema), chatController.updateChatRoom);
router.delete("/:id", chatController.deleteChatRoom);
// 📌 Messages trong phòng
router.get("/:id/messages", chatController.getMessagesByRoom);
router.post("/:id/messages", chatController.sendMessage);
// 📌 Participants
router.get("/:id/participants", chatController.getParticipants);
router.post("/:id/participants", chatController.addParticipant);
router.delete("/:id/participants/:userId", chatController.removeParticipant);
exports.default = router;
