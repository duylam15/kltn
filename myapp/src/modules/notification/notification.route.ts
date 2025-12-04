import { Router } from "express";
import * as ctl from "./notification.controller";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();
router.use(authenticate);

// GET /api/v1/notifications/user-id - Lấy TẤT CẢ thông báo của user
router.get("/user/:userId", ctl.getAllByUserId);

// GET /api/v1/notifications/unread-count - Số thông báo chưa đọc
router.get("/unread-count", ctl.getUnreadCount);

// GET /api/v1/notifications - Lấy danh sách thông báo có phân trang (optional)
// Query params: ? unread=true&limit=20&cursor=123
router.get("/", ctl.list);

// POST /api/v1/notifications/mark-read - Đánh dấu đã đọc
router.post("/mark-read", ctl.markRead);

export default router;
