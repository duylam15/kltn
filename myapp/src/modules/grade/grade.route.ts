import { Router } from "express";
import * as controller from "./grade.controller";
import validate from "../../middlewares/validate";
import * as validation from "./grade.validation";

const router = Router();

// Lấy bảng điểm của section
router.get(
    "/sections/:sectionId/grades",
    validate(validation.getGradesBySectionSchema),
    controller.getGradesBySection
);

// Lấy điểm của 1 sinh viên
router.get(
    "/sections/:sectionId/students/:studentId/grades",
    validate(validation.getGradesByStudentSchema),
    controller.getGradesByStudent
);

// Cập nhật điểm
router.put(
    "/grades",
    validate(validation.updateGradeSchema),
    controller.updateGrade
);

// Cập nhật nhiều điểm
router.put(
    "/grades/bulk",
    validate(validation.bulkUpdateGradesSchema),
    controller.bulkUpdateGrades
);

// Export điểm
router.get(
    "/sections/:sectionId/grades/export",
    validate(validation.exportGradesSchema),
    controller.exportGrades
);

export default router;
