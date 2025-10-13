import { Router } from "express";
import * as controller from "./assignmentQuestion.controller";
import * as validation from "./assignmentQuestion.validation";
import validate from "@/middlewares/validate";

const router = Router();

// Gán câu hỏi vào bài tập
router.post(
    "/assignments/:assignmentId/questions/:questionId",
    validate(validation.assignmentQuestionParams),
    controller.add
);

// Hủy gán câu hỏi khỏi bài tập
router.delete(
    "/assignments/:assignmentId/questions/:questionId",
    validate(validation.assignmentQuestionParams),
    controller.remove
);

// Lấy toàn bộ câu hỏi của 1 bài tập
router.get(
    "/assignments/:assignmentId/questions",
    validate(validation.assignmentIdParam),
    controller.getByAssignment
);

// Lấy toàn bộ bài tập có chứa 1 câu hỏi
router.get(
    "/questions/:questionId/assignments",
    validate(validation.questionIdParam),
    controller.getByQuestion
);

export default router;
