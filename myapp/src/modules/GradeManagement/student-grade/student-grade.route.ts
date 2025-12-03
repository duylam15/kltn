import { Router } from "express";
import {
    listStudentGradeQuerySchema,
    updateStudentGradeSchema,
    bulkUpdateStudentGradesSchema,
    studentGradeReportSchema,
} from "./student-grade.validation";
import * as controller from "./student-grade.controller";
import validate from "../../../middlewares/validate";

const router = Router();

router.get("/", validate(listStudentGradeQuerySchema), controller.list);
router.get("/detail", controller.detail);
router.get("/report", validate(studentGradeReportSchema), controller.report);
router.patch("/", validate(updateStudentGradeSchema), controller.update);
router.get("/gradebook/:sectionId", controller.getSectionGradebook);

router.patch(
    "/bulk",
    validate(bulkUpdateStudentGradesSchema),
    controller.bulkUpdate
);

export default router;
