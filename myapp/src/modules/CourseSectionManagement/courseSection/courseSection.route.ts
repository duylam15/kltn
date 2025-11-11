import { Router } from "express";
import {
    createCourseSectionSchema,
    listCourseSectionQuerySchema,
    courseSectionIdParamSchema,
    updateCourseSectionSchema,
} from "./courseSection.validation";
import * as controller from "./courseSection.controller";
<<<<<<< HEAD:myapp/src/modules/CourseSectionManagement/courseSection/courseSection.route.ts
import validate from "@/middlewares/validate";

=======
import { requireAuth } from "../../middlewares/requireAuth";
>>>>>>> locdev:myapp/src/modules/courseSection/courseSection.route.ts
const router = Router();

router.post("/", validate(createCourseSectionSchema), controller.create);
router.get("/", validate(listCourseSectionQuerySchema), controller.list);
router.get("/:id", validate(courseSectionIdParamSchema), controller.detail);
router.patch("/:id", validate(updateCourseSectionSchema), controller.update);
router.delete("/:id", validate(courseSectionIdParamSchema), controller.remove);

// Join by code 
router.post("/join-public", controller.joinByCodePublic);


export default router;
