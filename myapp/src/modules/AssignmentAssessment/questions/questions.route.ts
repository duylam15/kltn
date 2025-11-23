import { Router } from "express";
import * as validation from "./questions.validation";
import * as controller from "./questions.controller";
import validate from "@/middlewares/validate";

const router = Router();

// Admin/Teacher
router.post("/", validate(validation.createQuestionSchema), controller.create);

// 🆕 API lấy câu hỏi của giảng viên theo userId
router.get(
    "/user/:userId",
    validate(validation.getQuestionsByUserIdSchema),
    controller.getQuestionsByUserId
);

// 🆕 API lấy môn học có câu hỏi của giảng viên
router.get(
    "/user/:userId/subjects",
    validate(validation.getUserSubjectsSchema),
    controller.getUserSubjects
);

// 🆕 API lấy chương theo môn học (của câu hỏi giảng viên tạo)
router.get(
    "/user/:userId/subjects/:subjectId/chapters",
    validate(validation.getUserChaptersBySubjectSchema),
    controller.getUserChaptersBySubject
);

// API chung - lấy tất cả câu hỏi (có thể dùng cho admin)
router.get(
    "/",
    validate(validation.getAllQuestionsSchema),
    controller.getAllQuestions
);

router.put(
    "/:id",
    validate(validation.updateQuestionSchema),
    controller.update
);

router.delete(
    "/:id",
    validate(validation.deleteQuestionSchema),
    controller.remove
);

router.get(
    "/:id",
    validate(validation.getQuestionByIdSchema),
    controller.getById
);

router.get("/:id/chapters", controller.getChapters);

export default router;
