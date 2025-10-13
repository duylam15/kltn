import { Router } from "express";
import {
    createQuestionSubjectSchema,
    listQuestionSubjectQuerySchema,
    questionSubjectIdParamSchema,
    updateQuestionSubjectSchema,
} from "./questionSubject.validation";
import * as controller from "./questionSubject.controller";
import validate from "@/middlewares/validate";

const router = Router();

router.post("/", validate(createQuestionSubjectSchema), controller.create);
router.get("/", validate(listQuestionSubjectQuerySchema), controller.list);
router.get("/:id", validate(questionSubjectIdParamSchema), controller.detail);
router.patch("/:id", validate(updateQuestionSubjectSchema), controller.update);
router.delete(
    "/:id",
    validate(questionSubjectIdParamSchema),
    controller.remove
);

// 🆕 API lấy danh sách chương theo môn học
router.get(
    "/:id/chapters",
    validate(questionSubjectIdParamSchema),
    controller.getChapters
);

export default router;
