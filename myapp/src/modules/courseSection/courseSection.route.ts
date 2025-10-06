import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createCourseSectionSchema,
    listCourseSectionQuerySchema,
    courseSectionIdParamSchema,
    updateCourseSectionSchema,
} from "./courseSection.validation";
import * as controller from "./courseSection.controller";
const router = Router();

router.post("/", validate(createCourseSectionSchema), controller.create);
router.get("/", validate(listCourseSectionQuerySchema), controller.list);
router.get("/:id", validate(courseSectionIdParamSchema), controller.detail);
router.patch("/:id", validate(updateCourseSectionSchema), controller.update);
router.delete("/:id", validate(courseSectionIdParamSchema), controller.remove);

// Join by code
router.post("/join", controller.joinByCode);


export default router;
