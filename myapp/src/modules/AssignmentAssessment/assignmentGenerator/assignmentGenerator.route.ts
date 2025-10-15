import { Router } from "express";
import {
    generateAssignmentQuestionsSchema,
    previewGeneratedQuestionsSchema,
} from "./assignmentGenerator.validation";
import * as controller from "./assignmentGenerator.controller";
import validate from "@/middlewares/validate";

const router = Router();

// Tạo đề thi tự động
router.post(
    "/generate",
    validate(generateAssignmentQuestionsSchema),
    controller.generate
);

// Preview trước khi tạo
router.post(
    "/preview",
    validate(previewGeneratedQuestionsSchema),
    controller.preview
);

export default router;
