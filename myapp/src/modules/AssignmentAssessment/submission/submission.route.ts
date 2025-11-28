import { Router } from "express";
import * as controller from "./submission.controller";
import * as validation from "./submission.validation";
import validate from "../../../middlewares/validate";

const router = Router();

// 🗂️ Lấy tất cả bài nộp (admin)
router.get("/", controller.getAll);

// 📘 Lịch sử nộp bài của 1 student trong 1 assignment
router.get(
    "/assignment/:assignmentId/student/:studentId",
    validate(validation.getHistorySchema),
    controller.getHistory
);

// 🏆 Bài nộp điểm cao nhất của 1 student trong 1 assignment
router.get(
    "/assignment/:assignmentId/student/:studentId/best",
    validate(validation.getBestSchema),
    controller.getBest
);

// 📘 Chi tiết 1 lần nộp cụ thể
router.get("/:id", validate(validation.getByIdSchema), controller.getById);

// 🆕 Tạo bài nộp mới
router.post("/", validate(validation.createSchema), controller.create);

// ✏️ Cập nhật bài nộp (điểm, feedback,...)
router.put("/:id", validate(validation.updateSchema), controller.update);

// ❌ Xoá bài nộp
router.delete("/:id", validate(validation.deleteSchema), controller.remove);

export default router;
