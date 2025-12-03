import { Router } from "express";
import * as controller from "./submissionAnswer.controller";
import * as validation from "./submissionAnswer.validation";
import validate from "../../../middlewares/validate";

const router = Router();

// GET /submission-answers/submission/:submissionId
router.get(
    "/submission/:submissionId",
    validate(validation.getBySubmissionSchema),
    controller.getBySubmission
);

// GET /code-submission-results/:id
router.get(
    "/:id",
    validate(validation.getByIdSchema),
    controller.getById
);

// PATCH /submission-answers/:id
router.put(
    "/:id",
    validate(validation.updateSchema),
    controller.update
);


export default router;
