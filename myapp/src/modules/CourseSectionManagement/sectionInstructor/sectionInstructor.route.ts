import { Router } from "express";
import {
    createSectionInstructorSchema,
    listSectionInstructorQuerySchema,
    sectionInstructorParamSchema,
    updateSectionInstructorSchema,
} from "./sectionInstructor.validation";
import * as controller from "./sectionInstructor.controller";
import { requireAuth } from "@/middlewares/requireAuth";
import validate from "@/middlewares/validate";

const router = Router();

router.post("/", validate(createSectionInstructorSchema), controller.create);
router.get("/", validate(listSectionInstructorQuerySchema), controller.list);
router.get(
    "/:sectionId/:teacherId",
    validate(sectionInstructorParamSchema),
    controller.detail
);
router.patch(
    "/:sectionId/:teacherId",
    validate(updateSectionInstructorSchema),
    controller.update
);
router.delete(
    "/:sectionId/:teacherId",
    validate(sectionInstructorParamSchema),
    controller.remove
);

router.get("/section/:sectionId/teacher", requireAuth, controller.getTeacherBySection);


export default router;
