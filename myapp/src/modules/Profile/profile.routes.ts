// src/modules/Profile/profile.routes.ts
import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
} from "./profile.controller";

const router = Router();

// KHÔNG dùng req.user nữa, dùng userId trên URL
router.get("/:userId", getMyProfile);
router.put("/:userId", updateMyProfile);
router.post("/:userId/avatar", uploadMyAvatar);
router.delete("/:userId/avatar", deleteMyAvatar);

export default router;
