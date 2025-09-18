import { Router } from "express";
import { validate } from "../../middlewares/validate";
import {
    createSubjectSchema,
    listSubjectQuerySchema,
    subjectIdParamSchema,
    updateSubjectSchema,
} from "./subject.validation";
import * as controller from "./subject.controller";

const router = Router();

router.post("/", validate(createSubjectSchema), controller.create);
router.get("/", validate(listSubjectQuerySchema), controller.list);
router.get("/:id", validate(subjectIdParamSchema), controller.detail);
router.patch("/:id", validate(updateSubjectSchema), controller.update);
router.delete("/:id", validate(subjectIdParamSchema), controller.remove);

export default router;
