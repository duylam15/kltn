import { Router } from "express";
import validate from "../../middlewares/validate";
import * as validation from "./assignment.validation";
import * as controller from "./assignment.controller";
import { verifyAccessToken } from "../../middlewares/auth";

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

router.get("/sections/:sectionId/assignments", controller.bySection);

// Student
router.get("/me/my-assignments", controller.myAssignments); // sẽ truyền studentId qua query

router.post("/:id/start", controller.start); // truyền studentId trong body hoặc query

router.post(
  "/:id/submit",
  validate(validation.submitAssignmentSchema),
  controller.submit // cũng truyền studentId trong body
);


export default router;
