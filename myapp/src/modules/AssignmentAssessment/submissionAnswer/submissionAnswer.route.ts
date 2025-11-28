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

export default router;
