import { Router } from "express";
import * as controller from "./gradeSummary.controller";

const router = Router();

router.get(
    "/student/:studentId/section/:sectionId",
    controller.getByStudentAndSection
);
router.get("/section/:sectionId", controller.getBySectionWithRanking);
router.get("/section/:sectionId/statistics", controller.getStatistics);

router.post(
    "/student/:studentId/section/:sectionId/recalculate",
    controller.recalculateForStudent
);
router.post(
    "/section/:sectionId/recalculate",
    controller.recalculateForSection
);

export default router;
