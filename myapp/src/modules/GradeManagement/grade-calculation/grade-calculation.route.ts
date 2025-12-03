import { Router } from "express";
import {
    calculateGradeSchema,
    calculateAllGradesSchema,
    previewGradeCalculationSchema,
} from "./grade-calculation.validation";
import * as controller from "./grade-calculation.controller";
import validate from "../../../middlewares/validate";

const router = Router();

router.post(
    "/calculate",
    validate(calculateGradeSchema),
    controller.calculateGrade
);
router.post(
    "/calculate-all",
    validate(calculateAllGradesSchema),
    controller.calculateAll
);
router.post(
    "/preview",
    validate(previewGradeCalculationSchema),
    controller.preview
);

export default router;
