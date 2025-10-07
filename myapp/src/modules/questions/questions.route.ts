import { Router } from "express";
import validate from "../../middlewares/validate";
import * as validation from "./questions.validation";
import * as controller from "./questions.controller";

const router = Router();

// Admin/Teacher
router.post(
  "/",
  validate(validation.createQuestionSchema),
  controller.create
);

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

export default router;
