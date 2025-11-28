import { Router } from "express";
import validate from "../../../middlewares/validate";
import * as validation from "./assignment.validation";
import * as controller from "./assignment.controller";

const router = Router();

// Admin/Teacher
router.post(
    "/",
    validate(validation.createAssignmentSchema),
    controller.create
);
router.put(
    "/:id",
    validate(validation.updateAssignmentSchema),
    controller.update
);
router.delete(
    "/:id",
    validate(validation.deleteAssignmentSchema),
    controller.remove
);
router.get("/", validate(validation.listAssignmentsSchema), controller.list);
router.get(
    "/:id",
    validate(validation.getAssignmentByIdSchema),
    controller.getById
);
router.get(
    "/:id/submissions",
    validate(validation.listSubmissionsByAssignmentSchema),
    controller.submissions
);

router.get("/teacher/:teacherId", controller.getAssignmentsByTeacher);
router.get("/sections/:sectionId/assignments", controller.bySection);

// Student Routes
router.get(
    "/section/:sectionId/student/:studentId",
    controller.getAssignmentsBySectionForStudent
); 

router.post("/:id/start", controller.start);

router.post(
    "/:id/submit",
    controller.submit
);

// Student submit code (single file)
router.post(
  "/:id/submit-code",
  controller.submitCode
);

// Student submit folder (zip)
router.post(
  "/:id/submit-project",
  controller.submitProject
);

// Get answer status
router.get(
  "/answer/:answerId/status",
  controller.getAnswerStatus
);

// Gợi ý lộ trình học tập sau khi làm xong assignment
router.post(
  "/:id/recommend-path",
  controller.recommendPath
);

router.get("/suggest/cluster", controller.clusterStudents);
router.get("/answers/:answerId/result", controller.getAnswerResult);

export default router;

