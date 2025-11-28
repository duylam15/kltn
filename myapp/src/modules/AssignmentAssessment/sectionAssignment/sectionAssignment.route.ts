import { Router } from "express";
import * as controller from "./sectionAssignment.controller";
import * as validation from "./sectionAssignment.validation";
import validate from "../../../middlewares/validate";

const router = Router();

router.patch(
    "/sections/:sectionId/assignments/:assignmentId/visibility",
    controller.toggleVisibility
);
// Gán assignment vào section
router.post(
    "/sections/:id/assignments",
    validate(validation.assignSchema),
    controller.assignToSection
);

// Gỡ assignment khỏi section
router.delete(
    "/sections/:id/assignments/:assignmentId",
    validate(validation.unassignSchema),
    controller.unassignFromSection
);

// Lấy assignments trong 1 section
router.get(
    "/sections/:id/assignments",
    validate(validation.listBySectionSchema),
    controller.listBySection
);

// Lấy các section có gán 1 assignment
router.get(
    "/assignments/:id/sections",
    validate(validation.listByAssignmentSchema),
    controller.listByAssignment
);

export default router;
