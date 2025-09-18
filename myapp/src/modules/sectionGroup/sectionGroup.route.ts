import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createSectionGroupSchema,
    listSectionGroupQuerySchema,
    sectionGroupIdParamSchema,
    updateSectionGroupSchema,
} from "./sectionGroup.validation";
import * as controller from "./sectionGroup.controller";

const router = Router();

router.post("/", validate(createSectionGroupSchema), controller.create);
router.get("/", validate(listSectionGroupQuerySchema), controller.list);
router.get("/:id", validate(sectionGroupIdParamSchema), controller.detail);
router.patch("/:id", validate(updateSectionGroupSchema), controller.update);
router.delete("/:id", validate(sectionGroupIdParamSchema), controller.remove);
router.get("/sections/:sectionId/groups", controller.listGroupsBySection);

export default router;
