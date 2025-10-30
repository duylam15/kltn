import { Router } from "express";
import * as controller from "./codeSubmissionResult.controller";
import * as validation from "./codeSubmissionResult.validation";
import validate from "@/middlewares/validate";

const router = Router();

// GET /code-submission-results/submission/:submissionId
router.get(
    "/submission/:submissionId",
    validate(validation.getBySubmissionSchema),
    controller.getBySubmission
);

export default router;
