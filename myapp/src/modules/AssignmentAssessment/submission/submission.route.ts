import { Router } from "express";
import * as controller from "./submission.controller";
import * as validation from "./submission.validation";
import validate from "../../../middlewares/validate";

const router = Router();

// GET: lịch sử nộp bài của 1 student trong 1 assignment
router.get(
    "/assignment/:assignmentId/student/:studentId",
    validate(validation.getHistorySchema),
    controller.getHistory
);

// GET: chi tiết 1 lần nộp cụ thể
router.get("/:id", validate(validation.getByIdSchema), controller.getById);

export default router;
